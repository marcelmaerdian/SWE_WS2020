/* eslint-disable max-lines */

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

import type { FilmData, ValidationErrorMsg } from '../entity';
import {
    FilmInvalid,
    FilmNotExists,
    FilmService,
    FilmServiceError,
    ProdnrExists,
    TitelExists,
    VersionInvalid,
    VersionOutdated,
} from '../service';
import type { CreateError, UpdateError } from '../service';
import { HttpStatus, getBaseUri, logger, mimeConfig } from '../../shared';
import type { Request, Response } from 'express';
import JSON5 from 'json5';

// export bei async und await:
// https://blogs.msdn.microsoft.com/typescript/2015/11/30/announcing-typescript-1-7
// http://tc39.github.io/ecmascript-export
// https://nemethgergely.com/async-function-best-practices#Using-async-functions-with-express

export class FilmRequestHandler {
    // Dependency Injection ggf. durch
    // * Awilix https://github.com/jeffijoe/awilix
    // * InversifyJS https://github.com/inversify/InversifyJS
    // * Node Dependency Injection https://github.com/zazoomauro/node-dependency-injection
    // * BottleJS https://github.com/young-steveo/bottlejs
    private readonly service = new FilmService();

    // vgl Kotlin: Schluesselwort "suspend"
    // eslint-disable-next-line max-statements
    async findById(req: Request, res: Response) {
        const versionHeader = req.header('If-None-Match');
        logger.debug(
            `FilmRequestHandler.findById(): versionHeader=${versionHeader}`,
        );
        const { id } = req.params;
        logger.debug(`FilmRequestHandler.findById(): id=${id}`);

        let film: FilmData | undefined;
        try {
            // vgl. Kotlin: Aufruf einer suspend-Function
            film = await this.service.findById(id);
        } catch (err: unknown) {
            // Exception einer export async function bei der Ausfuehrung fangen:
            // https://strongloop.com/strongblog/comparing-node-js-promises-trycatch-zone-js-angular
            logger.error(
                `FilmRequestHandler.findById(): error=${JSON5.stringify(err)}`,
            );
            res.sendStatus(HttpStatus.INTERNAL_ERROR);
            return;
        }

        if (film === undefined) {
            logger.debug('FilmRequestHandler.findById(): status=NOT_FOUND');
            res.sendStatus(HttpStatus.NOT_FOUND);
            return;
        }

        logger.debug(
            `FilmRequestHandler.findById(): film=${JSON5.stringify(film)}`,
        );
        const versionDb = film.__v;
        if (versionHeader === `"${versionDb}"`) {
            res.sendStatus(HttpStatus.NOT_MODIFIED);
            return;
        }
        logger.debug(`FilmRequestHandler.findById(): VersionDb=${versionDb}`);
        res.header('ETag', `"${versionDb}"`);

        const baseUri = getBaseUri(req);
        // HATEOAS: Atom Links
        // eslint-disable-next-line no-underscore-dangle
        film._links = {
            self: { href: `${baseUri}/${id}` },
            list: { href: `${baseUri}` },
            add: { href: `${baseUri}` },
            update: { href: `${baseUri}/${id}` },
            remove: { href: `${baseUri}/${id}` },
        };

        delete film._id;
        delete film.__v;
        delete film.createdAt;
        delete film.updatedAt;
        res.json(film);
    }

