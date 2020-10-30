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

import { Cloud, serverConfig } from './server';
import { format } from 'winston';

// Winston: seit 2010 bei GoDaddy (Registrierung von Domains)
// Log-Levels: error, warn, info, debug, verbose, silly, ...
// Medien (= Transports): Console, File, ...
// https://github.com/winstonjs/winston/blob/master/docs/transports.md
// Alternative: Bunyan, Pino

const { colorize, combine, json, simple, timestamp } = format;
const { cloud, production } = serverConfig;

const loglevelConsoleDev = cloud === undefined ? 'info' : 'debug';
const consoleFormat =
    cloud === undefined ? combine(colorize(), simple()) : simple();
export const consoleOptions = {
    level: production && cloud !== Cloud.HEROKU ? 'warn' : loglevelConsoleDev,
    format: consoleFormat,
};

export const fileOptions = {
    filename: 'server.log',
    level: production ? 'info' : 'debug',
    // 250 KB
    maxsize: 250000,
    maxFiles: 3,
    format: combine(timestamp(), json()),
};
