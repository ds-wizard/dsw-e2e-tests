#!/bin/sh

# Init docker-compose file
SERVER_IMAGE="${SERVER_IMAGE:-datastewardshipwizard/wizard-server:develop}"
CLIENT_IMAGE="${CLIENT_IMAGE:-datastewardshipwizard/wizard-client:develop}"
DOCWORKER_IMAGE="${DOCWORKER_IMAGE:-datastewardshipwizard/document-worker:develop}"

DOCKER_COMPOSE_FILE=dsw/docker-compose.yml

cp -r dsw/docker-compose.template.yml $DOCKER_COMPOSE_FILE
sed -i.bak "s#{SERVER_IMAGE}#$SERVER_IMAGE#" $DOCKER_COMPOSE_FILE && rm $DOCKER_COMPOSE_FILE".bak"
sed -i.bak "s#{CLIENT_IMAGE}#$CLIENT_IMAGE#" $DOCKER_COMPOSE_FILE && rm $DOCKER_COMPOSE_FILE".bak"
sed -i.bak "s#{DOCWORKER_IMAGE}#$DOCWORKER_IMAGE#" $DOCKER_COMPOSE_FILE && rm $DOCKER_COMPOSE_FILE".bak"

echo "Initialized docker-compose.yml:"
cat $DOCKER_COMPOSE_FILE
