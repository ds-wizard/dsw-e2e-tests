import { compareKnowledgeModelVersions } from '../../shared/knowledge-models/knowledgeModelsCompare'

// Data Steward - building the compared versions needs the KM editor.
describe('Knowledge Models / compare', () => {
  beforeEach(() => {
    cy.loginAs('dataSteward')
  })

  it('compares two versions of a knowledge model', () => {
    compareKnowledgeModelVersions()
  })
})
