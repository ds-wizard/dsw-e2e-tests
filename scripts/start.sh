#!/bin/sh

set -e

alias rabbitmqctl="docker exec dsw_rabbitmq_1 rabbitmqctl"


cd dsw
docker-compose pull
docker-compose up -d

until rabbitmqctl await_startup &> /dev/null; do
    sleep 1
done

rabbitmqctl add_vhost "/dsw-test" || true
rabbitmqctl add_user "wizard" "password" || true
rabbitmqctl set_permissions "wizard" -p "/dsw-test" ".*" ".*" ".*"
rabbitmqctl set_user_tags "wizard" service
