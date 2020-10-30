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

import type { Buch } from './../entity';
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
const withIdAndVersion = (buch: Buch) => {
    const result: any = buch;
    result.id = buch._id;
    result.version = buch.__v;
    return buch;
};

const findBuchById = async (id: string) => {
    const buch = await buchService.findById(id);
    if (buch === undefined) {
        return;
    }
    return withIdAndVersion(buch);
};

const findBuecher = async (titel: string | undefined) => {
    const suchkriterium = titel === undefined ? {} : { titel };
    const buecher = await buchService.find(suchkriterium);
    return buecher.map((buch) => withIdAndVersion(buch));
};

interface TitelCriteria {
    titel: string;
}

interface IdCriteria {
    id: string;
}

const createBuch = async (buch: Buch) => {
    buch.datum = new Date(buch.datum as string);
    const result = await buchService.create(buch);
    console.log(`resolvers createBuch(): result=${JSON.stringify(result)}`);
    return result;
};

const logUpdateResult = (
    result:
        | Buch
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
            `resolvers updateBuch(): buch aktualisiert = ${JSON.stringify(
                result,
            )}`,
        );
        // TODO hier wird getrickst, um __v als "version" im Resultat zu haben
        const updateResult: any = result;
        updateResult.version = result.__v;
    }
};

const updateBuch = async (buch: Buch) => {
    logger.debug(
        `resolvers updateBuch(): zu aktualisieren = ${JSON.stringify(buch)}`,
    );
    const version = buch.__v ?? 0;
    buch.datum = new Date(buch.datum as string);
    const result = await buchService.update(buch, version.toString());
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
    // Buecher suchen, ggf. mit Titel als Suchkriterium
    buecher: (_: unknown, { titel }: TitelCriteria) => findBuecher(titel),
    // Ein Buch mit einer bestimmten ID suchen
    buch: (_: unknown, { id }: IdCriteria) => findBuchById(id),
};

const mutation = {
    createBuch: (_: unknown, buch: Buch) => createBuch(buch),
    updateBuch: (_: unknown, buch: Buch) => updateBuch(buch),
    deleteBuch: (_: unknown, { id }: IdCriteria) => deleteBuch(id),
};

export const resolvers /* : IResolvers */ = {
    Query: query, // eslint-disable-line @typescript-eslint/naming-convention
    Mutation: mutation, // eslint-disable-line @typescript-eslint/naming-convention
};
