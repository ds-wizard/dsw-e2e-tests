import { deprecateAndRestoreKnowledgeModel } from '../../shared/knowledge-models/knowledgeModelsDeprecate'

// Data Steward, same persona as km-editor/create.cy.js.
describe('Knowledge Models / deprecate', () => {
  beforeEach(() => {
    cy.loginAs('dataSteward')
  })

  it('deprecates and restores a knowledge model package', () => {
    deprecateAndRestoreKnowledgeModel()
  })
})
