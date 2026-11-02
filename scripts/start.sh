#!/bin/sh

set -e

# Docker Images
SERVER_IMAGE="${SERVER_IMAGE:-ghcr.io/ds-wizard/wizard-server:main}"
CLIENT_IMAGE="${CLIENT_IMAGE:-ghcr.io/ds-wizard/wizard-client:develop}"
DOCWORKER_IMAGE="${DOCWORKER_IMAGE:-ghcr.io/ds-wizard/document-worker:main}"

cd dsw

docker pull $SERVER_IMAGE
docker pull $DOCWORKER_IMAGE
docker pull $CLIENT_IMAGE

docker compose up -d
./scripts/wait.sh
./scripts/patch-db.sh
./scripts/create-bucket.sh
./scripts/wait-housekeeping.js
