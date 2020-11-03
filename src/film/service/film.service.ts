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

import type { Buch, BuchData } from '../entity';
import {
    BuchInvalid,
    BuchNotExists,
    BuchServiceError,
    IsbnExists,
    TitelExists,
    VersionInvalid,
    VersionOutdated,
} from './errors';
import { BuchModel, validateBuch } from '../entity';
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
export class BuchService {
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
        logger.debug(`BuchService.findById(): id= ${id}`);

        // ein Buch zur gegebenen ID asynchron suchen
        // Pattern "Active Record" (urspruengl. von Ruby-on-Rails)
        // null falls nicht gefunden
        // lean() liefert ein "Plain JavaScript Object" statt ein Mongoose Document
        // so dass der virtuelle getter "id" auch nicht mehr vorhanden ist
        const buch = await BuchModel.findById(id).lean<BuchData>();
        return buch ?? undefined;
    }

    async find(query?: any | undefined) {
        if (this.mock !== undefined) {
            return this.mock.find(query);
        }

        logger.debug(`BuchService.find(): query=${JSON5.stringify(query)}`);

        // alle Buecher asynchron suchen u. aufsteigend nach titel sortieren
        // https://docs.mongodb.org/manual/reference/object-id
        // entries(): { titel: 'a', rating: 5 } => [{ titel: 'x'}, {rating: 5}]
        if (query === undefined || Object.entries(query).length === 0) {
            logger.debug('BuchService.find(): alle Buecher');
            // lean() liefert ein "Plain JavaScript Object" statt ein Mongoose Document
            return BuchModel.find().sort('titel').lean<BuchData>();
        }

        // { titel: 'a', rating: 5, javascript: true }
        const { titel, javascript, typescript, ...dbQuery } = query; // eslint-disable-line @typescript-eslint/no-unsafe-assignment

        // Buecher zur Query (= JSON-Objekt durch Express) asynchron suchen
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

        logger.debug(`BuchService.find(): dbQuery=${JSON5.stringify(dbQuery)}`);

        // Pattern "Active Record" (urspruengl. von Ruby-on-Rails)
        // leeres Array, falls nichts gefunden wird
        // lean() liefert ein "Plain JavaScript Object" statt ein Mongoose Document
        return BuchModel.find(dbQuery).lean<BuchData>();
        // Buch.findOne(query), falls das Suchkriterium eindeutig ist
        // bei findOne(query) wird null zurueckgeliefert, falls nichts gefunden
    }

    async create(buchData: Buch) {
        if (this.mock !== undefined) {
            return this.mock.create(buchData);
        }

        logger.debug(
            `BuchService.create(): buchData=${JSON5.stringify(buchData)}`,
        );
        const result = await this.validateCreate(buchData);
        if (result instanceof BuchServiceError) {
            return result;
        }

        const buch = new BuchModel(buchData);
        let buchSaved!: Document;
        // https://www.mongodb.com/blog/post/quick-start-nodejs--mongodb--how-to-implement-transactions
        const session = await startSession();
        try {
            await session.withTransaction(async () => {
                buchSaved = await buch.save();
            });
        } catch (err: unknown) {
            logger.error(
                `BuchService.create(): Die Transaktion wurde abgebrochen: ${JSON5.stringify(
                    err,
                )}`,
            );
            // TODO [2030-09-30] Weitere Fehlerbehandlung bei Rollback
        } finally {
            session.endSession();
        }
        const buchDataSaved: BuchData = buchSaved.toObject(); // eslint-disable-line @typescript-eslint/no-unsafe-assignment
        logger.debug(
            `BuchService.create(): buchDataSaved=${JSON5.stringify(
                buchDataSaved,
            )}`,
        );

        await this.sendmail(buchDataSaved);

        return buchDataSaved;
    }

    async update(buchData: Buch, versionStr: string) {
        if (this.mock !== undefined) {
            return this.mock.update(buchData);
        }

        logger.debug(
            `BuchService.update(): buchData=${JSON5.stringify(buchData)}`,
        );
        logger.debug(`BuchService.update(): versionStr=${versionStr}`);

        const validateResult = await this.validateUpdate(buchData, versionStr);
        if (validateResult instanceof BuchServiceError) {
            return validateResult;
        }

        // findByIdAndReplace ersetzt ein Document mit ggf. weniger Properties
        const buch = new BuchModel(buchData);
        const updateOptions = { new: true };
        const result = await BuchModel.findByIdAndUpdate(
            buch._id,
            buch,
            updateOptions,
        ).lean<BuchData>();
        if (result === null) {
            return new BuchNotExists(buch._id);
        }

        if (result.__v !== undefined) {
            result.__v++;
        }
        logger.debug(`BuchService.update(): result=${JSON5.stringify(result)}`);

        // Weitere Methoden von mongoose zum Aktualisieren:
        //    Buch.findOneAndUpdate(update)
        //    buch.update(bedingung)
        return Promise.resolve(result);
    }

    async delete(id: string) {
        if (this.mock !== undefined) {
            return this.mock.remove(id);
        }
        logger.debug(`BuchService.delete(): id=${id}`);

        // Das Buch zur gegebenen ID asynchron loeschen
        const { deletedCount } = await BuchModel.deleteOne({ _id: id }); // eslint-disable-line @typescript-eslint/naming-convention
        logger.debug(`BuchService.delete(): deletedCount=${deletedCount}`);
        return deletedCount !== undefined;

        // Weitere Methoden von mongoose, um zu loeschen:
        //  Buch.findByIdAndRemove(id)
        //  Buch.findOneAndRemove(bedingung)
    }

    private async validateCreate(buch: Buch) {
        const msg = validateBuch(buch);
        if (msg !== undefined) {
            logger.debug(
                `BuchService.validateCreate(): Validation Message: ${JSON5.stringify(
                    msg,
                )}`,
            );
            return new BuchInvalid(msg);
        }

        // statt 2 sequentiellen DB-Zugriffen waere 1 DB-Zugriff mit OR besser

        const resultTitel = await this.checkTitelExists(buch);
        if (resultTitel !== undefined) {
            return resultTitel;
        }

        const resultIsbn = await this.checkIsbnExists(buch);
        if (resultIsbn !== undefined) {
            return resultIsbn;
        }

        logger.debug('BuchService.validateCreate(): ok');
        return undefined;
    }

    private async checkTitelExists(buch: Buch) {
        const { titel } = buch;

        // Pattern "Active Record" (urspruengl. von Ruby-on-Rails)
        // eslint-disable-next-line @typescript-eslint/naming-convention
        const tmpId = await BuchModel.findOne({ titel }, { _id: true }).lean<
            string
        >();
        if (tmpId !== null) {
            logger.debug(
                `BuchService.checkTitelExists(): _id=${JSON5.stringify(tmpId)}`,
            );
            return new TitelExists(titel as string, tmpId);
        }

        logger.debug('BuchService.checkTitelExists(): ok');
        return undefined;
    }

    private async checkIsbnExists(buch: Buch) {
        const { isbn } = buch;
        // eslint-disable-next-line @typescript-eslint/naming-convention
        const tmpId = await BuchModel.findOne({ isbn }, { _id: true }).lean<
            string
        >();

        if (tmpId !== null) {
            logger.debug(
                `BuchService.checkIsbnExists(): buch=${JSON5.stringify(tmpId)}`,
            );
            return new IsbnExists(isbn as string, tmpId);
        }

        logger.debug('BuchService.checkIsbnExists(): ok');
        return undefined;
    }

    private async sendmail(buchData: BuchData) {
        if (serverConfig.cloud !== undefined) {
            // In der Cloud kann man z.B. "@sendgrid/mail" statt
            // "nodemailer" mit lokalem Mailserver verwenden
            return;
        }

        const from = '"Joe Doe" <Joe.Doe@acme.com>';
        const to = '"Foo Bar" <Foo.Bar@acme.com>';
        const subject = `Neues Buch ${buchData._id}`;
        const body = `Das Buch mit dem Titel <strong>${buchData.titel}</strong> ist angelegt`;

        const data: SendMailOptions = { from, to, subject, html: body };
        logger.debug(`sendMail(): data = ${JSON5.stringify(data)}`);

        try {
            const nodemailer = await import('nodemailer'); // eslint-disable-line node/no-unsupported-features/es-syntax
            await nodemailer.createTransport(mailConfig).sendMail(data);
        } catch (err: unknown) {
            logger.error(
                `BuchService.create(): Fehler beim Verschicken der Email: ${JSON5.stringify(
                    err,
                )}`,
            );
        }
    }

    private async validateUpdate(buch: BuchData, versionStr: string) {
        const result = this.validateVersion(versionStr);
        if (typeof result !== 'number') {
            return result;
        }

        const version = result;
        logger.debug(`BuchService.validateUpdate(): version=${version}`);
        logger.debug(
            `BuchService.validateUpdate(): buch=${JSON5.stringify(buch)}`,
        );

        const validationMsg = validateBuch(buch);
        if (validationMsg !== undefined) {
            return new BuchInvalid(validationMsg);
        }

        const resultTitel = await this.checkTitelExists(buch);
        if (resultTitel !== undefined && resultTitel.id !== buch._id) {
            return resultTitel;
        }

        const resultIdAndVersion = await this.checkIdAndVersion(
            buch._id,
            version,
        );
        if (resultIdAndVersion !== undefined) {
            return resultIdAndVersion;
        }

        logger.debug('BuchService.validateUpdate(): ok');
        return undefined;
    }

    private validateVersion(versionStr: string | undefined) {
        if (versionStr === undefined) {
            const error = new VersionInvalid(versionStr);
            logger.debug(
                `BuchService.validateVersion(): VersionInvalid=${JSON5.stringify(
                    error,
                )}`,
            );
            return error;
        }

        const version = Number.parseInt(versionStr, 10);
        if (Number.isNaN(version)) {
            const error = new VersionInvalid(versionStr);
            logger.debug(
                `BuchService.validateVersion(): VersionInvalid=${JSON5.stringify(
                    error,
                )}`,
            );
            return error;
        }

        return version;
    }

    private async checkIdAndVersion(id: string | undefined, version: number) {
        const buchDb = await BuchModel.findById(id).lean<BuchData>();
        if (buchDb === null) {
            const result = new BuchNotExists(id);
            logger.debug(
                `BuchService.checkIdAndVersion(): BuchNotExists=${JSON5.stringify(
                    result,
                )}`,
            );
            return result;
        }

        const versionDb = buchDb.__v ?? 0;
        if (version < versionDb) {
            const result = new VersionOutdated(id as string, version);
            logger.debug(
                `BuchService.checkIdAndVersion(): VersionOutdated=${JSON5.stringify(
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
