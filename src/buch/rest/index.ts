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

import type { Request, Response } from 'express';
import { BuchFileRequestHandler } from './buch-file.request-handler';
import { BuchRequestHandler } from './buch.request-handler';

const handler = new BuchRequestHandler();
const fileHandler = new BuchFileRequestHandler();

export const findById = (req: Request, res: Response) =>
    handler.findById(req, res);
export const find = (req: Request, res: Response) => handler.find(req, res);
export const create = (req: Request, res: Response) => handler.create(req, res);
export const update = (req: Request, res: Response) => handler.update(req, res);
export const deleteFn = (req: Request, res: Response) =>
    handler.delete(req, res);
export const upload = (req: Request, res: Response) =>
    fileHandler.upload(req, res);
export const download = (req: Request, res: Response) =>
    fileHandler.download(req, res);
