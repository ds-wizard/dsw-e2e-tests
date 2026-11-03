import { manageKnowledgeModelDetailActions } from '../../shared/knowledge-models/knowledgeModelsDetailActions'

// Data Steward, same persona as km-editor/create.cy.js.
describe('Knowledge Models / detail actions', () => {
  beforeEach(() => {
    cy.loginAs('dataSteward')
  })

  it('exercises the detail page actions menu: export, export pot, create editor, fork and delete', () => {
    manageKnowledgeModelDetailActions()
  })
})
