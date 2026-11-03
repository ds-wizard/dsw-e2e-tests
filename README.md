# DSW E2E Tests

E2E test suite for testing the functionality of the Data Stewardship Wizard
([Wizard Server](https://github.com/ds-wizard/wizard-server),
[Engine Frontend](https://github.com/ds-wizard/engine-frontend) and
[Document Worker](https://github.com/ds-wizard/engine-tools)) based on
[Cypress](https://github.com/cypress-io/cypress).

## How to run the tests

The project requires a recent version of node and npm. Then all the dependencies can be installed with:

```
make install
```

Add the following host to `/etc/hosts` (downloads are presigned URLs pointing directly to the
object storage container):

```
127.0.0.1	garage
```

The tests are run against a local instance of DSW created using docker compose. To create the
instance, run the tests and then remove it, run:

```
make all
```

Or step by step:

```
make init     # generates dsw/docker-compose.yml and the template fixtures
make start    # starts the stack and provisions the test users
make run      # runs the whole suite
make stop
```

If you are developing the tests or running them locally, you can use the Cypress App to watch and
debug the tests. Open the app with:

```
make open
```

## The stack

| Service           | Image (default)                              | Notes                                           |
|-------------------|----------------------------------------------|-------------------------------------------------|
| `proxy`           | built from `dsw/proxy`                       | http://localhost:8080 - the client at `/`, the API at `/api` |
| `server`          | `ghcr.io/ds-wizard/wizard-server:main`   | config in `dsw/server`, also on port 3000       |
| `client`          | `ghcr.io/ds-wizard/wizard-client:main`   |                                                 |
| `document-worker` | `ghcr.io/ds-wizard/document-worker:main`     | config in `dsw/document-worker`                 |
| `postgres`        |                                              | database `dsw`, port 5432                       |
| `garage`          |                                              | S3 storage, port 3900                           |
| `mockserver`      | built from `dsw/mockserver`                  | fixed `/search` dataset for integrations        |

The images can be changed with the `SERVER_IMAGE`, `CLIENT_IMAGE` and `DOCUMENT_WORKER_IMAGE`
environment variables before `make init`, e.g.:

```
SERVER_IMAGE=datastewardshipwizard/wizard-server:4.35 make init
```

`make start` waits for the server, creates the bucket, patches the database
(`dsw/scripts/patch-db.sql` - local URLs, tours off) and provisions the test users
(`dsw/scripts/create-users.js`).

## Users

| Persona           | Email                          | Password          | Role                         |
|-------------------|--------------------------------|-------------------|------------------------------|
| `admin`           | `albert.einstein@example.com`  | `password`        | Admin                        |
| `dataSteward`     | `nikola.tesla@example.com`     | `password`        | Data Steward                 |
| `researcher`      | `isaac.newton@example.com`     | `password`        | Researcher                   |
| `permissionProbe` | `permission.probe@example.com` | `nE1RloidlOsOqOt` | Permission Probe (no permissions by default) |

The first three are seeded by the server itself, `create-users.js` only sets their roles'
permissions and adds the Permission Probe persona.

## How to write tests

See [cypress/README.md](cypress/README.md) for the layout of the suite and the selector conventions.
