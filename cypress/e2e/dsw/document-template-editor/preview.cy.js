import { previewDocumentTemplate } from '../../shared/document-template-editor/documentTemplateEditorPreview'

describe('Document Template Editor / preview', () => {
  beforeEach(() => {
    cy.loginAs('dataSteward')
  })

  it('adds a format with a step, and previews the document template against a real project', () => {
    previewDocumentTemplate()
  })
})
