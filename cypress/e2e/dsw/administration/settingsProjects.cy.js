import { captureSettings, restoreSettings } from '../../shared/administration/administrationSettingsSection'
import { SECTION, changeDefaultProjectVisibility } from '../../shared/administration/administrationSettingsProjects'

// Admin changes the setting (nobody else holds the settings permissions); the shared
// core switches to Researcher to create the project.
describe('Administration / settings / projects', () => {
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

  it('changes the default project visibility and applies it to a new project', () => {
    changeDefaultProjectVisibility(originalSettings)
  })
})
