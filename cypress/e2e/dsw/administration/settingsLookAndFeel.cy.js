import { captureSettings, restoreSettings } from '../../shared/administration/administrationSettingsSection'
import { SECTION, changeAppTitle } from '../../shared/administration/administrationSettingsLookAndFeel'

// Admin only - nobody else holds the settings permissions.
describe('Administration / settings / look and feel', () => {
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

  it('changes the application title and shows it in the browser tab title', () => {
    changeAppTitle()
  })
})
