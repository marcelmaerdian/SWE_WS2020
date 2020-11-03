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

import { BuchArt, Verlag } from '../../../src/buch/entity';
import { HttpMethod, agent, createTestserver } from '../../testserver';
import { HttpStatus, serverConfig, uuidRegexp } from '../../../src/shared';
import { afterAll, beforeAll, describe, test } from '@jest/globals';
import fetch, { Headers, Request } from 'node-fetch';
import type { AddressInfo } from 'net';
import type { Buch } from '../../../src/buch/entity';
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
const neuesBuch: Buch = {
    titel: 'Neu',
    rating: 1,
    art: BuchArt.DRUCKAUSGABE,
    verlag: Verlag.FOO_VERLAG,
    preis: 99.99,
    rabatt: 0.099,
    lieferbar: true,
    datum: '2016-02-28',
    isbn: '0-0070-0644-6',
    homepage: 'https://test.de/',
    schlagwoerter: ['JAVASCRIPT', 'TYPESCRIPT'],
    autoren: [{ nachname: 'Test', vorname: 'Theo' }],
};
const neuesBuchInvalid: object = {
    titel: 'Blabla',
    rating: -1,
    art: 'UNSICHTBAR',
    verlag: 'NO_VERLAG',
    preis: 0,
    rabatt: 0,
    lieferbar: true,
    datum: '12345-123-123',
    isbn: 'falsche-ISBN',
    autoren: [{ nachname: 'Test', vorname: 'Theo' }],
    schlagwoerter: [],
};
const neuesBuchTitelExistiert: Buch = {
    titel: 'Alpha',
    rating: 1,
    art: BuchArt.DRUCKAUSGABE,
    verlag: Verlag.FOO_VERLAG,
    preis: 99.99,
    rabatt: 0.099,
    lieferbar: true,
    datum: '2016-02-28',
    isbn: '0-0070-9732-8',
    homepage: 'https://test.de/',
    autoren: [{ nachname: 'Test', vorname: 'Theo' }],
    schlagwoerter: ['JAVASCRIPT', 'TYPESCRIPT'],
};

// -----------------------------------------------------------------------------
// T e s t s
// -----------------------------------------------------------------------------
let server: Server;
const path = PATHS.buecher;
let buecherUri: string;
let loginUri: string;

// Test-Suite
describe('POST /buecher', () => {
    // Testserver starten und dabei mit der DB verbinden
    beforeAll(async () => {
        server = await createTestserver();

        const address = server.address() as AddressInfo;
        const baseUri = `https://${serverConfig.host}:${address.port}`;
        buecherUri = `${baseUri}${path}`;
        loginUri = `${baseUri}${PATHS.login}`;
    });

    // (done?: DoneFn) => Promise<void | undefined | unknown> | void | undefined
    // close(callback?: (err?: Error) => void): this
    afterAll(() => { server.close() });

    test('Neues Buch', async () => {
        // given
        const token = await login(loginUri);

        const headers = new Headers({
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        });
        const body = JSON.stringify(neuesBuch);
        const request = new Request(buecherUri, {
            method: HttpMethod.POST,
            headers,
            body,
            agent,
        });

        // when
        const response = await fetch(request);

        // then
        const { status } = response;
        expect(status).to.be.equal(HttpStatus.CREATED);

        const location = response.headers.get('Location');
        expect(location).to.exist;
        expect(typeof location === 'string').to.be.true;
        expect(location).not.to.be.empty;

        // UUID: Muster von HEX-Ziffern
        const indexLastSlash: number = location?.lastIndexOf('/') as number;
        const idStr = location?.slice(indexLastSlash + 1);
        expect(idStr).not.to.be.empty;
        expect(uuidRegexp.test(idStr as string)).to.be.true;

        const responseBody = response.text();
        expect(responseBody).to.be.empty;
    });

    test('Neues Buch mit ungueltigen Daten', async () => {
        // given
        const token = await login(loginUri);
        const headers = new Headers({
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        });
        const body = JSON.stringify(neuesBuchInvalid);
        const request = new Request(buecherUri, {
            method: HttpMethod.POST,
            headers,
            body,
            agent,
        });

        // when
        const response = await fetch(request);

        // then
        expect(response.status).to.be.equal(HttpStatus.BAD_REQUEST);
        const { art, rating, verlag, datum, isbn } = await response.json();

        expect(art).to.be.equal(
            'Die Art eines Buches muss KINDLE oder DRUCKAUSGABE sein.',
        );
        expect(rating).to.endWith('eine gueltige Bewertung.');
        expect(verlag).to.be.equal(
            'Der Verlag eines Buches muss FOO_VERLAG oder BAR_VERLAG sein.',
        );
        expect(datum).to.contain('ist kein gueltiges Datum');
        expect(isbn).to.endWith('eine gueltige ISBN-Nummer.');
    });

    test('Neues Buch, aber der Titel existiert bereits', async () => {
        // given
        const token = await login(loginUri);
        const headers = new Headers({
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        });
        const body = JSON.stringify(neuesBuchTitelExistiert);
        const request = new Request(buecherUri, {
            method: HttpMethod.POST,
            headers,
            body,
            agent,
        });

        // when
        const response = await fetch(request);

        // then
        expect(response.status).to.be.equal(HttpStatus.BAD_REQUEST);
        const responseBody = await response.text();
        expect(responseBody).has.string('Titel');
    });

    test('Neues Buch, aber ohne Token', async () => {
        // given
        const headers = new Headers({ 'Content-Type': 'application/json' });
        const body = JSON.stringify(neuesBuchTitelExistiert);
        const request = new Request(buecherUri, {
            method: HttpMethod.POST,
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

    test('Neues Buch, aber mit falschem Token', async () => {
        // given
        const token = 'FALSCH';
        const headers = new Headers({
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        });
        const body = JSON.stringify(neuesBuch);
        const request = new Request(buecherUri, {
            method: HttpMethod.POST,
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

    test.todo('Test mit abgelaufenem Token');
});