    async find(req: Request, res: Response) {
        // z.B. https://.../filme?titel=Alpha
        // => req.query = { titel: "Alpha' }
        const { query } = req;
        logger.debug(
            `FilmRequestHandler.find(): queryParams=${JSON5.stringify(query)}`,
        );

        let filme: FilmData[];
        try {
            filme = await this.service.find(query);
        } catch (err: unknown) {
            logger.error(
                `FilmRequestHandler.find(): error=${JSON5.stringify(err)}`,
            );
            res.sendStatus(HttpStatus.INTERNAL_ERROR);
            return;
        }

        logger.debug(
            `FilmRequestHandler.find(): filme=${JSON5.stringify(filme)}`,
        );
        if (filme.length === 0) {
            // Alternative: https://www.npmjs.com/package/http-errors
            // Damit wird aber auch der Stacktrace zum Client
            // uebertragen, weil das resultierende Fehlerobjekt
            // von Error abgeleitet ist.
            logger.debug('FilmRequestHandler.find(): status = NOT_FOUND');
            res.sendStatus(HttpStatus.NOT_FOUND);
            return;
        }

        const baseUri = getBaseUri(req);

        // asynchrone for-of Schleife statt synchrones filme.map()
        for await (const film of filme) {
            // HATEOAS: Atom Links je Film
            // eslint-disable-next-line no-underscore-dangle
            film._links = { self: { href: `${baseUri}/${film._id}` } };
        }

        logger.debug(
            `FilmRequestHandler.find(): filme=${JSON5.stringify(filme)}`,
        );
        filme.forEach((film) => {
            delete film._id;
            delete film.__v;
            delete film.createdAt;
            delete film.updatedAt;
        });
        res.json(filme);
    }

    async create(req: Request, res: Response) {
        const contentType = req.header(mimeConfig.contentType);
        if (
            // Optional Chaining
            contentType?.toLowerCase() !== mimeConfig.json
        ) {
            logger.debug('FilmRequestHandler.create() status=NOT_ACCEPTABLE');
            res.sendStatus(HttpStatus.NOT_ACCEPTABLE);
            return;
        }

        const filmData = req.body; // eslint-disable-line @typescript-eslint/no-unsafe-assignment
        logger.debug(
            `FilmRequestHandler.create(): body=${JSON5.stringify(filmData)}`,
        );

        const result = await this.service.create(filmData);
        if (result instanceof FilmServiceError) {
            this.handleCreateError(result, res);
            return;
        }

        const filmSaved = result;
        const location = `${getBaseUri(req)}/${filmSaved._id}`;
        logger.debug(`FilmRequestHandler.create(): location=${location}`);
        res.location(location);
        res.sendStatus(HttpStatus.CREATED);
    }

    async update(req: Request, res: Response) {
        const { id } = req.params;
        logger.debug(`FilmRequestHandler.update(): id=${id}`);

        const contentType = req.header(mimeConfig.contentType);
        if (contentType?.toLowerCase() !== mimeConfig.json) {
            res.status(HttpStatus.NOT_ACCEPTABLE);
            return;
        }
        const version = this.getVersionHeader(req, res);
        if (version === undefined) {
            return;
        }

        const filmData = req.body; // eslint-disable-line @typescript-eslint/no-unsafe-assignment
        filmData._id = id;
        logger.debug(
            `FilmRequestHandler.update(): film=${JSON5.stringify(filmData)}`,
        );

        const result = await this.service.update(filmData, version);
        if (result instanceof FilmServiceError) {
            this.handleUpdateError(result, res);
            return;
        }

        logger.debug(
            `FilmRequestHandler.update(): result=${JSON5.stringify(result)}`,
        );
        const neueVersion = `"${result.__v?.toString()}"`;
        res.set('ETag', neueVersion);
        res.sendStatus(HttpStatus.NO_CONTENT);
    }

    async delete(req: Request, res: Response) {
        const { id } = req.params;
        logger.debug(`FilmRequestHandler.delete(): id=${id}`);

        try {
            await this.service.delete(id);
        } catch (err: unknown) {
            logger.error(
                `FilmRequestHandler.delete(): error=${JSON5.stringify(err)}`,
            );
            res.sendStatus(HttpStatus.INTERNAL_ERROR);
            return;
        }

        logger.debug('FilmRequestHandler.delete(): NO_CONTENT');
        res.sendStatus(HttpStatus.NO_CONTENT);
    }

