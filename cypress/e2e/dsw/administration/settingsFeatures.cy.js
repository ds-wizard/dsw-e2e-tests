import { captureSettings, restoreSettings } from '../../shared/administration/administrationSettingsSection'
import { SECTION, toggleTours } from '../../shared/administration/administrationSettingsFeatures'

// Admin only - nobody else holds the settings permissions.
describe('Administration / settings / features', () => {
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

  it("toggles tours and shows/hides the user's Tours settings with it", () => {
    toggleTours(originalSettings)
  })
})
