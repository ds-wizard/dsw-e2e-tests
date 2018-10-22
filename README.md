# DSW E2E Tests

E2E test suite for testing the functionality of [DSW Client](https://github.com/DataStewardshipWizard/dsw-client)
and [DSW Server](https://github.com/DataStewardshipWizard/dsw-server) based on
[Cucumber.js](https://github.com/cucumber/cucumber-js) and [Puppeteer](https://github.com/GoogleChrome/puppeteer).

## How to run the tests

The project requires recent version of node and npm. Then all the dependencies can be installed with:

```
make install
```

The tests are run against local instance of DSW which is created
using docker-compose. To simply create instance of dsw, run tests and then clean it, run:

```
make all
```

## Configuration

Tests can be further configured through ENV variables. It is not necessary to configure those since the default values works with local instance. However, if you want to run tests against running instance, these need to be set.

- `URL` - root url of DSW app client (without trailing slash)
- `ADMIN_USERNAME`, `ADMIN_PASSWORD` - credentials of admin user
- `DATASTEWARD_USERNAME`, `DATASTEWARD_PASSWORD` - credentials of datasteward user
- `RESEARCHER_USERNAME`, `RESEARCHER_PASSWORD` - credentails of researcher user
- `HEADLESS` *(optional)* - whether to run in headless mode - 1 or 0 (default 1)
- `MONGODB_HOST` - host where the MongoDB for server is
- `MONGODB_PORT` - and port for MongoDB

For running locally or project development, you can also create `.env` file where you define the variables.

```
URL=https://app.dsw.example.com
ADMIN_USERNAME=admin@example.com
ADMIN_PASSWORD=admin-password
DATASTEWARD_USERNAME=datasteward@example.com
DATASTEWARD_PASSWORD=datasteward-password
RESEARCHER_USERNAME=researcher@example.com
RESEARCHER_PASSWORD=researcher-password
```
