import {
  captureAuthenticationSettings,
  restoreAuthenticationSettings,
  toggleRegistration
} from '../../shared/administration/administrationSettingsAuthentication'

// Admin only - settings.manage, tenant plane.
describe('Administration / settings / authentication', () => {
  let originalSettings

  beforeEach(() => {
    captureAuthenticationSettings().then((settings) => {
      originalSettings = settings
    })
    cy.loginAs('admin')
  })

  afterEach(() => {
    restoreAuthenticationSettings(originalSettings)
  })

  it('toggles registration, and checks the login page follows it', () => {
    toggleRegistration(originalSettings)
  })
})
