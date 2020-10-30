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

import { MAX_RATING, logger } from '../../shared';
import type { Buch } from './buch';
import JSON5 from 'json5';
import validator from 'validator';

const { isISBN, isISO8601, isURL } = validator;

export interface ValidationErrorMsg {
    id?: string;
    titel?: string;
    art?: string;
    rating?: string;
    verlag?: string;
    datum?: string;
    isbn?: string;
    homepage?: string;
}

/* eslint-disable max-lines-per-function, no-null/no-null */
export const validateBuch = (buch: Buch) => {
    const err: ValidationErrorMsg = {};
    const { titel, art, rating, verlag, datum, isbn, homepage } = buch;

    if (titel === undefined || titel === null || titel === '') {
        err.titel = 'Ein Buch muss einen Titel haben.';
    } else if (!/^\w.*/u.test(titel)) {
        err.titel =
            'Ein Buchtitel muss mit einem Buchstaben, einer Ziffer oder _ beginnen.';
    }

    if (art === undefined || art === null || art === '') {
        err.art = 'Die Art eines Buches muss gesetzt sein';
    } else if (
        (art as unknown) !== 'KINDLE' &&
        (art as unknown) !== 'DRUCKAUSGABE'
    ) {
        err.art = 'Die Art eines Buches muss KINDLE oder DRUCKAUSGABE sein.';
    }

    if (
        rating !== undefined &&
        rating !== null &&
        (rating < 0 || rating > MAX_RATING)
    ) {
        err.rating = `${rating} ist keine gueltige Bewertung.`;
    }

    if (verlag === undefined || verlag === null || verlag === '') {
        err.verlag = 'Der Verlag des Buches muss gesetzt sein.';
    } else if (
        (verlag as unknown) !== 'FOO_VERLAG' &&
        (verlag as unknown) !== 'BAR_VERLAG'
    ) {
        err.verlag =
            'Der Verlag eines Buches muss FOO_VERLAG oder BAR_VERLAG sein.';
    }

    if (typeof datum === 'string' && !isISO8601(datum)) {
        err.datum = `'${datum}' ist kein gueltiges Datum (yyyy-MM-dd).`;
    }

    if (
        isbn !== undefined &&
        isbn !== null &&
        (typeof isbn !== 'string' || !isISBN(isbn))
    ) {
        err.isbn = `'${isbn}' ist keine gueltige ISBN-Nummer.`;
    }

    // Falls "preis" ein string ist: Pruefung z.B. 12.30
    // if (isPresent(preis) && !isCurrency(`${preis}`)) {
    //     err.preis = `${preis} ist kein gueltiger Preis`
    // }
    if (
        homepage !== undefined &&
        homepage !== null &&
        (typeof homepage !== 'string' || !isURL(homepage))
    ) {
        err.homepage = `'${homepage}' ist keine gueltige URL.`;
    }

    logger.debug(`validateBuch: err=${JSON5.stringify(err)}`);
    return Object.entries(err).length === 0 ? undefined : err;
};
/* eslint-enable max-lines-per-function, no-null/no-null */
