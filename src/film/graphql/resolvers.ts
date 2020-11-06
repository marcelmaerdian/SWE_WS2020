import {
    BuchInvalid,
    BuchNotExists,
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
import { BuchService } from '../service';
// import type { IResolvers } from 'graphql-tools';
import { logger } from '../../shared';

const buchService = new BuchService();

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

const findBuchById = async (id: string) => {
    const film = await buchService.findById(id);
    if (film === undefined) {
        return;
    }
    return withIdAndVersion(film);
};

const findBuecher = async (titel: string | undefined) => {
    const suchkriterium = titel === undefined ? {} : { titel };
    const filme = await buchService.find(suchkriterium);
    return filme.map((film) => withIdAndVersion(film));
};

interface TitelCriteria {
    titel: string;
}

interface IdCriteria {
    id: string;
}

const createBuch = async (film: Film) => {
    film.datum = new Date(film.datum as string);
    const result = await buchService.create(film);
    console.log(`resolvers createBuch(): result=${JSON.stringify(result)}`);
    return result;
};

const logUpdateResult = (
    result:
        | Film
        | BuchInvalid
        | TitelExists
        | BuchNotExists
        | VersionInvalid
        | VersionOutdated,
) => {
    if (result instanceof BuchInvalid) {
        logger.debug(
            `resolvers updateBuch(): validation msg = ${JSON.stringify(
                result.msg,
            )}`,
        );
    } else if (result instanceof TitelExists) {
        logger.debug(
            `resolvers updateBuch(): vorhandener titel = ${result.titel}`,
        );
    } else if (result instanceof BuchNotExists) {
        logger.debug(
            `resolvers updateBuch(): nicht-vorhandene id = ${result.id}`,
        );
    } else if (result instanceof VersionInvalid) {
        logger.debug(
            `resolvers updateBuch(): ungueltige version = ${result.version}`,
        );
    } else if (result instanceof VersionOutdated) {
        logger.debug(
            `resolvers updateBuch(): alte version = ${result.version}`,
        );
    } else {
        logger.debug(
            `resolvers updateBuch(): film aktualisiert = ${JSON.stringify(
                result,
            )}`,
        );
        // TODO hier wird getrickst, um __v als "version" im Resultat zu haben
        const updateResult: any = result;
        updateResult.version = result.__v;
    }
};

const updateBuch = async (film: Film) => {
    logger.debug(
        `resolvers updateBuch(): zu aktualisieren = ${JSON.stringify(film)}`,
    );
    const version = film.__v ?? 0;
    film.datum = new Date(film.datum as string);
    const result = await buchService.update(film, version.toString());
    logUpdateResult(result);
    return result;
};

const deleteBuch = async (id: string) => {
    const result = await buchService.delete(id);
    logger.debug(`resolvers deleteBuch(): result = ${result}`);
    return result;
};

// Queries passend zu "type Query" in typeDefs.ts
const query = {
    // Filme suchen, ggf. mit Titel als Suchkriterium
    filme: (_: unknown, { titel }: TitelCriteria) => findBuecher(titel),
    // Ein Film mit einer bestimmten ID suchen
    film: (_: unknown, { id }: IdCriteria) => findBuchById(id),
};

const mutation = {
    createBuch: (_: unknown, film: Film) => createBuch(film),
    updateBuch: (_: unknown, film: Film) => updateBuch(film),
    deleteBuch: (_: unknown, { id }: IdCriteria) => deleteBuch(id),
};

export const resolvers /* : IResolvers */ = {
    Query: query, // eslint-disable-line @typescript-eslint/naming-convention
    Mutation: mutation, // eslint-disable-line @typescript-eslint/naming-convention
};
