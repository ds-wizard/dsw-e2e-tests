import { viewDocumentsList } from '../../shared/documents/documentsList'

// Requires projects.edit ("Edit ALL Projects") - only Data Steward has it among our
// personas. The permission-denied case belongs to Account / nav gated by permission
// instead (account/navByPerm.cy.js), which already exercises every permission this
// way rather than one-off per feature spec.
describe('Documents / list', () => {
  it('generates documents in two different projects and lists them both', () => {
    cy.loginAs('dataSteward')
    viewDocumentsList()
  })
})
