/*
 * Copyright (C) 2018 - present Juergen Zimmermann, Hochschule Karlsruhe
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

import { buch, buecher } from './buch';
import type { Buch } from '../../entity';
import JSON5 from 'json5';
import { logger } from '../../../shared';
import { v4 as uuid } from 'uuid';

/* eslint-disable @typescript-eslint/no-unused-vars,require-await,@typescript-eslint/require-await */
export class BuchServiceMock {
    async findById(id: string) {
        buch._id = id;
        return buch;
    }

    async find(_?: unknown) {
        return buecher;
    }

    async create(buchData: Buch) {
        buchData._id = uuid();
        logger.info(`Neues Buch: ${JSON5.stringify(buchData)}`);
        return buchData;
    }

    async update(buchData: Buch) {
        if (buchData.__v !== undefined) {
            buchData.__v++;
        }
        logger.info(`Aktualisiertes Buch: ${JSON5.stringify(buchData)}`);
        return Promise.resolve(buchData);
    }

    async remove(id: string) {
        logger.info(`ID des geloeschten Buches: ${id}`);
        return true;
    }
}

/* eslint-enable @typescript-eslint/no-unused-vars,require-await,@typescript-eslint/require-await */
