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

import { FilmArt, Produktion } from '../../../src/film/entity';
import { HttpMethod, agent, createTestserver } from '../../testserver';
import { HttpStatus, logger, serverConfig } from '../../../src/shared';
import { afterAll, beforeAll, describe, test } from '@jest/globals';
import fetch, { Headers, Request } from 'node-fetch';
import type { AddressInfo } from 'net';
import { PATHS } from '../../../src/app';
import type { Server } from 'http';
import chai from 'chai';
import { login } from '../../login';

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
const geaendertesFilm: object = {
    // isbn wird nicht geaendert
    titel: 'Geaendert',
    rating: 1,
    art: FilmArt.ZWEIDIMENSIONAL,
    produktion: Produktion.CONSTANTIN_FILM,
    preis: 33.33,
    rabatt: 0.033,
    lieferbar: true,
    datum: '2016-02-03',
    homepage: 'https://test.te',
    regisseure: [{ nachname: 'Gamma', vorname: 'Claus' }],
    schlagwoerter: ['JAVASCRIPT', 'TYPESCRIPT'],
};
const idVorhanden = '00000000-0000-0000-0000-000000000003';

const geaendertesFilmIdNichtVorhanden: object = {
    titel: 'Nichtvorhanden',
    rating: 1,
    art: FilmArt.ZWEIDIMENSIONAL,
    produktion: Produktion.CONSTANTIN_FILM,
    preis: 33.33,
    rabatt: 0.033,
    lieferbar: true,
    datum: '2016-02-03',
    regisseure: [{ nachname: 'Gamma', vorname: 'Claus' }],
    schlagwoerter: ['JAVASCRIPT', 'TYPESCRIPT'],
};
const idNichtVorhanden = '00000000-0000-0000-0000-000000000999';

const geaendertesFilmInvalid: object = {
    titel: 'Alpha',
    rating: -1,
    art: 'UNSICHTBAR',
    produktion: 'ENDLESS_PRODUKTION',
    preis: 0.01,
    rabatt: 0,
    lieferbar: true,
    datum: '12345-123-123',
    isbn: 'falsche-ISBN',
    regisseure: [{ nachname: 'Test', vorname: 'Theo' }],
    schlagwoerter: [],
};

const veraltesFilm: object = {
    // isbn wird nicht geaendet
    titel: 'Veraltet',
    rating: 1,
    art: FilmArt.ZWEIDIMENSIONAL,
    produktion: Produktion.CONSTANTIN_FILM,
    preis: 33.33,
    rabatt: 0.033,
    lieferbar: true,
    datum: '2016-02-03',
    homepage: 'https://test.te',
    regisseure: [{ nachname: 'Gamma', vorname: 'Claus' }],
    schlagwoerter: ['JAVASCRIPT', 'TYPESCRIPT'],
};

// -----------------------------------------------------------------------------
// T e s t s
// -----------------------------------------------------------------------------
const path = PATHS.filme;
let server: Server;
let filmeUri: string;
let loginUri: string;

