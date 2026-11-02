#!/bin/sh

while ! curl http://localhost:3000/ 2>/dev/null; \
do \
    echo "Retrying ..."; \
    sleep 2; \
done
