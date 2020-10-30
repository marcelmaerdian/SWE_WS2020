/*
 * Copyright (C) 2020 - present Juergen Zimmermann, Hochschule Karlsruhe
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

/* eslint-disable @typescript-eslint/naming-convention */

export const buecher = [
    {
        _id: '00000000-0000-0000-0000-000000000001',
        titel: 'Alpha',
        rating: 4,
        art: 'DRUCKAUSGABE',
        verlag: 'FOO_VERLAG',
        preis: 11.1,
        rabatt: 0.011,
        lieferbar: true,
        // https://docs.mongodb.com/manual/reference/method/Date
        datum: new Date('2020-02-01'),
        isbn: '978-3897225831',
        homepage: 'https://acme..at/',
        schlagwoerter: ['JAVASCRIPT'],
        autoren: [
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
        createdAt: new Date(),
        updatedAt: new Date(),
    },
    {
        _id: '00000000-0000-0000-0000-000000000002',
        titel: 'Beta',
        rating: 2,
        art: 'KINDLE',
        verlag: 'BAR_VERLAG',
        preis: 22.2,
        rabatt: 0.022,
        lieferbar: true,
        datum: new Date('2020-02-02'),
        isbn: '978-3827315526',
        homepage: 'https://acme..biz/',
        schlagwoerter: ['TYPESCRIPT'],
        autoren: [
            {
                nachname: 'Beta',
                vorname: 'Brunhilde',
            },
        ],
        __v: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
    },
    {
        _id: '00000000-0000-0000-0000-000000000003',
        titel: 'Gamma',
        rating: 1,
        art: 'DRUCKAUSGABE',
        verlag: 'FOO_VERLAG',
        preis: 33.3,
        rabatt: 0.033,
        lieferbar: true,
        datum: new Date('2020-02-03'),
        isbn: '978-0201633610',
        homepage: 'https://acme.com/',
        schlagwoerter: ['JAVASCRIPT', 'TYPESCRIPT'],
        autoren: [
            {
                nachname: 'Gamma',
                vorname: 'Claus',
            },
        ],
        __v: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
    },
    {
        _id: '00000000-0000-0000-0000-000000000004',
        titel: 'Delta',
        rating: 3,
        art: 'DRUCKAUSGABE',
        verlag: 'BAR_VERLAG',
        preis: 44.4,
        rabatt: 0.044,
        lieferbar: true,
        datum: new Date('2020-02-04'),
        isbn: '978-0387534046',
        homepage: 'https://acme.de/',
        schlagwoerter: [],
        autoren: [
            {
                nachname: 'Delta',
                vorname: 'Dieter',
            },
        ],
        __v: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
    },
    {
        _id: '00000000-0000-0000-0000-000000000005',
        titel: 'Epsilon',
        rating: 2,
        art: 'KINDLE',
        verlag: 'FOO_VERLAG',
        preis: 55.5,
        rabatt: 0.055,
        lieferbar: true,
        datum: new Date('2020-02-05'),
        isbn: '978-3824404810',
        homepage: 'https://acme.es/',
        schlagwoerter: ['TYPESCRIPT'],
        autoren: [
            {
                nachname: 'Epsilon',
                vorname: 'Elfriede',
            },
        ],
        __v: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
    },
];

/* eslint-enable @typescript-eslint/naming-convention */
