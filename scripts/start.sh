#!/bin/sh

set -e

cd dsw
docker-compose pull
docker-compose up -d

