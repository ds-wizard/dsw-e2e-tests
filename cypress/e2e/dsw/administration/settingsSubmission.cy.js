import { captureSettings, restoreSettings } from '../../shared/administration/administrationSettingsSection'
import { SECTION, addSubmissionService } from '../../shared/administration/administrationSettingsSubmission'

// Admin only - nobody else holds the settings permissions.
describe('Administration / settings / submission', () => {
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

  it("adds a submission service and lists it in the user's submission settings", () => {
    addSubmissionService(originalSettings)
  })
})
