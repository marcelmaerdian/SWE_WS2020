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

import JSON5 from 'json5';
import { logger } from '../../shared';
import { users } from './users';

export interface User {
    id: string;
    username: string;
    password: string;
    email: string;
    roles?: string[];
}

export class UserService {
    constructor() {
        logger.info(`UsersService: users=${JSON5.stringify(users)}`);
    }

    findByUsername(username: string) {
        return users.find((u: User) => u.username === username);
    }

    findById(id: string) {
        return users.find((user: User) => user.id === id);
    }

    findByEmail(email: string) {
        return users.find((user: User) => user.email === email);
    }
}
