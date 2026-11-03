import { cleanUpProjectFromTemplate, createProjectFromTemplate } from '../../shared/projects/projectFromTemplate'

// Data Steward - marking a project as a template needs projects.manageTemplates.
describe('Projects / create from template', () => {
  beforeEach(() => {
    cy.loginAs('dataSteward')
  })

  afterEach(() => {
    cleanUpProjectFromTemplate()
  })

  it('creates a project from a project template with its answers', () => {
    createProjectFromTemplate()
  })
})
