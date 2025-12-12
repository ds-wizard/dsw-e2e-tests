#!/bin/sh

set -e

# Docker Images
SERVER_IMAGE="${SERVER_IMAGE:-dswbot/wizard-server:develop}"
CLIENT_IMAGE="${CLIENT_IMAGE:-dswbot/wizard-client:feature-rename-questionnaire}"
DOCWORKER_IMAGE="${DOCWORKER_IMAGE:-dswbot/document-worker:refactor-rename-project}"

cd dsw

docker pull --platform linux/amd64 $SERVER_IMAGE
docker pull --platform linux/amd64 $DOCWORKER_IMAGE
docker pull --platform linux/amd64 $CLIENT_IMAGE

docker compose up -d
./scripts/wait.sh
./scripts/patch-db.sh
./scripts/create-bucket.sh
./scripts/wait-housekeeping.js
