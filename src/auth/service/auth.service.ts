/*
 * Copyright (C) 2016 - present Juergen Zimmermann, Hochschule Karlsruhe
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import { AuthorizationInvalidError, TokenInvalidError } from './errors';
// Alternativen zu bcrypt:
//  scrypt: https://www.tarsnap.com/scrypt.html
//  Argon2: https://github.com/p-h-c/phc-winner-argon2
//  SHA-Algorithmen und PBKDF2 sind anfaelliger bei Angriffen mittels GPUs
//  http://blog.rangle.io/how-to-store-user-passwords-and-overcome-security-threats-in-2017
//  https://stormpath.com/blog/secure-password-hashing-in-node-with-argon2
import { compareSync, genSaltSync, hashSync } from 'bcrypt';
import {
    logger,
    privateKey,
    secret,
    secretOrPublicKey,
    signOptions,
    verifyOptions,
} from '../../shared';
import { sign, verify } from 'jsonwebtoken';
import JSON5 from 'json5';
import type { Request } from 'express';
import { RoleService } from './role.service';
import type { SignOptions } from 'jsonwebtoken';
import type { User } from './user.service';
import { UserService } from './user.service';
// UUID v4: random
// https://github.com/uuidjs/uuid
import { v4 as uuid } from 'uuid';

interface LoginResult {
    token: string;
    expiresIn: string | number | undefined;
    roles?: readonly string[];
}

export class AuthService {
    private readonly roleService = new RoleService();

    private readonly userService = new UserService();

    login(body: any) {
        // ein verschluesseltes Passwort fuer Testzwecke ausgeben
        // this.hashPassword('p');

        logger.silly(`body: ${JSON5.stringify(body)}`);
        // req.body.username: any
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const {
            username,
            password,
        }: {
            username: string | undefined;
            password: string | undefined;
        } = body;
        logger.silly(`username: ${username}`);
        if (username === undefined || password === undefined) {
            return;
        }
        const user = this.userService.findByUsername(username);
        logger.debug(`user: ${JSON5.stringify(user)}`);

        logger.silly(`password: ${password}`);
        if (!this.checkPassword(user, password)) {
            return;
        }

        const secretOrPrivateKey =
            privateKey === undefined ? secret : privateKey;
        const options: SignOptions = {
            // spread properties
            ...signOptions,
            subject: user?.id,
            jwtid: uuid(),
        };
        const token = sign({}, secretOrPrivateKey, options);

        const result: LoginResult = {
            token,
            expiresIn: options.expiresIn,
            roles: user?.roles,
        };
        logger.debug(`AuthService.login(): result=${JSON5.stringify(result)}`);
        return result;
    }

    // Error gemaess OAuth 2: TokenExpiredError und JsonWebTokenError
    // https://tools.ietf.org/html/rfc6749#section-5.2
    // https://tools.ietf.org/html/rfc6750#section-3.1
    validateJwt(req: Request) {
        // Authorization   Bearer ...
        // https://tools.ietf.org/html/rfc7230
        // http://www.w3.org/Protocols/rfc2616/rfc2616-sec4.html#sec4.2
        const { token } = req;

        // Keine "Timing Attack" durch zeichenweises Vergleichen, wenn
        // unterschiedliche Antwortzeiten bei 403 entstehen
        // https://snyk.io/blog/node-js-timing-attack-ccc-ctf
        // Eine von Error abgeleitete Klasse hat die Property "message"
        // eslint-disable-next-line security/detect-possible-timing-attacks
        if (token === undefined) {
            logger.silly(
                'AuthService.validateJwt(): Fehler beim Header-Field Authorization',
            );
            throw new AuthorizationInvalidError(
                'Fehler beim Header-Field Authorization',
            );
        }
        logger.silly(`AuthService.validateJwt(): token = ${token}`);

        const decoded = verify(token, secretOrPublicKey, verifyOptions);
        logger.debug(
            'AuthService.validateJwt(): Der JWT-Token wurde decodiert: ' +
                `${JSON5.stringify(decoded)}`,
        );

        // Destructuring fuer sub(ject): decoded ist vom Typ "object | string"
        const tmpDecoded: unknown = decoded;
        const { sub } = tmpDecoded as { sub: string };
        logger.debug(`AuthService.validateJwt(): sub: ${sub}`);

        const user = this.userService.findById(sub);
        if (user === undefined) {
            logger.silly(`AuthService.validateJwt(): Falsche User-Id: ${sub}`);
            throw new TokenInvalidError(`Falsche User-Id: ${sub}`);
        }

        // Request-Objekt um user erweitern:
        // fuer die spaetere Ermittlung der Rollen nutzen
        (req as any).user = user;
    }

    // bereits erledigt durch Validierung des Tokens
    // Basic Authentifizierung: ueberladen bzw. neu implementieren
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    isLoggedIn(_: Request) {
        logger.debug('AuthService.isLoggedIn(): ok');
        return true;
    }

    hasAnyRole(req: Request, roles: readonly string[]) {
        const rolesNormalized = this.roleService.getNormalizedRoles(roles);
        const result = this.userHasAnyRole((req as any).user, rolesNormalized);
        logger.debug(`AuthService.hasAnyRole(): ${result}`);
        return result;
    }

    userHasAnyRole(user: User | undefined, roles: readonly string[]) {
        if (user === undefined || user.roles === undefined) {
            return false;
        }
        if (roles.length === 0) {
            return true;
        }

        const userRoles = user.roles;
        return roles.filter((role) => userRoles.includes(role)).length !== 0;
    }

    checkPassword(user: User | undefined, password: string) {
        if (user === undefined) {
            logger.debug('AuthService.checkPassword(): Kein User-Objekt');
            return false;
        }

        // Beispiel:
        //  $2a$12$50nIBzoTSmFEDGI8nM2iYOO66WNdLKq6Zzhrswo6p1MBmkER5O/CO
        //  $ als Separator
        //  2a: Version von bcrypt
        //  12: 2**12 Iterationen
        //  die ersten 22 Zeichen kodieren einen 16-Byte Wert fuer den Salt
        //  danach das chiffrierte Passwort
        const result = compareSync(password, user.password);
        logger.debug(`AuthService.checkPassword(): ${result}`);
        return result;
    }

    hashPassword(password: string) {
        const salt = genSaltSync();
        const hash = hashSync(password, salt);
        logger.warn(`Verschluesseltes Password: ${hash}`);
    }
}
