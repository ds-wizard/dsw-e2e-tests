#!/bin/sh

set -e

# Docker Images
SERVER_IMAGE="${SERVER_IMAGE:-ghcr.io/ds-wizard/wizard-server:develop}"
CLIENT_IMAGE="${CLIENT_IMAGE:-ghcr.io/ds-wizard/wizard-client:develop}"
DOCWORKER_IMAGE="${DOCWORKER_IMAGE:-ghcr.io/ds-wizard/document-worker:develop}"

cd dsw

docker pull --platform linux/amd64 $SERVER_IMAGE
docker pull --platform linux/amd64 $DOCWORKER_IMAGE
docker pull --platform linux/amd64 $CLIENT_IMAGE

docker compose up -d
./scripts/wait.sh
./scripts/patch-db.sh
./scripts/create-bucket.sh
./scripts/wait-housekeeping.js
