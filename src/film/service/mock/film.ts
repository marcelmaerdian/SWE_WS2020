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

import { BuchArt, Produktion } from '../../entity';
import type { BuchData } from '../../entity';

/* eslint-disable @typescript-eslint/naming-convention */

export const film: BuchData = {
    _id: '00000000-0000-0000-0000-000000000001',
    titel: 'Alpha',
    rating: 4,
    art: BuchArt.ZWEIDIMENSIONAL,
    produktion: Produktion.FOO_PRODUKTION,
    preis: 11.1,
    rabatt: 0.011,
    lieferbar: true,
    datum: new Date('2018-02-01T00:00:00.000Z'),
    prodnr: '000-0-00000-000-1',
    homepage: 'https://acme.at/',
    schlagwoerter: ['JAVASCRIPT'],
    regisseure: [
        {
            nachname: 'Alpha',
            vorname: 'Adriana',
        },
        {
            nachname: 'Alpha',
            vorname: 'Alfred',
        },
    ],
    __v: 0,
    createdAt: 0,
    updatedAt: 0,
};

export const filme: BuchData[] = [
    film,
    {
        _id: '00000000-0000-0000-0000-000000000002',
        titel: 'Beta',
        rating: 2,
        art: BuchArt.DREIDIMENSIONAL,
        produktion: Produktion.FOO_PRODUKTION,
        preis: 22.2,
        rabatt: 0.022,
        lieferbar: true,
        datum: new Date('2018-02-02T00:00:00.000Z'),
        prodnr: '000-0-00000-000-2',
        homepage: 'https://acme.biz/',
        schlagwoerter: ['TYPESCRIPT'],
        regisseure: [
            {
                nachname: 'Beta',
                vorname: 'Brunhilde',
            },
        ],
        __v: 0,
        createdAt: 0,
        updatedAt: 0,
    },
];

/* eslint-enable @typescript-eslint/naming-convention */