    private handleCreateError(err: CreateError, res: Response) {
        if (err instanceof FilmInvalid) {
            this.handleValidationError(err.msg, res);
            return;
        }

        if (err instanceof TitelExists) {
            this.handleTitelExists(err.titel, err.id, res);
            return;
        }

        if (err instanceof ProdnrExists) {
            this.handleProdnrExists(err.prodnr, err.id, res);
        }
    }

    private handleProdnrExists(prodnr: string, id: string, res: Response) {
        const msg = `Die PRODNR-Nummer "${prodnr}" existiert bereits bei ${id}.`;
        logger.debug(`FilmRequestHandler.handleCreateError(): msg=${msg}`);
        res.status(HttpStatus.BAD_REQUEST)
            .set('Content-Type', 'text/plain')
            .send(msg);
    }

    private handleValidationError(msg: ValidationErrorMsg, res: Response) {
        logger.debug(
            `FilmRequestHandler.handleCreateError(): msg=${JSON.stringify(
                msg,
            )}`,
        );
        res.status(HttpStatus.BAD_REQUEST).send(msg);
    }

    private handleTitelExists(titel: string, id: string, res: Response) {
        const msg = `Der Titel "${titel}" existiert bereits bei ${id}.`;
        logger.debug(`FilmRequestHandler.handleCreateError(): msg=${msg}`);
        res.status(HttpStatus.BAD_REQUEST)
            .set('Content-Type', 'text/plain')
            .send(msg);
    }

    private getVersionHeader(req: Request, res: Response) {
        const versionHeader = req.header('If-Match');
        logger.debug(
            `FilmRequestHandler.getVersionHeader() versionHeader=${versionHeader}`,
        );

        if (versionHeader === undefined) {
            const msg = 'Versionsnummer fehlt';
            logger.debug(
                `FilmRequestHandler.getVersionHeader(): status=428, message=${msg}`,
            );
            res.status(HttpStatus.PRECONDITION_REQUIRED)
                .set('Content-Type', 'text/plain')
                .send(msg);
            return;
        }

        const { length } = versionHeader;
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers
        if (length < 3) {
            const msg = `Ungueltige Versionsnummer: ${versionHeader}`;
            logger.debug(
                `FilmRequestHandler.getVersionHeader(): status=412, message=${msg}`,
            );
            res.status(HttpStatus.PRECONDITION_FAILED)
                .set('Content-Type', 'text/plain')
                .send(msg);
            return;
        }

        // slice: einschl. Start, ausschl. Ende
        const version = versionHeader.slice(1, -1);
        logger.debug(
            `FilmRequestHandler.getVersionHeader(): version=${version}`,
        );
        return version;
    }

    private handleUpdateError(err: UpdateError, res: Response) {
        if (err instanceof FilmInvalid) {
            this.handleValidationError(err.msg, res);
            return;
        }

        if (err instanceof FilmNotExists) {
            const { id } = err;
            const msg = `Es gibt keinen Film mit der ID "${id}".`;
            logger.debug(`FilmRequestHandler.handleUpdateError(): msg=${msg}`);
            res.status(HttpStatus.PRECONDITION_FAILED)
                .set('Content-Type', 'text/plain')
                .send(msg);
            return;
        }

        if (err instanceof TitelExists) {
            this.handleTitelExists(err.titel, err.id, res);
            return;
        }

        if (err instanceof VersionInvalid) {
            const { version } = err;
            const msg = `Die Versionsnummer "${version}" ist ungueltig.`;
            logger.debug(`FilmRequestHandler.handleUpdateError(): msg=${msg}`);
            res.status(HttpStatus.PRECONDITION_REQUIRED)
                .set('Content-Type', 'text/plain')
                .send(msg);
            return;
        }

        if (err instanceof VersionOutdated) {
            const { version } = err;
            const msg = `Die Versionsnummer "${version}" ist nicht aktuell.`;
            logger.debug(`FilmRequestHandler.handleUpdateError(): msg=${msg}`);
            res.status(HttpStatus.PRECONDITION_FAILED)
                .set('Content-Type', 'text/plain')
                .send(msg);
        }
    }
}

/* eslint-enable max-lines */
