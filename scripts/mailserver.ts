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

const containername = 'fake-smtp-server';
const version = '1.6.0';

console.log('');
console.log(`fake-smtp-server ${version} wird als Docker-Container gestartet`);
console.log('');

exec(
    // prettier-ignore
    'docker run ' +
        '--publish 5025:5025 --publish 5080:5080 --publish 5081:5081 ' +
        '--env spring.output.ansi.enabled=ALWAYS ' +
        '--env spring.jpa.open-in-view=true ' +
        '--env TZ=Europe/Berlin ' +
        `--name ${containername} --rm ` +
        `gessnerfl/fake-smtp-server:${version}`,
);
