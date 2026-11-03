// Document Template Editor / settings and publish. Settings fields are raw,
// self-prefixed ids ("dt-settings-<name>"), not cy.getField(...) - there's no
// separate form model here. Publishing keeps the editor's own uuid, landing on
// /document-templates/<uuid>.
//
// The Readme field is a rich-text/markdown editor whose source textarea starts
// hidden; switching it to "markdown" mode ("markdown-editor_mode-markdown") reveals
// it. Checked after publish via the published template's own Readme tab (.ui-prose),
// which has no data-cy of its own.
export function editSettingsAndPublishDocumentTemplate() {
  const documentTemplateId = `dt-${Date.now()}`
  const documentTemplateName = `Test Document Template ${Date.now()}`
  const readmeContent = '# Document Template Readme\n\nPublished by the E2E suite.'

  cy.visitApp('/document-templates/editors/create')
  cy.getField('name').type(documentTemplateName)
  cy.getField('id').clear().type(documentTemplateId)
  cy.getField('versionMajor').clear().type('1')
  cy.getField('versionMinor').clear().type('0')
  cy.getField('versionPatch').clear().type('0')
  cy.getCy('form-submit').click()

  cy.url()
    .should('match', /\/document-templates\/editors\/[0-9a-f-]{36}$/)
    .then((editorUrl) => {
      const editorUuid = editorUrl.split('/').pop()

      cy.visitApp(`/document-templates/editors/${editorUuid}/settings`)
      cy.get('#dt-settings-license').clear().type('MIT')

      cy.getCy('markdown-editor_mode-markdown').click()
      cy.get('#dt-settings-readme').clear().type(readmeContent)

      cy.getCy('dt-editor_save').click()

      cy.getCy('dt-editor_publish').click()
      cy.getCy('dt-editor_publish-modal_confirm').click()

      cy.url().should('match', new RegExp(`/document-templates/${editorUuid}$`))
      cy.get('.ui-prose').should('contain.text', 'Published by the E2E suite.')

      cy.apiToken().then((token) => {
        cy.request({
          method: 'DELETE',
          url: `${Cypress.expose('apiUrl')}/document-templates/${editorUuid}?allVersions=true`,
          headers: { Authorization: `Bearer ${token}` }
        })
      })
    })
}
