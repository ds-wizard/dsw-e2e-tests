import { toggleKnowledgeModelVisibility } from '../../shared/knowledge-models/knowledgeModelsVisibility'

// Data Steward, same persona as km-editor/create.cy.js.
describe('Knowledge Models / visibility', () => {
  beforeEach(() => {
    cy.loginAs('dataSteward')
  })

  it('sets a knowledge model package public', () => {
    toggleKnowledgeModelVisibility()
  })
})
