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

import type { Film, FilmData } from '../entity';
import {
    FilmInvalid,
    FilmNotExists,
    FilmServiceError,
    ProdnrExists,
    TitelExists,
    VersionInvalid,
    VersionOutdated,
} from './errors';
import { FilmModel, validateBuch } from '../entity';
import { dbConfig, logger, mailConfig, serverConfig } from '../../shared';
import { BuchServiceMock } from './mock';
import type { Document } from 'mongoose';
import JSON5 from 'json5';
import type { SendMailOptions } from 'nodemailer';
import { startSession } from 'mongoose';

const { mockDB } = dbConfig;

// API-Dokumentation zu mongoose:
// http://mongoosejs.com/docs/api.html
// https://github.com/Automattic/mongoose/issues/3949

/* eslint-disable require-await, no-null/no-null, unicorn/no-useless-undefined */
// BEACHTE: asynchrone Funktionen in der Klasse erfordern kein top-level await
export class FilmService {
    private readonly mock: BuchServiceMock | undefined;

    constructor() {
        if (mockDB) {
            this.mock = new BuchServiceMock();
        }
    }

    // Status eines Promise:
    // Pending: das Resultat gibt es noch nicht, weil die asynchrone Operation,
    //          die das Resultat liefert, noch nicht abgeschlossen ist
    // Fulfilled: die asynchrone Operation ist abgeschlossen und
    //            das Promise-Objekt hat einen Wert
    // Rejected: die asynchrone Operation ist fehlgeschlagen and das
    //           Promise-Objekt wird nicht den Status "fulfilled" erreichen.
    //           Stattdessen ist im Promise-Objekt die Fehlerursache enthalten.

    async findById(id: string) {
        if (this.mock !== undefined) {
            return this.mock.findById(id);
        }
        logger.debug(`FilmService.findById(): id= ${id}`);

        // ein Film zur gegebenen ID asynchron suchen
        // Pattern "Active Record" (urspruengl. von Ruby-on-Rails)
        // null falls nicht gefunden
        // lean() liefert ein "Plain JavaScript Object" statt ein Mongoose Document
        // so dass der virtuelle getter "id" auch nicht mehr vorhanden ist
        const film = await FilmModel.findById(id).lean<FilmData>();
        return film ?? undefined;
    }

    async find(query?: any | undefined) {
        if (this.mock !== undefined) {
            return this.mock.find(query);
        }

        logger.debug(`FilmService.find(): query=${JSON5.stringify(query)}`);

        // alle Filme asynchron suchen u. aufsteigend nach titel sortieren
        // https://docs.mongodb.org/manual/reference/object-id
        // entries(): { titel: 'a', rating: 5 } => [{ titel: 'x'}, {rating: 5}]
        if (query === undefined || Object.entries(query).length === 0) {
            logger.debug('FilmService.find(): alle Filme');
            // lean() liefert ein "Plain JavaScript Object" statt ein Mongoose Document
            return FilmModel.find().sort('titel').lean<FilmData>();
        }

        // { titel: 'a', rating: 5, javascript: true }
        const { titel, javascript, typescript, ...dbQuery } = query; // eslint-disable-line @typescript-eslint/no-unsafe-assignment

        // Filme zur Query (= JSON-Objekt durch Express) asynchron suchen
        if (titel !== undefined) {
            // Titel in der Query: Teilstring des Titels,
            // d.h. "LIKE" als regulaerer Ausdruck
            // 'i': keine Unterscheidung zw. Gross- u. Kleinschreibung
            // NICHT /.../, weil das Muster variabel sein muss
            // CAVEAT: KEINE SEHR LANGEN Strings wg. regulaerem Ausdruck
            // eslint-disable-next-line @typescript-eslint/no-magic-numbers
            if (titel.length < 10) {
                dbQuery.titel = new RegExp(titel, 'iu'); // eslint-disable-line security/detect-non-literal-regexp
            }
        }

        // z.B. {javascript: true, typescript: true}
        const schlagwoerter = [];
        if (javascript === 'true') {
            schlagwoerter.push('JAVASCRIPT');
        }
        if (typescript === 'true') {
            schlagwoerter.push('TYPESCRIPT');
        }
        if (schlagwoerter.length === 0) {
            delete dbQuery.schlagwoerter;
        } else {
            dbQuery.schlagwoerter = schlagwoerter;
        }

        logger.debug(`FilmService.find(): dbQuery=${JSON5.stringify(dbQuery)}`);

        // Pattern "Active Record" (urspruengl. von Ruby-on-Rails)
        // leeres Array, falls nichts gefunden wird
        // lean() liefert ein "Plain JavaScript Object" statt ein Mongoose Document
        return FilmModel.find(dbQuery).lean<FilmData>();
        // Film.findOne(query), falls das Suchkriterium eindeutig ist
        // bei findOne(query) wird null zurueckgeliefert, falls nichts gefunden
    }

