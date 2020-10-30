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

/**
 * Typdefinitionen fuer GraphQL:
 *  Vordefinierte skalare Typen
 *      Int: 32‐bit Integer
 *      Float: Gleitkommmazahl mit doppelter Genauigkeit
 *      String:
 *      Boolean: true, false
 *      ID: eindeutiger Bezeichner, wird serialisiert wie ein String
 *  Buch: eigene Typdefinition für Queries
 *        "!" markiert Pflichtfelder
 *  Query: Signatur der Lese-Methoden
 *  Mutation: Signatur der Schreib-Methoden
 */

import { gql } from 'apollo-server-express';

// https://www.apollographql.com/docs/apollo-server/migration-two-dot/#the-gql-tag
// https://www.apollographql.com/docs/apollo-server/schema/schema

// "Tagged Template String", d.h. der Template-String wird durch eine Funktion
// (hier: gql) modifiziert. Die Funktion gql wird fuer Syntax-Highlighting und
// fuer die Formatierung durch Prettier verwendet.
export const typeDefs = gql`
    "Enum-Typ fuer die Art eines Buches"
    enum Art {
        DRUCKAUSGABE
        KINDLE
    }

    "Enum-Typ fuer den Verlag eines Buches"
    enum Verlag {
        FOO_VERLAG
        BAR_VERLAG
    }

    "Datenschema eines Buches, das empfangen oder gesendet wird"
    type Buch {
        id: ID!
        version: Int
        titel: String!
        rating: Int
        art: Art
        verlag: Verlag!
        preis: Float
        rabatt: Float
        lieferbar: Boolean
        datum: String
        isbn: String
        homepage: String
        schlagwoerter: [String]
    }

    "Funktionen, um Buecher zu empfangen"
    type Query {
        buecher(titel: String): [Buch]
        buch(id: ID!): Buch
    }

    "Funktionen, um Buecher anzulegen, zu aktualisieren oder zu loeschen"
    type Mutation {
        createBuch(
            titel: String!
            rating: Int
            art: String
            verlag: String!
            preis: Float
            rabatt: Float
            lieferbar: Boolean
            datum: String
            isbn: String
            homepage: String
            schlagwoerter: [String]
        ): Buch
        updateBuch(
            _id: ID
            titel: String!
            rating: Int
            art: String
            verlag: String!
            preis: Float
            rabatt: Float
            lieferbar: Boolean
            datum: String
            isbn: String
            homepage: String
            schlagwoerter: [String]
            version: Int
        ): Buch
        deleteBuch(id: ID!): Boolean
    }
`;
