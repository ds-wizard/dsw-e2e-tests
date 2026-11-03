import { cloneProject } from '../../shared/projects/projectClone'

// Logs in as Researcher - cloning has no permission gate beyond owning the project.
describe('Projects / clone', () => {
  beforeEach(() => {
    cy.loginAs('researcher')
  })

  it('clones a project into a new one', () => {
    cloneProject()
  })
})
