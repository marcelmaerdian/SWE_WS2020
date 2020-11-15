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

export enum Produktion {
    CONSTANTIN_FILM = 'CONSTANTIN_FILM',
    BIG_PRODUKTION = 'BIG_PRODUKTION',
}

export enum FilmArt {
    DREIDIMENSIONAL = 'DREIDIMENSIONAL',
    ZWEIDIMENSIONAL = 'ZWEIDIMENSIONAL',
}

// gemeinsames Basis-Interface fuer REST und GraphQL
export interface Film {
    _id?: string; // eslint-disable-line @typescript-eslint/naming-convention
    __v?: number; // eslint-disable-line @typescript-eslint/naming-convention
    titel: string | undefined | null;
    rating: number | undefined | null;
    art: FilmArt | '' | undefined | null;
    produktion: Produktion | '' | undefined | null;
    preis: number;
    rabatt: number | undefined;
    lieferbar: boolean;
    datum: string | Date | undefined;
    prodnr: string | undefined | null;
    homepage: string | undefined | null;
    schlagwoerter?: string[];
    regisseure: unknown;
}

export interface FilmData extends Film {
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
