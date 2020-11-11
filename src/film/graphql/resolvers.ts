import {
    FilmInvalid,
    FilmNotExists,
    TitelExists,
    VersionInvalid,
    VersionOutdated,
} from './../service/errors';
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

import type { Film } from './../entity';
import { FilmService } from '../service';
// import type { IResolvers } from 'graphql-tools';
import { logger } from '../../shared';

const filmService = new FilmService();

// https://www.apollographql.com/docs/apollo-server/data/resolvers
// Zugriff auf Header-Daten, z.B. Token
// https://www.apollographql.com/docs/apollo-server/migration-two-dot/#accessing-request-headers
// https://www.apollographql.com/docs/apollo-server/security/authentication

// Resultat mit id (statt _id) und version (statt __v)
// __ ist bei GraphQL fuer interne Zwecke reserviert
const withIdAndVersion = (film: Film) => {
    const result: any = film;
    result.id = film._id;
    result.version = film.__v;
    return film;
};

const findFilmById = async (id: string) => {
    const film = await filmService.findById(id);
    if (film === undefined) {
        return;
    }
    return withIdAndVersion(film);
};

const findFilme = async (titel: string | undefined) => {
    const suchkriterium = titel === undefined ? {} : { titel };
    const filme = await filmService.find(suchkriterium);
    return filme.map((film) => withIdAndVersion(film));
};

interface TitelCriteria {
    titel: string;
}

interface IdCriteria {
    id: string;
}

const createFilm = async (film: Film) => {
    film.datum = new Date(film.datum as string);
    const result = await filmService.create(film);
    console.log(`resolvers createFilm(): result=${JSON.stringify(result)}`);
    return result;
};

const logUpdateResult = (
    result:
        | Film
        | FilmInvalid
        | TitelExists
        | FilmNotExists
        | VersionInvalid
        | VersionOutdated,
) => {
    if (result instanceof FilmInvalid) {
        logger.debug(
            `resolvers updateFilm(): validation msg = ${JSON.stringify(
                result.msg,
            )}`,
        );
    } else if (result instanceof TitelExists) {
        logger.debug(
            `resolvers updateFilm(): vorhandener titel = ${result.titel}`,
        );
    } else if (result instanceof FilmNotExists) {
        logger.debug(
            `resolvers updateFilm(): nicht-vorhandene id = ${result.id}`,
        );
    } else if (result instanceof VersionInvalid) {
        logger.debug(
            `resolvers updateFilm(): ungueltige version = ${result.version}`,
        );
    } else if (result instanceof VersionOutdated) {
        logger.debug(
            `resolvers updateFilm(): alte version = ${result.version}`,
        );
    } else {
        logger.debug(
            `resolvers updateFilm(): film aktualisiert = ${JSON.stringify(
                result,
            )}`,
        );
        // TODO hier wird getrickst, um __v als "version" im Resultat zu haben
        const updateResult: any = result;
        updateResult.version = result.__v;
    }
};

const updateFilm = async (film: Film) => {
    logger.debug(
        `resolvers updateFilm(): zu aktualisieren = ${JSON.stringify(film)}`,
    );
    const version = film.__v ?? 0;
    film.datum = new Date(film.datum as string);
    const result = await filmService.update(film, version.toString());
    logUpdateResult(result);
    return result;
};

const deleteFilm = async (id: string) => {
    const result = await filmService.delete(id);
    logger.debug(`resolvers deleteFilm(): result = ${result}`);
    return result;
};

// Queries passend zu "type Query" in typeDefs.ts
const query = {
    // Filme suchen, ggf. mit Titel als Suchkriterium
    filme: (_: unknown, { titel }: TitelCriteria) => findFilme(titel),
    // Ein Film mit einer bestimmten ID suchen
    film: (_: unknown, { id }: IdCriteria) => findFilmById(id),
};

const mutation = {
    createFilm: (_: unknown, film: Film) => createFilm(film),
    updateFilm: (_: unknown, film: Film) => updateFilm(film),
    deleteFilm: (_: unknown, { id }: IdCriteria) => deleteFilm(id),
};

export const resolvers /* : IResolvers */ = {
    Query: query, // eslint-disable-line @typescript-eslint/naming-convention
    Mutation: mutation, // eslint-disable-line @typescript-eslint/naming-convention
};
