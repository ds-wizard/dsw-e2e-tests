import { captureSettings, restoreSettings } from '../../shared/administration/administrationSettingsSection'
import { SECTION, changeSupportContacts } from '../../shared/administration/administrationSettingsSupport'

// Admin only - nobody else holds the settings permissions.
describe('Administration / settings / support', () => {
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

  it('changes the support contacts and shows them in the Report issue dialog', () => {
    changeSupportContacts()
  })
})
