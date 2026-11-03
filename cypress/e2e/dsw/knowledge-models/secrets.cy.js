import { manageKnowledgeModelSecret } from '../../shared/knowledge-models/knowledgeModelsSecrets'

// Data Steward - secrets need "knowledgeModels.manage".
describe('Knowledge Models / secrets', () => {
  beforeEach(() => {
    cy.loginAs('dataSteward')
  })

  it('creates a secret, sets a new value and deletes it', () => {
    manageKnowledgeModelSecret()
  })
})
