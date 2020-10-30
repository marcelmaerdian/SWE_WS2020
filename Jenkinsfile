#!groovy

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

// https://www.jenkins.io/doc/tutorials/create-a-pipeline-in-blue-ocean/

pipeline {
    // agent any
    agent {
        docker {
            // NICHT: node:...-alpine
            // GNU C++ wird für Python benoetigt wird, aber die Bibliotheken
            // insbesondere fuer GNU C++ sind in Alpine anders strukturiert als
            // in Debian und Ubuntu.
            image 'node:14.13.1-buster'
            // https://stackoverflow.com/questions/62330354/jenkins-pipeline-alpine-agent-apk-update-error-unable-to-lock-database-permis
            // https://stackoverflow.com/questions/42630894/jenkins-docker-how-to-control-docker-user-when-using-image-inside-command/51986870#51986870
            // https://stackoverflow.com/questions/42743201/npm-install-fails-in-jenkins-pipeline-in-docker
            args '--publish 3000:3000 --publish 5000:5000'
            // fuer "apt-get install ..."
            args '--user root:root'
        }
    }

    // environment {
    //     HOME = "${WORKSPACE}"
    // }

    //options {
    //    buildDiscarder(logRotator(numToKeepStr: '10'))
    //}

    stages {
        // Stage = Logisch-zusammengehoerige Aufgaben der Pipeline:
        // zur spaeteren Visualisierung
        stage('Init') {
            // Step = einzelne Aufgabe
            steps {
                script {
                    if (!isUnix()) {
                        error 'Unix ist erforderlich'
                    }
                }

                echo "Jenkins-Job ${env.JOB_NAME} #${env.BUILD_ID} mit Workspace ${env.WORKSPACE}"

                // Unterverzeichnisse src und test im WORKSPACE loeschen: vom letzten Build
                // Kurzform fuer: sh([script: '...'])
                sh 'rm -rf src'
                sh 'rm -rf test'

                // https://www.jenkins.io/doc/pipeline/steps/git
                // "named arguments" statt Funktionsaufruf mit Klammern
                git url: 'file:///git-repository/beispiel', branch: 'master', poll: true
            }
        }

        stage('Install') {
            steps {
                // https://stackoverflow.com/questions/51416409/jenkins-env-node-no-such-file-or-directory
                // https://github.com/nodesource/distributions/blob/master/README.md#installation-instructions
                // https://pkgs.alpinelinux.org/package/edge/main/x86/nodejs
                // Beachte: Alpine nutzt apk statt apt-get wie bei Debian (und Ubuntu)
                sh 'curl -sL https://deb.nodesource.com/setup_current.x | bash -; apt-get install --yes nodejs'
                sh 'apt-get install --yes python3'

                // TODO Docker CE mit apt-get installieren (s.u.)
                // https://medium.com/@manav503/how-to-build-docker-images-inside-a-jenkins-container-d59944102f30

                sh 'node --version'
                sh 'npm --version'

                script {
                    if (!fileExists("${env.WORKSPACE}/package.json")) {
                        echo "package.json ist *NICHT* in ${env.WORKSPACE} vorhanden"
                    }
                }

                // "clean install", ggf. --loglevel verbose
                sh 'npm ci'
            }
        }

        stage('Compile') {
            steps {
                sh 'npm run tsc'
            }
        }

        stage('Test, Codeanalyse, Security, Dok.') {
            steps {
                parallel(
                    // 'Test': {
                           // Cannot find module '/var/jenkins_home/workspace/buch/node_modules/bcrypt/lib/binding/napi-v3/bcrypt_lib.node' from 'node_modules/bcrypt/bcrypt.js'
                    //     sh 'npm run test:coverage'
                    // },
                    'ESLint': {
                        sh 'npm run eslint'
                    },
                    'EJS-Lint': {
                        sh 'npm run ejs-lint'
                    },
                    'Security': {
                        // FIXME https://github.com/ardatan/graphql-tools/issues/2041
                        sh 'npm audit --production'
                    },
                    'AsciiDoctor': {
                        sh 'npm run asciidoc'
                    },
                    'reveal.js': {
                        sh 'npm run revealjs'
                    }
                )
            }

            post {
                always {
                   echo 'TODO: Berichte erstellen'
                }

                success {
                    script {
                        if (fileExists("${env.WORKSPACE}/buch.zip")) {
                            sh 'rm buch.zip'
                        }
                    }
                    // https://www.jenkins.io/doc/pipeline/steps/pipeline-utility-steps/#zip-create-zip-file
                    zip zipFile: 'buch.zip', archive: false, dir: 'dist'
                    // jobs/buch/builds/.../archive/buch.zip
                    archiveArtifacts 'buch.zip'
                }
            }
        }

        stage('Docker Image bauen') {
            steps {
              echo 'TODO: Docker Image bauen'
            }
        }

        stage('Deployment fuer Kubernetes') {
            steps {
                echo 'TODO: Deployment fuer Kubernetes'
            }
        }
    }
}
