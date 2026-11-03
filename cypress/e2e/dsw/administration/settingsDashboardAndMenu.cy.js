import { captureSettings, restoreSettings } from '../../shared/administration/administrationSettingsSection'
import { SECTION, addCustomMenuLink, addDashboardAnnouncement } from '../../shared/administration/administrationSettingsDashboardAndMenu'

// Admin only - nobody else holds the settings permissions.
describe('Administration / settings / dashboard and menu', () => {
  let originalSettings

  before(() => {
    captureSettings(SECTION).then((settings) => {
      originalSettings = settings
    })
  })

  beforeEach(() => {
    cy.loginAs('admin')
  })

  afterEach(() => {
    restoreSettings(SECTION, originalSettings)
  })

  it('adds a custom menu link and shows it in the navigation', () => {
    addCustomMenuLink(originalSettings)
  })

  it('adds an announcement and shows it on the dashboard', () => {
    addDashboardAnnouncement(originalSettings)
  })
})
