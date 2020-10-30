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

import type { NextFunction, Request, Response } from 'express';
import { HttpStatus } from './httpStatus';
import JSON5 from 'json5';
import { logger } from './logger';
import validator from 'validator';

class SharedRequestHandler {
    private static readonly SPACE = 2;

    logRequestHeader(req: Request, _: Response, next: NextFunction) {
        logger.debug(
            `Request: headers=${JSON5.stringify(
                req.headers,
                undefined,
                SharedRequestHandler.SPACE,
            )}`,
        );
        logger.debug(
            `Request: protocol=${JSON5.stringify(
                req.protocol,
                undefined,
                SharedRequestHandler.SPACE,
            )}`,
        );
        logger.debug(
            `Request: hostname=${JSON5.stringify(
                req.hostname,
                undefined,
                SharedRequestHandler.SPACE,
            )}`,
        );
        logger.debug(
            `Request: body=${JSON5.stringify(
                req.body,
                undefined,
                SharedRequestHandler.SPACE,
            )}`,
        );

        // Alle Keys vom Request Header
        Object.keys(req).forEach((key) => {
            if (Object.prototype.hasOwnProperty.call(req, key)) {
                logger.log('silly', `Request-Key: ${key}`);
            }
        });

        // Request-Verarbeitung fortsetzen
        next();
    }

    // Der Typ "unknown" repraesentiert irgendeinen Wert genauso wie "any",
    // aber auf dem Wert kann man keine Funktionen aufrufen und auch auf keine
    // Properties zugreifen, d.h. es muss vorher ein Typecast durchgefuehrt werden
    // eslint-disable-next-line max-params
    validateUUID(_: Request, res: Response, next: NextFunction, id: unknown) {
        if (typeof id !== 'string') {
            res.status(HttpStatus.BAD_REQUEST).send('Keine gueltige Buch-ID');
        }
        const idStr = id as string;
        if (validator.isUUID(idStr)) {
            logger.debug('SharedRequestHandler.validateUUID(): isUUID');
            next();
            return;
        }

        logger.debug('SharedRequestHandler.validateUUID(): status=BAD_REQUEST');
        res.status(HttpStatus.BAD_REQUEST).send(
            `${idStr} ist keine gueltige Buch-ID`,
        );
    }

    validateContentType(req: Request, res: Response, next: NextFunction) {
        const contentType = req.header('Content-Type');
        if (contentType === undefined || validator.isMimeType(contentType)) {
            logger.debug('SharedRequestHandler.validateContentType(): ok');
            next();
            return;
        }

        logger.debug(
            'SharedRequestHandler.validateContentType(): status=BAD_REQUEST',
        );
        res.status(HttpStatus.BAD_REQUEST).send(
            `${contentType} ist kein gueltiger MIME-Typ`,
        );
    }

    notFound(_: Request, res: Response) {
        res.sendStatus(HttpStatus.NOT_FOUND);
    }

    internalError(err: unknown, _: Request, res: Response) {
        logger.error(
            `SharedRequestHandler.internalError(): error=${JSON5.stringify(
                err,
            )}`,
        );
        res.sendStatus(HttpStatus.INTERNAL_ERROR);
    }

    notYetImplemented(_: Request, res: Response) {
        logger.error('SharedRequestHandler.notYetImplemented()');
        res.sendStatus(HttpStatus.NOT_YET_IMPLEMENTED);
    }
}
const handler = new SharedRequestHandler();

// -----------------------------------------------------------------------
// E x p o r t i e r t e   F u n c t i o n s
// -----------------------------------------------------------------------
export const logRequestHeader = (
    req: Request,
    res: Response,
    next: NextFunction,
) => handler.logRequestHeader(req, res, next);

export const validateContentType = (
    req: Request,
    res: Response,
    next: NextFunction,
) => handler.validateContentType(req, res, next);

// Der Typ "unknown" repraesentiert irgendeinen Wert genauso wie "any",
// aber auf dem Wert kann man keine Funktionen aufrufen und auch auf keine
// Properties zugreifen, d.h. es muss vorher ein Typecast durchgefuehrt werden
export const validateUUID = (
    req: Request,
    res: Response,
    next: NextFunction,
    id: unknown,
) => handler.validateUUID(req, res, next, id); // eslint-disable-line max-params

export const notFound = (req: Request, res: Response) =>
    handler.notFound(req, res);

export const internalError = (err: unknown, req: Request, res: Response) =>
    handler.internalError(err, req, res);

export const notYetImplemented = (req: Request, res: Response) =>
    handler.notYetImplemented(req, res);

// https://github.com/expressjs/express/issues/2259
// https://github.com/expressjs/express/pull/2431
// https://strongloop.com/strongblog/async-error-handling-expressjs-es7-promises-generators
export const wrap = (fn: any) => (...args: any[]) => fn(...args).catch(args[2]); // eslint-disable-line @typescript-eslint/no-unsafe-return