    async create(filmData: Film) {
        if (this.mock !== undefined) {
            return this.mock.create(filmData);
        }

        logger.debug(
            `FilmService.create(): filmData=${JSON5.stringify(filmData)}`,
        );
        const result = await this.validateCreate(filmData);
        if (result instanceof FilmServiceError) {
            return result;
        }

        const film = new FilmModel(filmData);
        let filmSaved!: Document;
        // https://www.mongodb.com/blog/post/quick-start-nodejs--mongodb--how-to-implement-transactions
        const session = await startSession();
        try {
            await session.withTransaction(async () => {
                filmSaved = await film.save();
            });
        } catch (err: unknown) {
            logger.error(
                `FilmService.create(): Die Transaktion wurde abgebrochen: ${JSON5.stringify(
                    err,
                )}`,
            );
            // TODO [2030-09-30] Weitere Fehlerbehandlung bei Rollback
        } finally {
            session.endSession();
        }
        const buchDataSaved: FilmData = filmSaved.toObject(); // eslint-disable-line @typescript-eslint/no-unsafe-assignment
        logger.debug(
            `FilmService.create(): buchDataSaved=${JSON5.stringify(
                buchDataSaved,
            )}`,
        );

        await this.sendmail(buchDataSaved);

        return buchDataSaved;
    }

    async update(filmData: Film, versionStr: string) {
        if (this.mock !== undefined) {
            return this.mock.update(filmData);
        }

        logger.debug(
            `FilmService.update(): filmData=${JSON5.stringify(filmData)}`,
        );
        logger.debug(`FilmService.update(): versionStr=${versionStr}`);

        const validateResult = await this.validateUpdate(filmData, versionStr);
        if (validateResult instanceof FilmServiceError) {
            return validateResult;
        }

        // findByIdAndReplace ersetzt ein Document mit ggf. weniger Properties
        const film = new FilmModel(filmData);
        const updateOptions = { new: true };
        const result = await FilmModel.findByIdAndUpdate(
            film._id,
            film,
            updateOptions,
        ).lean<FilmData>();
        if (result === null) {
            return new FilmNotExists(film._id);
        }

        if (result.__v !== undefined) {
            result.__v++;
        }
        logger.debug(`FilmService.update(): result=${JSON5.stringify(result)}`);

        // Weitere Methoden von mongoose zum Aktualisieren:
        //    Film.findOneAndUpdate(update)
        //    film.update(bedingung)
        return Promise.resolve(result);
    }

    async delete(id: string) {
        if (this.mock !== undefined) {
            return this.mock.remove(id);
        }
        logger.debug(`FilmService.delete(): id=${id}`);

        // Das Film zur gegebenen ID asynchron loeschen
        const { deletedCount } = await FilmModel.deleteOne({ _id: id }); // eslint-disable-line @typescript-eslint/naming-convention
        logger.debug(`FilmService.delete(): deletedCount=${deletedCount}`);
        return deletedCount !== undefined;

        // Weitere Methoden von mongoose, um zu loeschen:
        //  Film.findByIdAndRemove(id)
        //  Film.findOneAndRemove(bedingung)
    }

    private async validateCreate(film: Film) {
        const msg = validateBuch(film);
        if (msg !== undefined) {
            logger.debug(
                `FilmService.validateCreate(): Validation Message: ${JSON5.stringify(
                    msg,
                )}`,
            );
            return new FilmInvalid(msg);
        }

        // statt 2 sequentiellen DB-Zugriffen waere 1 DB-Zugriff mit OR besser

        const resultTitel = await this.checkTitelExists(film);
        if (resultTitel !== undefined) {
            return resultTitel;
        }

        const resultProdnr = await this.checkProdnrExists(film);
        if (resultProdnr !== undefined) {
            return resultProdnr;
        }

        logger.debug('FilmService.validateCreate(): ok');
        return undefined;
    }

