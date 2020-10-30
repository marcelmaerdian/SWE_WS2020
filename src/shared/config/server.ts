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

// Umgebungsvariable durch die Konfigurationsdatei .env
import JSON5 from 'json5';
import RE2 from 're2';
import dotenv from 'dotenv';
import { hostname } from 'os';
import ip from 'ip';
import { readFileSync } from 'fs';
import { resolve } from 'path';

export enum Cloud {
    HEROKU = 'heroku',
    OPENSHIFT = 'openshift',
}

interface ServerConfig {
    dev: boolean;
    production: boolean;
    host: string;
    port: number;
    ip: string;
    cloud: Cloud | undefined;
    playground: boolean;
    key?: Buffer;
    cert?: Buffer;
    mailHost: string;
    mailPort: number;
    mailLog: boolean;
}

// .env nur einlesen, falls nicht in der Cloud
dotenv.config();

const computername = hostname();
const ipAddress = ip.address();

// https://github.com/google/re2
// https://github.com/uhop/node-re2
export const uuidRegexp = new RE2(
    '[\\dA-Fa-f]{8}-[\\dA-Fa-f]{4}-[\\dA-Fa-f]{4}-[\\dA-Fa-f]{4}-[\\dA-Fa-f]{12}',
    'u',
);

// hostname() ist bei
//  * Heroku:       eine UUID
//  * OpenShift:    <Projektname_aus_package.json>-<Build-Nr>-<random-alphanumeric-5stellig>
let cloud: Cloud | undefined;
const herokuRegexp = uuidRegexp;
if (herokuRegexp.test(computername)) {
    cloud = Cloud.HEROKU;
} else {
    const openshiftRegexp = new RE2('beispiel-\\d+-w{5}', 'u');
    if (openshiftRegexp.test(computername)) {
        cloud = Cloud.OPENSHIFT;
    }
}

const { env } = process;
const {
    NODE_ENV,
    SERVER_PORT,
    APOLLO_PLAYGROUND,
    MAIL_HOST,
    MAIL_PORT,
    MAIL_LOG,
} = env;
const production = NODE_ENV === 'production';

let dev = false;
if (
    NODE_ENV !== undefined &&
    (NODE_ENV.startsWith('dev') || NODE_ENV.startsWith('test'))
) {
    dev = true;
}

let port = Number.NaN;
if (SERVER_PORT !== undefined) {
    port = Number.parseInt(SERVER_PORT, 10);
}
if (Number.isNaN(port)) {
    // SERVER_PORT ist zwar gesetzt, aber keine Zahl
    // https://devcenter.heroku.com/articles/runtime-principles#web-servers
    port =
        cloud === undefined || cloud === Cloud.OPENSHIFT
            ? 3000 // eslint-disable-line @typescript-eslint/no-magic-numbers
            : Number.parseInt(env.PORT as string, 10);
}

const playground = APOLLO_PLAYGROUND === 'true' || APOLLO_PLAYGROUND === 'TRUE';

// HS Karlsruhe:   smtp.hs-karlsruhe.de
const mailHost = MAIL_HOST ?? 'localhost';
// HS Karlsruhe:   25
const mailPortStr = MAIL_PORT ?? '5025';
const mailPort = Number.parseInt(mailPortStr, 10);
const mailLog = MAIL_LOG === 'true' || MAIL_LOG === 'TRUE';

export const serverConfig: ServerConfig = {
    dev,
    production,
    host: computername,
    ip: ipAddress,
    port,
    cloud,
    playground,

    // https://nodejs.org/api/fs.html
    // https://nodejs.org/api/path.html
    // http://2ality.com/2017/11/import-meta.html
    /* global __dirname */
    key:
        cloud === undefined
            ? readFileSync(resolve(__dirname, 'key.pem'))
            : undefined,
    cert:
        cloud === undefined
            ? readFileSync(resolve(__dirname, 'certificate.cer'))
            : undefined,
    mailHost,
    mailPort,
    mailLog,
};

const logServerConfig = {
    dev,
    production,
    host: computername,
    port,
    ip: ipAddress,
    cloud,
    playground,
    mailHost,
    mailPort,
    mailLog,
};
console.info(`serverConfig: ${JSON5.stringify(logServerConfig)}`);
