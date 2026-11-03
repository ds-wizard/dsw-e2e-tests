import { previewKnowledgeModel } from '../../shared/knowledge-models/knowledgeModelsPreview'

// Data Steward, same persona as km-editor/create.cy.js.
describe('Knowledge Models / preview', () => {
  beforeEach(() => {
    cy.loginAs('dataSteward')
  })

  it('publishes a knowledge model and previews it', () => {
    previewKnowledgeModel()
  })
})