    private async checkTitelExists(film: Film) {
        const { titel } = film;

        // Pattern "Active Record" (urspruengl. von Ruby-on-Rails)
        // eslint-disable-next-line @typescript-eslint/naming-convention
        const tmpId = await FilmModel.findOne({ titel }, { _id: true }).lean<
            string
        >();
        if (tmpId !== null) {
            logger.debug(
                `FilmService.checkTitelExists(): _id=${JSON5.stringify(tmpId)}`,
            );
            return new TitelExists(titel as string, tmpId);
        }

        logger.debug('FilmService.checkTitelExists(): ok');
        return undefined;
    }

    private async checkProdnrExists(film: Film) {
        const { prodnr } = film;
        // eslint-disable-next-line @typescript-eslint/naming-convention
        const tmpId = await FilmModel.findOne({ prodnr }, { _id: true }).lean<
            string
        >();

        if (tmpId !== null) {
            logger.debug(
                `FilmService.checkProdnrExists(): film=${JSON5.stringify(tmpId)}`,
            );
            return new ProdnrExists(prodnr as string, tmpId);
        }

        logger.debug('FilmService.checkProdnrExists(): ok');
        return undefined;
    }

    private async sendmail(filmData: FilmData) {
        if (serverConfig.cloud !== undefined) {
            // In der Cloud kann man z.B. "@sendgrid/mail" statt
            // "nodemailer" mit lokalem Mailserver verwenden
            return;
        }

        const from = '"Joe Doe" <Joe.Doe@acme.com>';
        const to = '"Foo Bar" <Foo.Bar@acme.com>';
        const subject = `Neuer Film ${filmData._id}`;
        const body = `Das Film mit dem Titel <strong>${filmData.titel}</strong> ist angelegt`;

        const data: SendMailOptions = { from, to, subject, html: body };
        logger.debug(`sendMail(): data = ${JSON5.stringify(data)}`);

        try {
            const nodemailer = await import('nodemailer'); // eslint-disable-line node/no-unsupported-features/es-syntax
            await nodemailer.createTransport(mailConfig).sendMail(data);
        } catch (err: unknown) {
            logger.error(
                `FilmService.create(): Fehler beim Verschicken der Email: ${JSON5.stringify(
                    err,
                )}`,
            );
        }
    }

    private async validateUpdate(film: FilmData, versionStr: string) {
        const result = this.validateVersion(versionStr);
        if (typeof result !== 'number') {
            return result;
        }

        const version = result;
        logger.debug(`FilmService.validateUpdate(): version=${version}`);
        logger.debug(
            `FilmService.validateUpdate(): film=${JSON5.stringify(film)}`,
        );

        const validationMsg = validateBuch(film);
        if (validationMsg !== undefined) {
            return new FilmInvalid(validationMsg);
        }

        const resultTitel = await this.checkTitelExists(film);
        if (resultTitel !== undefined && resultTitel.id !== film._id) {
            return resultTitel;
        }

        const resultIdAndVersion = await this.checkIdAndVersion(
            film._id,
            version,
        );
        if (resultIdAndVersion !== undefined) {
            return resultIdAndVersion;
        }

        logger.debug('FilmService.validateUpdate(): ok');
        return undefined;
    }

    private validateVersion(versionStr: string | undefined) {
        if (versionStr === undefined) {
            const error = new VersionInvalid(versionStr);
            logger.debug(
                `FilmService.validateVersion(): VersionInvalid=${JSON5.stringify(
                    error,
                )}`,
            );
            return error;
        }

        const version = Number.parseInt(versionStr, 10);
        if (Number.isNaN(version)) {
            const error = new VersionInvalid(versionStr);
            logger.debug(
                `FilmService.validateVersion(): VersionInvalid=${JSON5.stringify(
                    error,
                )}`,
            );
            return error;
        }

        return version;
    }

    private async checkIdAndVersion(id: string | undefined, version: number) {
        const buchDb = await FilmModel.findById(id).lean<FilmData>();
        if (buchDb === null) {
            const result = new FilmNotExists(id);
            logger.debug(
                `FilmService.checkIdAndVersion(): FilmNotExists=${JSON5.stringify(
                    result,
                )}`,
            );
            return result;
        }

        const versionDb = buchDb.__v ?? 0;
        if (version < versionDb) {
            const result = new VersionOutdated(id as string, version);
            logger.debug(
                `FilmService.checkIdAndVersion(): VersionOutdated=${JSON5.stringify(
                    result,
                )}`,
            );
            return result;
        }

        return undefined;
    }
}
/* eslint-enable require-await, no-null/no-null, unicorn/no-useless-undefined */
/* eslint-enable max-lines */
