import { openResourcePage } from '../../shared/knowledge-models/knowledgeModelsResourcePage'

// Data Steward - building the knowledge model needs the KM editor.
describe('Knowledge Models / resource page', () => {
  beforeEach(() => {
    cy.loginAs('dataSteward')
  })

  it('opens a published knowledge model\'s resource page', () => {
    openResourcePage()
  })
})
