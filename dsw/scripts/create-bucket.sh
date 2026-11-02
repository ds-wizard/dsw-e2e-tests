#!/bin/sh

GARAGE_CONTAINER="garage"
GARAGE_BUCKET="dsw"
GARAGE_KEY_ID="garageAccessKey"
GARAGE_KEY_SECRET="garageSecretKeyForDswE2ETests"

FULL_NODE_ID=$(docker exec $GARAGE_CONTAINER /garage node id -q)
NODE_ID=${FULL_NODE_ID%%@*}

docker exec $GARAGE_CONTAINER /garage layout assign -z dc1 -c 1G "$NODE_ID"
docker exec $GARAGE_CONTAINER /garage layout apply --version 1

docker exec $GARAGE_CONTAINER /garage bucket create $GARAGE_BUCKET
docker exec $GARAGE_CONTAINER /garage key import $GARAGE_KEY_ID $GARAGE_KEY_SECRET --yes -n dsw-key
docker exec $GARAGE_CONTAINER /garage bucket allow --read --write --owner --key $GARAGE_KEY_ID $GARAGE_BUCKET
