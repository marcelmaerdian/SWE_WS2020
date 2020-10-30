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

// https://github.com/i0natan/nodebestpractices

// Stacktraces mit Beruecksichtigung der TypeScript-Dateien
import 'source-map-support/register';

import { connectDB, logger, populateDB, serverConfig } from './shared';
import { release, type } from 'os';
import type { Application } from 'express';
import JSON5 from 'json5';
// "type-only import" ab TypeScript 3.8
import type { RequestListener } from 'http';
import type { SecureContextOptions } from 'tls';
import type { Server } from 'net';
import { app } from './app';
import { connection } from 'mongoose';
import { createServer } from 'https';
import ip from 'ip';
import stripIndent from 'strip-indent';

/* eslint-disable no-process-exit */
// Arrow Function
const disconnectDB = () => {
    connection.close().catch(() => process.exit(0)); // eslint-disable-line node/no-process-exit
};

const shutdown = () => {
    logger.info('Server wird heruntergefahren...');
    disconnectDB();
    process.exit(0); // eslint-disable-line node/no-process-exit
};
/* eslint-enable no-process-exit */

// Destructuring
const { cloud, host, port } = serverConfig;
const printBanner = () => {
    // Heroku entfernt fuehrende Leerzeichen
    const banner = `

        .       __                                    _____
        .      / /_  _____  _________ ____  ____     /__  /
        . __  / / / / / _ \\/ ___/ __ \`/ _ \\/ __ \\      / /
        ./ /_/ / /_/ /  __/ /  / /_/ /  __/ / / /     / /___
        .\\____/\\__,_/\\___/_/   \\__, /\\___/_/ /_/     /____(_)
        .                     /____/

    `;

    logger.info(stripIndent(banner));
    // https://nodejs.org/api/process.html
    logger.info(`Node:           ${process.version}`);
    logger.info(`Betriebssystem: ${type()} ${release()}`);
    logger.info(`Rechnername:    ${host}`);
    logger.info(`IP-Adresse:     ${ip.address()}`);
    logger.info('');
    if (cloud === undefined) {
        logger.info(
            `https://${host}:${port} ist gestartet: Herunterfahren durch <Strg>C`,
        );
    } else {
        logger.info('Der Server ist gestartet: Herunterfahren durch <Strg>C');
    }
};

const startServer = () => {
    let server: Server | Application;
    if (cloud === undefined) {
        const { cert, key } = serverConfig;
        // Shorthand Properties
        const options: SecureContextOptions = {
            key,
            cert,
            minVersion: 'TLSv1.3',
        };
        // https://stackoverflow.com/questions/11744975/enabling-https-on-express-js#answer-11745114
        server = createServer(options, app as RequestListener);
    } else {
        server = app;
    }
    server.listen(port, printBanner);

    // util.promisify(fn) funktioniert nur mit Funktionen, bei denen
    // der error-Callback das erste Funktionsargument ist
    // <Strg>C
    process.on('SIGINT', shutdown);

    // nodemon nutzt SIGUSR2
    process.once('SIGUSR2', disconnectDB);

    // Falls bei einem Promise die Fehlerbehandlung fehlt
    process.on('unhandledRejection', (err) => {
        logger.error('unhandled rejection', err);
    });
};

// IIFE (= Immediately Invoked Function Expression) statt top-level await
// https://developer.mozilla.org/en-US/docs/Glossary/IIFE
// https://github.com/typescript-eslint/typescript-eslint/issues/647
// https://github.com/typescript-eslint/typescript-eslint/pull/1799
(async () => {
    try {
        await populateDB();
        await connectDB();
        startServer();
    } catch (err: unknown) {
        logger.error(`Fehler beim Start des Servers: ${JSON5.stringify(err)}`);
    }
})();
