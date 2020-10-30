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

export class BuchServiceError {} // eslint-disable-line @typescript-eslint/no-extraneous-class

export class BuchInvalid extends BuchServiceError {
    constructor(readonly msg: ValidationErrorMsg) {
        super();
    }
}

export class TitelExists extends BuchServiceError {
    constructor(readonly titel: string, readonly id: string) {
        super();
    }
}

export class IsbnExists extends BuchServiceError {
    constructor(readonly isbn: string, readonly id: string) {
        super();
    }
}

export type CreateError = BuchInvalid | TitelExists | IsbnExists;

export class VersionInvalid extends BuchServiceError {
    constructor(readonly version: string | undefined) {
        super();
    }
}

export class VersionOutdated extends BuchServiceError {
    constructor(readonly id: string, readonly version: number) {
        super();
    }
}

export class BuchNotExists extends BuchServiceError {
    constructor(readonly id: string | undefined) {
        super();
    }
}

export type UpdateError =
    | BuchInvalid
    | BuchNotExists
    | TitelExists
    | VersionInvalid
    | VersionOutdated;

export class BuchFileServiceError {} // eslint-disable-line @typescript-eslint/no-extraneous-class

export class FileNotFound extends BuchFileServiceError {
    constructor(readonly filename: string) {
        super();
    }
}

export class MultipleFiles extends BuchFileServiceError {
    constructor(readonly filename: string) {
        super();
    }
}

export type DownloadError = BuchNotExists | FileNotFound | MultipleFiles;

/* eslint-enable max-classes-per-file, @typescript-eslint/no-type-alias */
