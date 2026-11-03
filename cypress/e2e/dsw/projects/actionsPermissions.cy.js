import { checkProjectsListActionsGatedByCreate } from '../../shared/projects/projectActionsPermissions'

// No beforeEach/cy.loginAs here - the core logs in as Data Steward (the project's
// owner) and as Permission Probe in turn.
describe('Projects / list actions gated by permission', () => {
  it('shows the Create button and a project\'s Clone action only with projects.create', () => {
    checkProjectsListActionsGatedByCreate()
  })
})
