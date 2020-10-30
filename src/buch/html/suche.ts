/*
 * Copyright (C) 2018 - present Juergen Zimmermann, Hochschule Karlsruhe
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

import type { Request, Response } from 'express';
import { BuchService } from '../service/buch.service';
import { logger } from './../../shared/logger';

const buchService = new BuchService();

export const suche = async (req: Request, res: Response) => {
    logger.error(`suche(): ${req.url}`);
    const buecher = await buchService.find();
    res.render('suche', { title: 'Suche', buecher });
};
