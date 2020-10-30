/*
 * Copyright (C) 2017 - present Juergen Zimmermann, Hochschule Karlsruhe
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

import JSON5 from 'json5';
import { MongoClient } from 'mongodb';
import type { MongoClientOptions } from 'mongodb';
import { dbConfig } from '../config/db';
import { logger } from '../../shared/logger';

export const connectMongoDB = async () => {
    const { atlas, dbName, url, tlsCertificateKeyFile } = dbConfig;
    logger.debug(`mongodb.connectMongoDB(): url=${url}`);
    const options: MongoClientOptions = {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    };
    if (!atlas) {
        options.tls = true;
        options.tlsCertificateKeyFile = tlsCertificateKeyFile;
        options.tlsInsecure = true;
    }

    const client = new MongoClient(url, options);
    await client.connect();
    logger.debug('mongodb.connectMongoDB(): DB-Client geoeffnet');
    const db = client.db(dbName);

    return { db, client };
};

// NICHT: async, weil die Funktion fuer Request-Events beim Hochladen und
// fuer GridFS-Events beim Herunterladen verwendet wird
export const closeMongoDBClient = (client: MongoClient): void => {
    // IIFE (= Immediately Invoked Function Expression) wegen await
    // https://developer.mozilla.org/en-US/docs/Glossary/IIFE
    // https://github.com/typescript-eslint/typescript-eslint/issues/647
    // https://github.com/typescript-eslint/typescript-eslint/pull/1799
    (async () => {
        try {
            await client.close();
        } catch (err: unknown) {
            logger.error(`mongodb.closeDbClient(): ${JSON5.stringify(err)}`);
            return;
        }

        logger.debug('mongodb.closeDbClient(): DB-Client wurde geschlossen');
    })();
};
