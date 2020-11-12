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

import { HttpStatus, serverConfig } from '../../../src/shared';
import { agent, createTestserver } from '../../testserver';
import { afterAll, beforeAll, describe, test } from '@jest/globals';
import type { AddressInfo } from 'net';
import type { FilmData } from '../../../src/film/entity';
import { PATHS } from '../../../src/app';
import type { Server } from 'http';
import chai from 'chai';
import each from 'jest-each';
import fetch from 'node-fetch';

const { expect } = chai;

// IIFE (= Immediately Invoked Function Expression) statt top-level await
// https://developer.mozilla.org/en-US/docs/Glossary/IIFE
(async () => {
    // startWith(), endWith()
    const chaiString = await import('chai-string');
    chai.use(chaiString.default);
})();

// -----------------------------------------------------------------------------
// T e s t d a t e n
// -----------------------------------------------------------------------------
const titelVorhanden = ['a', 't', 'g'];
const titelNichtVorhanden = ['xx', 'yy'];
const schlagwoerterVorhanden = ['javascript', 'typescript'];
const schlagwoerterNichtVorhanden = ['csharp', 'php'];

// -----------------------------------------------------------------------------
// T e s t s
// -----------------------------------------------------------------------------
let server: Server;
const path = PATHS.filme;
let filmeUri: string;

// Test-Suite
describe('GET /filme', () => {
    beforeAll(async () => {
        server = await createTestserver();

        const address = server.address() as AddressInfo;
        filmeUri = `https://${serverConfig.host}:${address.port}${path}`;
    });

    afterAll(() => { server.close() });

    test('Alle Filme', async () => {
        // given

        // when
        const response = await fetch(filmeUri, { agent });

        // then
        const { status, headers } = response;
        expect(status).to.be.equal(HttpStatus.OK);
        expect(headers.get('Content-Type')).to.match(/json/iu);
        // https://jestjs.io/docs/en/expect
        // JSON-Array mit mind. 1 JSON-Objekt
        const filme: Array<any> = await response.json();
        expect(filme).not.to.be.empty;
        filme.forEach((film) => {
            const selfLink = film._links.self.href;
            expect(selfLink).to.have.string(path);
        });
    });

    each(titelVorhanden).test(
        'Filme mit einem Titel, der "%s" enthaelt',
        async (teilTitel) => {
            // given
            const uri = `${filmeUri}?titel=${teilTitel}`;

            // when
            const response = await fetch(uri, { agent });

            // then
            const { status, headers } = response;
            expect(status).to.be.equal(HttpStatus.OK);
            expect(headers.get('Content-Type')).to.match(/json/iu);
            // JSON-Array mit mind. 1 JSON-Objekt
            const body = await response.json();
            expect(body).not.to.be.empty;

            // Jedes Film hat einen Titel mit dem Teilstring 'a'
            body.map((film: FilmData) => film.titel).forEach((titel: string) =>
                expect(titel.toLowerCase()).to.have.string(teilTitel),
            );
        },
    );

    each(titelNichtVorhanden).test(
        'Keine Filme mit einem Titel, der "%s" nicht enthaelt',
        async (teilTitel) => {
            // given
            const uri = `${filmeUri}?titel=${teilTitel}`;

            // when
            const response = await fetch(uri, { agent });

            // then
            expect(response.status).to.be.equal(HttpStatus.NOT_FOUND);
            const body = await response.text();
            expect(body).to.be.equalIgnoreCase('not found');
        },
    );

    each(schlagwoerterVorhanden).test(
        'Mind. 1 Film mit dem Schlagwort "%s"',
        async (schlagwort) => {
            // given
            const uri = `${filmeUri}?${schlagwort}=true`;

            // when
            const response = await fetch(uri, { agent });

            // then
            const { status, headers } = response;
            expect(status).to.be.equal(HttpStatus.OK);
            expect(headers.get('Content-Type')).to.match(/json/iu);
            // JSON-Array mit mind. 1 JSON-Objekt
            const body = await response.json();
            expect(body).not.to.be.empty;

            // Jedes Film hat im Array der Schlagwoerter "javascript"
            body.map(
                (film: FilmData) => film.schlagwoerter,
            ).forEach((s: Array<string>) =>
                expect(s).to.include(schlagwort.toUpperCase()),
            );
        },
    );

    each(schlagwoerterNichtVorhanden).test(
        'Keine Filme mit dem Schlagwort "%s"',
        async (schlagwort) => {
            // given
            const uri = `${filmeUri}?${schlagwort}=true`;

            // when
            const response = await fetch(uri, { agent });

            // then
            expect(response.status).to.be.equal(HttpStatus.NOT_FOUND);
            const body = await response.text();
            expect(body).to.be.equalIgnoreCase('not found');
        },
    );
});
