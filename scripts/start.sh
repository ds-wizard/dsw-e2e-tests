#!/bin/sh

set -e

cd dsw

docker compose build
docker compose pull --ignore-buildable
docker compose up -d
./scripts/wait.sh
./scripts/create-bucket.sh
./scripts/wait-housekeeping.js
./scripts/patch-db.sh
./scripts/create-users.js
