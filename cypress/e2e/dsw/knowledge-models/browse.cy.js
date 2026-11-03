import {
  setUpKnowledgeModelsBrowse,
  tearDownKnowledgeModelsBrowse,
  searchKnowledgeModelsLibrary,
  sortKnowledgeModelsLibrary
} from '../../shared/knowledge-models/knowledgeModelsBrowse'

// Data Steward, same persona as preview.cy.js. Set up once (before()) and
// shared by both tests below, like shareUserGroup.cy.js's own before()/after() -
// re-logging-in every test (beforeEach) since Cypress's test-isolation reset wipes the
// login session between tests but not this server-side data.
describe('Knowledge Models / browse', () => {
  let kms

  before(() => {
    setUpKnowledgeModelsBrowse().then((result) => {
      kms = result
    })
  })

  beforeEach(() => {
    cy.loginAs('dataSteward')
  })

  after(() => {
    tearDownKnowledgeModelsBrowse()
  })

  it('searches imported knowledge models', () => {
    searchKnowledgeModelsLibrary(kms)
  })

  it('sorts imported knowledge models by every option, in both directions', () => {
    sortKnowledgeModelsLibrary(kms)
  })
})
