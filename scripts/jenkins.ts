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

const containername = 'jenkins';
const network = 'jenkins';
const dockerContainerName = 'jenkins-docker';
const networkAlias = 'docker';

// const dockerCertsVolume = 'jenkins-docker-certs';
// const dataVolume = 'jenkins-data';

const jenkinsDir = resolve('C:\\', 'Zimmermann', 'volumes', 'jenkins');
const dockerCertsDir = resolve(jenkinsDir, 'docker-certs');
const dataDir = resolve(jenkinsDir, 'data');

const startJenkins = () => {
    // docker pull jenkinsci/blueocean:$version
    const version = '1.24.1';

    const hostPort = '9090';
    console.log(`URL fuer den Jenkins-Container: http://localhost:${hostPort}`);
    console.log('');
    // login=admin, password=Software Engineering WI.

    // Port 50000 fuer "JNLP-based Jenkins agents", die mit dem Jenkins-Master kommunizieren
    // /var/log/jenkins/jenkins.log
    exec(
        // prettier-ignore
        `docker run --publish 9090:8080 --publish 50000:50000 ` +
        `--mount type=bind,source=${dockerCertsDir},destination=/certs/client,readonly ` +
        `--mount type=bind,source=${dataDir},destination=/var/jenkins_home ` +
        `--mount type=bind,source=${process.cwd()},destination=/git-repository/beispiel,readonly ` +
        `--network ${network} --env DOCKER_HOST=tcp://${networkAlias}:2376 `+
        '--env DOCKER_CERT_PATH=/certs/client --env DOCKER_TLS_VERIFY=1 ' +
        '--env TZ=Europe/Berlin ' +
        `--name ${containername} --rm ` +
        `jenkinsci/blueocean:${version}`,
    );
};

const cert = () => {
    const version = '19.03.13-dind';
    exec(
        // prettier-ignore
        'docker run ' +
            `--mount type=bind,source=${dockerCertsDir},destination=/certs/client ` +
            `--mount type=bind,source=${dataDir},destination=/var/jenkins_home ` +
            `--privileged --network ${network} --network-alias ${networkAlias} ` +
            '--env DOCKER_TLS_CERTDIR=/certs ' +
            '--env TZ=Europe/Berlin ' +
            `--name ${dockerContainerName} --rm ` +
            `docker:${version}`,
    );
};

const createNetwork = () => {
    exec(`docker network create ${network}`);
};

// const createVolumes = () => {
//     exec(`docker volume create ${dockerCertsVolume}`);
//     exec(`docker volume create ${dataVolume}`);
//     exec(`docker volume inspect ${dockerCertsVolume} ${dataVolume}`);
// };

switch (values[2]) {
    case undefined:
    case 'start':
        startJenkins();
        break;

    case 'cert':
        cert();
        break;

    case 'create-network':
        createNetwork();
        break;

    default:
        console.log('npm run jenkins [start|cert|create-network]');
}
