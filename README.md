# DSW E2E Tests

E2E test suite for testing the functionality of [DSW Client](https://github.com/DataStewardshipWizard/dsw-client)
and [DSW Server](https://github.com/DataStewardshipWizard/dsw-server) based on
[Cypress](https://github.com/cypress-io/cypress).

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

If you are developing the tests or running them locally, you can use Cypress
App to watch and debug the tests. Open the app with:

```
make open
```

## Configuration

There are several properties to configure the tests. By default, it runs
against the local local instance. However, this can be changed. You can see
env configuration in `cypress.json`. If you want to overwrite some or all of
the variables, create a new file called `cypress.env.json` (which is ignored
in git) and change the desired values. The file might look like this:

```
{
    "url": "http://localhost:8080",
    "api_url": "http://localhost:3000",
    "admin_username": "albert.einstein@example.com",
    "admin_password": "password",
    "datasteward_username": "nikola.tesla@example.com",
    "datasteward_password": "password",
    "researcher_username": "isaac.newton@example.com",
    "researcher_password": "password"
}
```

## How to write tests

- Ue `data-cy` attribute for targeting elements, `id` is acceptable for form fields.
- Every container that loads content from API should have `data-cy`. This should be tested to exist before testing the content.
- Use `.contains` only for values filled from the test or test fixtures.
