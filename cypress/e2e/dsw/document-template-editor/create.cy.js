import { createDocumentTemplateEditor } from '../../shared/document-template-editor/documentTemplateEditorCreate'

describe('Document Template Editor / create', () => {
  beforeEach(() => {
    cy.loginAs('dataSteward')
  })

  it('creates a document template editor from scratch and lists it', () => {
    createDocumentTemplateEditor()
  })
})
