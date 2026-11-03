import {
  setUpDocumentTemplatesBrowse,
  tearDownDocumentTemplatesBrowse,
  searchDocumentTemplatesLibrary,
  sortDocumentTemplatesLibrary
} from '../../shared/document-templates/documentTemplatesBrowse'

// Data Steward, not Researcher - see documentTemplatesBrowse.js for why. Set up once
// (before()) and shared by both tests below, like shareUserGroup.cy.js's own
// before()/after() - re-logging-in every test (beforeEach) since Cypress's
// test-isolation reset wipes the login session between tests but not this server-side
// data.
describe('Document Templates / browse', () => {
  let templates

  before(() => {
    setUpDocumentTemplatesBrowse().then((result) => {
      templates = result
    })
  })

  beforeEach(() => {
    cy.loginAs('dataSteward')
  })

  after(() => {
    tearDownDocumentTemplatesBrowse()
  })

  it('searches imported document templates', () => {
    searchDocumentTemplatesLibrary(templates)
  })

  it('sorts imported document templates by every option, in both directions', () => {
    sortDocumentTemplatesLibrary(templates)
  })
})
