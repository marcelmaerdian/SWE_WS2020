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

import {
    AuthService,
    AuthorizationInvalidError,
    TokenInvalidError,
} from '../service';
import { HttpStatus, logger } from '../../shared';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import type { NextFunction, Request, Response } from 'express';
import JSON5 from 'json5';

class AuthenticationRequestHandler {
    private readonly authService = new AuthService();

    login(req: Request, res: Response) {
        const loginResult = this.authService.login(req.body);
        if (loginResult === undefined) {
            logger.debug('AuthRequestHandler.login(): 401');
            res.sendStatus(HttpStatus.UNAUTHORIZED);
            return;
        }

        logger.debug(
            `AuthRequestHandler.login(): ${JSON5.stringify(loginResult)}`,
        );
        res.json(loginResult).status(HttpStatus.OK);
    }

    validateJwt(req: Request, res: Response, next: NextFunction) {
        try {
            this.authService.validateJwt(req);
        } catch (err: unknown) {
            if (err instanceof TokenExpiredError) {
                logger.debug('AuthRequestHandler.validateJwt(): 401');
                res.header(
                    'WWW-Authenticate',
                    `Bearer realm="acme.com", error="invalid_token", error_description="${err.message}"`,
                );
                res.status(HttpStatus.UNAUTHORIZED).send(err.message);
                return;
            }

            // message bei JsonWebTokenError:
            //  jwt malformed
            //  jwt signature is required
            //  invalid signature
            //  jwt audience invalid. expected: [OPTIONS AUDIENCE]
            //  jwt issuer invalid. expected: [OPTIONS ISSUER]
            //  jwt id invalid. expected: [OPTIONS JWT ID]
            //  jwt subject invalid

            if (
                err instanceof JsonWebTokenError ||
                err instanceof AuthorizationInvalidError ||
                err instanceof TokenInvalidError
            ) {
                logger.debug(
                    `AuthRequestHandler.validateJwt(): 401: ${err.name}, ${err.message}`,
                );
                res.sendStatus(HttpStatus.UNAUTHORIZED);
                return;
            }

            res.sendStatus(HttpStatus.INTERNAL_ERROR);
            return;
        }

        logger.debug('AuthRequestHandler.validateJwt(): ok');
        next();
    }

    isLoggedIn(req: Request, res: Response, next: NextFunction) {
        if (!this.authService.isLoggedIn(req)) {
            logger.debug('AuthRequestHandler.isLoggedIn(): 401');
            res.sendStatus(HttpStatus.UNAUTHORIZED);
            return;
        }

        logger.debug('AuthRequestHandler.isLoggedIn(): ok');
        // Verarbeitung fortsetzen
        next();
    }
}

const handler = new AuthenticationRequestHandler();

export const login = (req: Request, res: Response) => handler.login(req, res);

export const validateJwt = (req: Request, res: Response, next: NextFunction) =>
    handler.validateJwt(req, res, next);

export const isLoggedIn = (req: Request, res: Response, next: NextFunction) =>
    handler.isLoggedIn(req, res, next);
