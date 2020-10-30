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

export enum Verlag {
    FOO_VERLAG = 'FOO_VERLAG',
    BAR_VERLAG = 'BAR_VERLAG',
}

export enum BuchArt {
    KINDLE = 'KINDLE',
    DRUCKAUSGABE = 'DRUCKAUSGABE',
}

// gemeinsames Basis-Interface fuer REST und GraphQL
export interface Buch {
    _id?: string; // eslint-disable-line @typescript-eslint/naming-convention
    __v?: number; // eslint-disable-line @typescript-eslint/naming-convention
    titel: string | undefined | null;
    rating: number | undefined | null;
    art: BuchArt | '' | undefined | null;
    verlag: Verlag | '' | undefined | null;
    preis: number;
    rabatt: number | undefined;
    lieferbar: boolean;
    datum: string | Date | undefined;
    isbn: string | undefined | null;
    homepage: string | undefined | null;
    schlagwoerter?: string[];
    autoren: unknown;
}

export interface BuchData extends Buch {
    createdAt?: number;
    updatedAt?: number;

    // eslint-disable-next-line @typescript-eslint/naming-convention
    _links?: {
        self?: { href: string };
        list?: { href: string };
        add?: { href: string };
        update?: { href: string };
        remove?: { href: string };
    };
}
