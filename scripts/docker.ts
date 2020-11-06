/*
 * Copyright (C) 2020 - present Juergen Zimmermann, Hochschule Karlsruhe
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

import { exec } from 'shelljs';
import minimist from 'minimist';
import { resolve } from 'path';

const argv = minimist(process.argv.slice(0));
const values = argv._;

const image = 'juergenzimmermann/film:1.0.0';
const containername = 'film';

const startContainer = () => {
    const logfile = resolve(process.cwd(), 'server.log');
    exec(
        // prettier-ignore
        'docker run --publish 3000:3000 ' +
            `--mount type=bind,source=${logfile},destination=/usr/src/app/server.log ` +
            '--env NODE_ENV=development ' +
            '--env DB_HOST=host.docker.internal ' +
            '--env DB_TLS=false ' +
            '--env DB_POPULATE=true ' +
            '--env APOLLO_PLAYGROUND=true ' +
            '--env MAIL_HOST=host.docker.internal ' +
            '--env MAIL_LOG=false ' +
            '--env USER_PASSWORD_ENCODED=$2b$10$YTg4.iW.FPRqHExVLRf05Ob/z/BQqjUxJgncct2TgxGBjl4cCUNGS ' +
            '--env TZ=Europe/Berlin ' +
            `--name ${containername} --hostname film --rm ` +
            image,
    );
};

const build = () => {
    // Dockerfile im aktuellen Verzeichnis
    // Download der diversen Layer fuer node:x.y.z-buster
    exec(`docker build --tag ${image} .`);
};

switch (values[2]) {
    case undefined:
    case 'start':
        startContainer();
        break;

    case 'build':
        build();
        break;

    default:
        console.log('npm run docker [start|build]');
}
