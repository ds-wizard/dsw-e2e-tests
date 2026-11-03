import { importDocumentTemplate } from '../../shared/document-templates/documentTemplatesImport'

describe('Document Templates / import', () => {
  beforeEach(() => {
    cy.loginAs('dataSteward')
  })

  it('imports a document template from a file and lists it', () => {
    importDocumentTemplate()
  })
})
