#!/bin/sh

set -e

# Docker Images
SERVER_IMAGE="${SERVER_IMAGE:-dswbot/wizard-server:next-develop}"
CLIENT_IMAGE="${CLIENT_IMAGE:-dswbot/wizard-client:develop-next}"
DOCWORKER_IMAGE="${DOCWORKER_IMAGE:-dswbot/document-worker:develop}"

cd dsw

docker pull --platform linux/amd64 $SERVER_IMAGE
docker pull --platform linux/amd64 $DOCWORKER_IMAGE
docker pull --platform linux/amd64 $CLIENT_IMAGE

docker-compose up -d
./create-bucket.sh
