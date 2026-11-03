#!/bin/sh

set -e

PG_CONTAINER="postgres"
PG_USER="postgres"
PG_DB="dsw"

docker exec $PG_CONTAINER psql -v ON_ERROR_STOP=1 -U $PG_USER -d $PG_DB -f /scripts/patch-db.sql
