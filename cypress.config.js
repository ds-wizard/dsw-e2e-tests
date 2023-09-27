const { defineConfig } = require('cypress')

module.exports = defineConfig({
  env: {
    url: 'http://localhost:8080/wizard',
    api_url: 'http://localhost:3000/wizard-api',
    admin_username: 'albert.einstein@example.com',
    admin_password: 'password',
    datasteward_username: 'nikola.tesla@example.com',
    datasteward_password: 'password',
    researcher_username: 'isaac.newton@example.com',
    researcher_password: 'password',
    mongoUrl: 'mongodb://localhost:27017',
    mongoDBName: 'dsw-server-test',
    pgUser: 'postgres',
    pgHost: 'localhost',
    pgDatabase: 'dsw',
    pgPassword: 'postgres',
    pgPort: 5432,
  },
  screenshotsFolder: 'output/screenshots',
  videosFolder: 'output/videos',
  numTestsKeptInMemory: 1,
  viewportWidth: 1280,
  viewportHeight: 800,
  projectId: 'dx9eqg',
  retries: {
    openMode: 0,
    runMode: 3,
  },
  e2e: {
    // We've imported your old cypress plugins here.
    // You may want to clean this up later by importing these.
    setupNodeEvents(on, config) {
      return require('./cypress/plugins/index.js')(on, config)
    },
    specPattern: 'cypress/e2e/**/*.{js,jsx,ts,tsx}',
  },
})