// Test-Suite
describe('PUT /filme/:id', () => {
    // Testserver starten und dabei mit der DB verbinden
    beforeAll(async () => {
        server = await createTestserver();

        const address = server.address() as AddressInfo;
        const baseUri = `https://${serverConfig.host}:${address.port}`;
        filmeUri = `${baseUri}${path}`;
        logger.info(`filmeUri = ${filmeUri}`);
        loginUri = `${baseUri}${PATHS.login}`;
    });

    afterAll(() => { server.close() });

    test('Vorhandenen Film aendern', async () => {
        // given
        const token = await login(loginUri);
        const headers = new Headers({
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            'If-Match': '"0"',
        });
        const body = JSON.stringify(geaendertesFilm);
        const request = new Request(`${filmeUri}/${idVorhanden}`, {
            method: HttpMethod.PUT,
            headers,
            body,
            agent,
        });

        // when
        const response = await fetch(request);

        // then
        expect(response.status).to.be.equal(HttpStatus.NO_CONTENT);
        const responseBody = await response.text();
        expect(responseBody).to.be.empty;
    });

    test('Nicht-vorhandenen Film aendern', async () => {
        // given
        const token = await login(loginUri);
        const headers = new Headers({
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            'If-Match': '"0"',
        });
        const body = JSON.stringify(geaendertesFilmIdNichtVorhanden);
        const request = new Request(`${filmeUri}/${idNichtVorhanden}`, {
            method: HttpMethod.PUT,
            headers,
            body,
            agent,
        });

        // when
        const response = await fetch(request);

        // then
        expect(response.status).to.be.equal(HttpStatus.PRECONDITION_FAILED);
        const responseBody = await response.text();
        expect(responseBody).to.be.equal(
            `Es gibt keinen Film mit der ID "${idNichtVorhanden}".`,
        );
    });

    test('Vorhandenen Film aendern, aber mit ungueltigen Daten', async () => {
        // given
        const token = await login(loginUri);
        const headers = new Headers({
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            'If-Match': '"0"',
        });
        const body = JSON.stringify(geaendertesFilmInvalid);
        const request = new Request(`${filmeUri}/${idVorhanden}`, {
            method: HttpMethod.PUT,
            headers,
            body,
            agent,
        });

        // when
        const response = await fetch(request);

        // then
        expect(response.status).to.be.equal(HttpStatus.BAD_REQUEST);
        const { art, rating, produktion, datum, isbn } = await response.json();
        expect(art).to.be.equal(
            'Die Art eines Films muss DREIDIMENSIONAL oder ZWEIDIMENSIONAL sein.',
        );
        expect(rating).to.endWith('eine gueltige Bewertung.');
        expect(produktion).to.be.equal(
            'Die Produktion eines Films muss CONSTANTIN_FILM oder BIG_PRODUKTION sein.',
        );
        expect(datum).to.contain('ist kein gueltiges Datum');
        expect(isbn).to.endWith('eine gueltige ISBN-Nummer.');
    });

    test('Vorhandenen Film aendern, aber ohne Versionsnummer', async () => {
        // given
        const token = await login(loginUri);
        const headers = new Headers({
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        });
        const body = JSON.stringify(geaendertesFilm);
        const request = new Request(`${filmeUri}/${idVorhanden}`, {
            method: HttpMethod.PUT,
            headers,
            body,
            agent,
        });

        // when
        const response = await fetch(request);

        // then
        expect(response.status).to.be.equal(HttpStatus.PRECONDITION_REQUIRED);
        const responseBody = await response.text();
        expect(responseBody).to.be.equal('Versionsnummer fehlt');
    });

    test('Vorhandenen Film aendern, aber mit alter Versionsnummer', async () => {
        // given
        const token = await login(loginUri);
        const headers = new Headers({
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            'If-Match': '"-1"',
        });
        const body = JSON.stringify(veraltesFilm);
        const request = new Request(`${filmeUri}/${idVorhanden}`, {
            method: HttpMethod.PUT,
            headers,
            body,
            agent,
        });

        // when
        const response = await fetch(request);

        // then
        expect(response.status).to.be.equal(HttpStatus.PRECONDITION_FAILED);
        const responseBody = await response.text();
        expect(responseBody).to.have.string('Die Versionsnummer');
    });

    test('Vorhandenen Film aendern, aber ohne Token', async () => {
        // given
        const headers = new Headers({
            'Content-Type': 'application/json',
            'If-Match': '"0"',
        });
        const body = JSON.stringify(geaendertesFilm);
        const request = new Request(`${filmeUri}/${idVorhanden}`, {
            method: HttpMethod.PUT,
            headers,
            body,
            agent,
        });

        // when
        const response = await fetch(request);

        // then
        expect(response.status).to.be.equal(HttpStatus.UNAUTHORIZED);
        const responseBody = await response.text();
        expect(responseBody).to.be.equalIgnoreCase('unauthorized');
    });

    test('Vorhandenen Film aendern, aber mit falschem Token', async () => {
        // given
        const token = 'FALSCH';
        const headers = new Headers({
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            'If-Match': '"0"',
        });
        const body = JSON.stringify(geaendertesFilm);
        const request = new Request(`${filmeUri}/${idVorhanden}`, {
            method: HttpMethod.PUT,
            headers,
            body,
            agent,
        });

        // when
        const response = await fetch(request);

        // then
        expect(response.status).to.be.equal(HttpStatus.UNAUTHORIZED);
        const responseBody = await response.text();
        expect(responseBody).to.be.equalIgnoreCase('unauthorized');
    });
});
