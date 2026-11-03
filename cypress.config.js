const { defineConfig } = require('cypress')

module.exports = defineConfig({
  // Cypress.env() would hand every "env" value (passwords included) to the browser,
  // including the app's own window. Secrets stay in "env" and are read with
  // cy.env([...]) from support/spec code, plain configuration goes to "expose" and is
  // read with Cypress.expose().
  allowCypressEnv: false,
  env: {
    // Keep in sync with dsw/scripts/create-users.js. admin is for provisioning, specs
    // log in as the least capable persona that can do what they test.
    users: {
      admin: {
        email: 'albert.einstein@example.com',
        password: 'password'
      },
      dataSteward: {
        email: 'nikola.tesla@example.com',
        password: 'password'
      },
      researcher: {
        email: 'isaac.newton@example.com',
        password: 'password'
      },
      permissionProbe: {
        email: 'permission.probe@example.com',
        password: 'nE1RloidlOsOqOt'
      }
    },

    // Node-side only (cypress/plugin/database.js).
    db: {
      host: 'localhost',
      port: 5432,
      user: 'postgres',
      password: 'postgres',
      database: 'dsw'
    }
  },
  expose: {
    // The literal tenant_id of the default tenant the server seeds.
    tenantId: 'default',
    clientUrl: 'http://localhost:8080',
    // Same origin as the client (dsw/proxy), the way a real deployment serves it.
    apiUrl: 'http://localhost:8080/api',
  },
  numTestsKeptInMemory: 1,
  experimentalMemoryManagement: true,
  viewportWidth: 1440,
  viewportHeight: 900,
  screenshotsFolder: 'output/screenshots',
  videosFolder: 'output/videos',
  e2e: {
    setupNodeEvents(on, config) {
      require('./cypress/plugin/database')(on, config)
      // Splits the spec list across the SPLIT/SPLIT_INDEX env vars (the CI shard
      // matrix), a no-op when SPLIT isn't set.
      require('cypress-split')(on, config)
      return config
    },
    defaultCommandTimeout: 10000,
    experimentalRunAllSpecs: true,
    // .cy. so the shared test-core modules in cypress/e2e/shared/ aren't run as specs.
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
  },
})
