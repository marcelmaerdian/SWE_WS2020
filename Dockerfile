# Copyright (C) 2020 - present Juergen Zimmermann
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program.  If not, see <http://www.gnu.org/licenses/>.

# https://nodejs.org/de/docs/guides/nodejs-docker-webapp
# https://docs.docker.com/engine/reference/builder

# Debian Buster statt Alpine wegen Python und GNU C++
# d.h. 900 MB statt 100 MB
FROM node:14.11.0-buster

# Verzeichnis erstellen
WORKDIR /usr/src/app

# package.json und package-lock.json in das obige Arbeitsverzeichnis kopieren
COPY package.json .
COPY package-lock.json .

# Python 3 installieren: wird fuer die Installation von bcrypt benoetigt
# dependencies (NICHT: devDependencies) installieren ("clean install")
RUN \
  apt-get install python3 && \
  npm ci --only=production

# Bundle app source
COPY dist .

# Port freigeben
EXPOSE 3000

# <Strg>C beim Stoppen des Docker-Containers
STOPSIGNAL SIGINT

# Node-Server durch das Kommando "node index.js" starten
CMD [ "node", "index.js" ]

