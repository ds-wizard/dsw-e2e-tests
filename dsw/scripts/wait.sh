#!/bin/sh

echo "Waiting for api..."
while ! curl -sf http://localhost:3000/api/ >/dev/null 2>&1;
do
    echo "  still waiting for api..."
    sleep 2;
done
echo "api ready"
