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

/* eslint-disable max-classes-per-file, @typescript-eslint/no-type-alias */

import type { ValidationErrorMsg } from './../entity';

export class FilmServiceError {} // eslint-disable-line @typescript-eslint/no-extraneous-class

export class FilmInvalid extends FilmServiceError {
    constructor(readonly msg: ValidationErrorMsg) {
        super();
    }
}

export class TitelExists extends FilmServiceError {
    constructor(readonly titel: string, readonly id: string) {
        super();
    }
}

export class ProdnrExists extends FilmServiceError {
    constructor(readonly prodnr: string, readonly id: string) {
        super();
    }
}

export type CreateError = FilmInvalid | TitelExists | ProdnrExists;

export class VersionInvalid extends FilmServiceError {
    constructor(readonly version: string | undefined) {
        super();
    }
}

export class VersionOutdated extends FilmServiceError {
    constructor(readonly id: string, readonly version: number) {
        super();
    }
}

export class FilmNotExists extends FilmServiceError {
    constructor(readonly id: string | undefined) {
        super();
    }
}

export type UpdateError =
    | FilmInvalid
    | FilmNotExists
    | TitelExists
    | VersionInvalid
    | VersionOutdated;

export class FilmFileServiceError {} // eslint-disable-line @typescript-eslint/no-extraneous-class

export class FileNotFound extends FilmFileServiceError {
    constructor(readonly filename: string) {
        super();
    }
}

export class MultipleFiles extends FilmFileServiceError {
    constructor(readonly filename: string) {
        super();
    }
}

export type DownloadError = FilmNotExists | FileNotFound | MultipleFiles;

/* eslint-enable max-classes-per-file, @typescript-eslint/no-type-alias */
