# DSW E2E Tests

E2E test suite for testing the functionality of [DSW Client](https://github.com/DataStewardshipWizard/dsw-client)
and [DSW Server](https://github.com/DataStewardshipWizard/dsw-server) based on
[Cucumber.js](https://github.com/cucumber/cucumber-js) and [Puppeteer](https://github.com/GoogleChrome/puppeteer).

## How to run the tests

The project requires recent version of node and npm. Then all the dependencies can be installed with:

```
npm install
```

Tests also require configuration through ENV variables.

- `URL` - root url of DSW app client (without trailing slash)
- `ADMIN_USERNAME`, `ADMIN_PASSWORD` - credentials of admin user
- `DATASTEWARD_USERNAME`, `DATASTEWARD_PASSWORD` - credentials of datasteward user
- `RESEARCHER_USERNAME`, `RESEARCHER_PASSWORD` - credentails of researcher user
- `HEADLESS` *(optional)* - whether to run in headless mode - 1 or 0 (default 1)

For running locally or project development, you can create `.env` file where you define the variables.

```
URL=https://app.dsw.example.com
ADMIN_USERNAME=admin@example.com
ADMIN_PASSWORD=admin-password
DATASTEWARD_USERNAME=datasteward@example.com
DATASTEWARD_PASSWORD=datasteward-password
RESEARCHER_USERNAME=researcher@example.com
RESEARCHER_PASSWORD=researcher-password
```

You can run tests after installing dependencies and configuring the environment by:

```
npm test
```
