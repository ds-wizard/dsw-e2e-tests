import { showUsageMatchingApi } from '../../shared/administration/administrationSettingsUsage'

// Admin only - nobody else holds the settings permissions.
describe('Administration / settings / usage', () => {
  beforeEach(() => {
    cy.loginAs('admin')
  })

  it("shows the tenant's usage as the API reports it", () => {
    showUsageMatchingApi()
  })
})
