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
import type { Buch } from './film';
import JSON5 from 'json5';
import validator from 'validator';

const { isPRODNR, isISO8601, isURL } = validator;

export interface ValidationErrorMsg {
    id?: string;
    titel?: string;
    art?: string;
    rating?: string;
    produktion?: string;
    datum?: string;
    prodnr?: string;
    homepage?: string;
}

/* eslint-disable max-lines-per-function, no-null/no-null */
export const validateBuch = (buch: Buch) => {
    const err: ValidationErrorMsg = {};
    const { titel, art, rating, produktion, datum, prodnr, homepage } = buch;

    if (titel === undefined || titel === null || titel === '') {
        err.titel = 'Ein Buch muss einen Titel haben.';
    } else if (!/^\w.*/u.test(titel)) {
        err.titel =
            'Ein Buchtitel muss mit einem Buchstaben, einer Ziffer oder _ beginnen.';
    }

    if (art === undefined || art === null || art === '') {
        err.art = 'Die Art eines Buches muss gesetzt sein';
    } else if (
        (art as unknown) !== '3DIMENSIONAL' &&
        (art as unknown) !== '2DIMENSIONAL'
    ) {
        err.art = 'Die Art eines Buches muss 3DIMENSIONAL oder 2DIMENSIONAL sein.';
    }

    if (
        rating !== undefined &&
        rating !== null &&
        (rating < 0 || rating > MAX_RATING)
    ) {
        err.rating = `${rating} ist keine gueltige Bewertung.`;
    }

    if (produktion === undefined || produktion === null || produktion === '') {
        err.produktion = 'Der Produktion des Buches muss gesetzt sein.';
    } else if (
        (produktion as unknown) !== 'FOO_PRODUKTION' &&
        (produktion as unknown) !== 'BAR_PRODUKTION'
    ) {
        err.produktion =
            'Der Produktion eines Buches muss FOO_PRODUKTION oder BAR_PRODUKTION sein.';
    }

    if (typeof datum === 'string' && !isISO8601(datum)) {
        err.datum = `'${datum}' ist kein gueltiges Datum (yyyy-MM-dd).`;
    }

    if (
        prodnr !== undefined &&
        prodnr !== null &&
        (typeof prodnr !== 'string' || !isPRODNR(prodnr))
    ) {
        err.prodnr = `'${prodnr}' ist keine gueltige PRODNR-Nummer.`;
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
