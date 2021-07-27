#!/bin/sh

TEMPLATE_DIR=cypress/fixtures/templates

for f in $TEMPLATE_DIR/*.json; do
    b=`basename $f`
    ./scripts/build-template.sh ${b%.*}
done
