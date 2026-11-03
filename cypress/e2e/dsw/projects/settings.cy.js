import { editProjectSettings, tagProjectAndFilterByTag } from '../../shared/projects/projectSettings'

// Logs in as Data Steward, not Researcher - marking a project as a template needs
// projects.manageTemplates (see projectSettings.js).
describe('Projects / settings', () => {
  beforeEach(() => {
    cy.loginAs('dataSteward')
  })

  it('edits a project\'s name, description and template flag', () => {
    editProjectSettings()
  })

  it('tags a project and finds it by filtering the listing on that tag', () => {
    tagProjectAndFilterByTag()
  })
})
