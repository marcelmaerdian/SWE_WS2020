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

/* eslint-disable max-classes-per-file */

// Statt JWT (nahezu) komplett zu implementieren, koennte man z.B. Passport
// verwenden
import { logger } from '../../shared';

// http://stackoverflow.com/questions/1382107/whats-a-good-way-to-extend-error-in-javascript#answer-5251506
// https://developer.mozilla.org/de/docs/Web/JavaScript/Reference/Global_Objects/Error

export class AuthorizationInvalidError extends Error {
    constructor(message: string) {
        super(message);
        logger.silly('AuthorizationInvalidError.constructor()');
        this.name = 'AuthorizationInvalidError';
        Object.setPrototypeOf(this, new.target.prototype);
        Error.captureStackTrace(this);
    }
}

export class TokenInvalidError extends Error {
    constructor(message: string) {
        super(message);
        logger.silly('TokenInvalidError.constructor()');
        this.name = 'TokenInvalidError';
        Object.setPrototypeOf(this, new.target.prototype);
        Error.captureStackTrace(this);
    }
}

/* eslint-enable max-classes-per-file */
