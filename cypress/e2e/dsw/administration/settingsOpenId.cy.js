import {
  cleanupOpenIdClients,
  createEditAndDeleteOpenIdClient
} from '../../shared/administration/administrationSettingsOpenId'

// Admin only - settings.manage, tenant plane.
describe('Administration / settings / OpenID', () => {
  beforeEach(() => {
    cy.loginAs('admin')
  })

  afterEach(() => {
    cleanupOpenIdClients()
  })

  it('creates an OpenID config, renames it, sees it on the login page, and deletes it', () => {
    createEditAndDeleteOpenIdClient()
  })
})
