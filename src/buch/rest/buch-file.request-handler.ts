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
    BuchFileService,
    BuchFileServiceError,
    BuchNotExists,
    FileNotFound,
    MultipleFiles,
} from './../service';
import { HttpStatus, logger } from '../../shared';
import type { Request, Response } from 'express';
import type { DownloadError } from '../service';
import JSON5 from 'json5';

// export bei async und await:
// https://blogs.msdn.microsoft.com/typescript/2015/11/30/announcing-typescript-1-7
// http://tc39.github.io/ecmascript-export
// https://nemethgergely.com/async-function-best-practices#Using-async-functions-with-express

export class BuchFileRequestHandler {
    private readonly service = new BuchFileService();

    upload(req: Request, res: Response) {
        const { id } = req.params;
        logger.debug(`BuchFileRequestHandler.uploadBinary(): id=${id}`);

        // https://jsao.io/2019/06/uploading-and-downloading-files-buffering-in-node-js

        const data: Uint8Array[] = [];
        let totalBytesInBuffer = 0;

        // Wenn body-parser verwendet wird (z.B. bei textuellen JSON-Daten),
        // dann verarbeitet body-parser die Events "data" und "end".
        // https://nodejs.org/api/http.html#http_class_http_clientrequest

        req.on('data', (chunk: Uint8Array) => {
            const { length } = chunk;
            logger.debug(
                `BuchFileRequestHandler.uploadBinary(): data ${length}`,
            );
            data.push(chunk);
            totalBytesInBuffer += length;
        })
            .on('aborted', () =>
                logger.debug('BuchFileRequestHandler.uploadBinary(): aborted'),
            )
            .on('end', () => {
                logger.debug(
                    `BuchFileRequestHandler.uploadBinary(): end ${totalBytesInBuffer}`,
                );
                const buffer = Buffer.concat(data, totalBytesInBuffer);

                // IIFE (= Immediately Invoked Function Expression) wegen await
                // https://developer.mozilla.org/en-US/docs/Glossary/IIFE
                // https://github.com/typescript-eslint/typescript-eslint/issues/647
                // https://github.com/typescript-eslint/typescript-eslint/pull/1799
                (async () => {
                    try {
                        await this.save(req, id, buffer);
                    } catch (err: unknown) {
                        logger.error(
                            `Fehler beim Abspeichern: ${JSON5.stringify(err)}`,
                        );
                        return;
                    }

                    res.sendStatus(HttpStatus.NO_CONTENT);
                })();
            });
    }

    async download(req: Request, res: Response) {
        const { id } = req.params;
        logger.debug(`BuchFileRequestHandler.downloadBinary(): ${id}`);
        if ((id as string | undefined) === undefined) {
            res.status(HttpStatus.BAD_REQUEST).send('Keine Buch-Id');
            return;
        }

        const findResult = await this.service.find(id);
        if (
            findResult instanceof BuchFileServiceError ||
            findResult instanceof BuchNotExists
        ) {
            this.handleDownloadError(findResult, res);
            return;
        }

        const file = findResult;
        const { readStream, contentType } = file;
        res.contentType(contentType);
        // https://www.freecodecamp.org/news/node-js-streams-everything-you-need-to-know-c9141306be93
        readStream.pipe(res);
    }

    private async save(req: Request, id: string, buffer: Buffer) {
        const contentType = req.headers['content-type'];
        await this.service.save(id, buffer, contentType);
    }

    private handleDownloadError(
        err: BuchNotExists | DownloadError,
        res: Response,
    ) {
        if (err instanceof BuchNotExists) {
            const { id } = err;
            const msg = `Es gibt kein Buch mit der ID "${id}".`;
            logger.debug(
                `BuchFileRequestHandler.handleDownloadError(): msg=${msg}`,
            );
            res.status(HttpStatus.PRECONDITION_FAILED)
                .set('Content-Type', 'text/plain')
                .send(msg);
            return;
        }

        if (err instanceof FileNotFound) {
            const { filename } = err;
            const msg = `Es gibt kein File mit Name ${filename}`;
            logger.debug(
                `BuchFileRequestHandler.handleDownloadError(): msg=${msg}`,
            );
            res.status(HttpStatus.NOT_FOUND).send(msg);
            return;
        }

        if (err instanceof MultipleFiles) {
            const { filename } = err;
            const msg = `Es gibt mehr als ein File mit Name ${filename}`;
            logger.debug(
                `BuchFileRequestHandler.handleDownloadError(): msg=${msg}`,
            );
            res.status(HttpStatus.INTERNAL_ERROR).send(msg);
        }
    }
}
