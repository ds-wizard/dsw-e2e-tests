import { importKnowledgeModel } from '../../shared/knowledge-models/knowledgeModelsImport'

// Data Steward, same persona as km-editor/create.cy.js.
describe('Knowledge Models / import', () => {
  beforeEach(() => {
    cy.loginAs('dataSteward')
  })

  it('imports a knowledge model from a file and lists it', () => {
    importKnowledgeModel()
  })
})
