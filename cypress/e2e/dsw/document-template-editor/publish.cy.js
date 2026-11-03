import { editSettingsAndPublishDocumentTemplate } from '../../shared/document-template-editor/documentTemplateEditorPublish'

describe('Document Template Editor / settings and publish', () => {
  beforeEach(() => {
    cy.loginAs('dataSteward')
  })

  it('edits settings, saves, and publishes a document template', () => {
    editSettingsAndPublishDocumentTemplate()
  })
})
