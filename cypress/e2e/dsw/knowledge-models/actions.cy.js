import { manageKnowledgeModelActions } from '../../shared/knowledge-models/knowledgeModelsActions'

// Data Steward, same persona as km-editor/create.cy.js.
describe('Knowledge Models / actions', () => {
  beforeEach(() => {
    cy.loginAs('dataSteward')
  })

  it('exercises the listing row actions: view, export, export pot, create editor, fork and delete', () => {
    manageKnowledgeModelActions()
  })
})
