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

import dotenv from 'dotenv';
const result = dotenv.config();
if (result.error !== undefined) {
    throw result.error;
}
console.info(`.env: ${JSON.stringify(result.parsed)}`);

import { dbConfig } from '../src/shared/config/db';
import { exec } from 'shelljs';
import minimist from 'minimist';
import { resolve } from 'path';

const argv = minimist(process.argv.slice(0));
const values = argv._;
if (values.length != 2) {
    console.error(
        'Das Skript muss ohne zusaetzliche Argumente aufgerufen werden',
    );
    process.exit();
}

const containername = 'mongodb';
const { atlas, host, port, mockDB } = dbConfig;

if (atlas || mockDB) {
    console.warn('Atlas ist konfiguriert!');
    process.exit();
}

// const version = '4.4.1';
const version = '4.2.10';
const mongodbDir = resolve(
    'C:\\',
    'Zimmermann',
    'volumes',
    'mongodb-replicaset-4.2',
);

console.log('');
console.log(`MongoDB ${version} wird als Docker-Container gestartet`);
console.log('');
exec(
    // prettier-ignore
    'docker run ' +
        `--publish ${port}:${port} ` +
        `--mount type=bind,source=${resolve(mongodbDir, 'db')},destination=/data/db ` +
        `--mount type=bind,source=${resolve(mongodbDir, 'log')},destination=/var/mongodb ` +
        `--mount type=bind,source=${resolve(mongodbDir, 'tls')},destination=/etc/mongodb,readonly ` +
        '--env TZ=Europe/Berlin ' +
        `--name ${containername} --hostname ${host} --rm ` +
        `mongo:${version} ` +
        '--auth ' +
        '--wiredTigerCacheSizeGB 0.3 --replSet replicaSet --oplogSize 900 ' +
        '--logpath /var/mongodb/mongodb.log ' +
        '--tlsCertificateKeyFile /etc/mongodb/key.pem --tlsAllowInvalidCertificates ' +
        '--tlsMode preferTLS --tlsDisabledProtocols TLS1_1',
);
