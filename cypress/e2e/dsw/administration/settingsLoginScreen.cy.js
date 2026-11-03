import {
  captureLoginScreenSettings,
  addLoginAnnouncement,
  restoreLoginScreenSettings,
  setLoginInfo
} from '../../shared/administration/administrationSettingsLoginScreen'

// Admin only - settings.manage, tenant plane.
describe('Administration / settings / login screen', () => {
  let originalSettings

  beforeEach(() => {
    captureLoginScreenSettings().then((settings) => {
      originalSettings = settings
    })
    cy.loginAs('admin')
  })

  afterEach(() => {
    restoreLoginScreenSettings(originalSettings)
  })

  it('sets the login info, and checks it on the login page', () => {
    setLoginInfo()
  })

  it('adds an announcement, and checks it on the login page', () => {
    addLoginAnnouncement(originalSettings)
  })
})
