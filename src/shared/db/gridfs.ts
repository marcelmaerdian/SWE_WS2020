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

import type {
    GridFSBucket,
    GridFSBucketOpenUploadStreamOptions,
    GridFSBucketWriteStream,
    MongoClient,
} from 'mongodb';
import type { Readable } from 'stream';
import { closeMongoDBClient } from './mongoDB';
import { logger } from '../../shared/logger';

/* eslint-disable max-params */
export const saveReadable = (
    readable: Readable,
    bucket: GridFSBucket,
    filename: string,
    metadata: GridFSBucketOpenUploadStreamOptions,
    client: MongoClient,
): GridFSBucketWriteStream =>
    readable
        .pipe(bucket.openUploadStream(filename, metadata))
        .on('finish', () => {
            logger.debug('gridfs.saveReadable(): UploadStream ist beendet');
            closeMongoDBClient(client);
        });
/* eslint-enable max-params */
