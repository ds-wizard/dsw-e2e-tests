#!/bin/sh

TEMPLATE_DIR=cypress/fixtures/templates

cd $TEMPLATE_DIR

rm -rf template
rm -rf $1.zip

mkdir template
cp $1.json template/template.json
zip -r $1.zip ./template

rm -rf template
