#!/bin/sh

PG_CONTAINER="postgres"
PG_USER="postgres"
PG_PASS="postgres"
PG_DB="dsw"


docker exec $PG_CONTAINER psql -U $PG_USER -d $PG_DB -f /scripts/patch-db-wizard.sql
