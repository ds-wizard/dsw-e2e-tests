import { createProject } from '../../shared/projects/projectCreate'

// Logs in as Researcher - least-capable role that can create a project
// (projects.create).
describe('Projects / create', () => {
  beforeEach(() => {
    cy.loginAs('researcher')
  })

  it('creates a project from the imported knowledge model and lists it', () => {
    createProject()
  })
})
