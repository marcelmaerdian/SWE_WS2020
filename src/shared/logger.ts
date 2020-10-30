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

import { consoleOptions, fileOptions, serverConfig } from './config';
import { createLogger, transports } from 'winston';
import JSON5 from 'json5';

// Winston: seit 2010 bei GoDaddy (Registrierung von Domains)
// Log-Levels: error, warn, info, debug, verbose, silly, ...
// Medien (= Transports): Console, File, ...
// https://github.com/winstonjs/winston/blob/master/docs/transports.md
// Alternative: Bunyan, Pino

const { cloud } = serverConfig;
const { Console, File } = transports; // eslint-disable-line @typescript-eslint/naming-convention
/* eslint-disable object-curly-newline */
export const logger =
    cloud === undefined
        ? createLogger({
              transports: [new Console(consoleOptions), new File(fileOptions)],
          })
        : createLogger({
              transports: new Console(consoleOptions),
          });
/* eslint-enable object-curly-newline */

logger.info('Logging durch Winston ist konfiguriert');
logger.debug(`consoleOptions: ${JSON5.stringify(consoleOptions)}`);

if (cloud === undefined) {
    logger.debug(`fileOptions: ${JSON5.stringify(fileOptions)}`);
}
