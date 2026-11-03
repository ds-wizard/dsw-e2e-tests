// Creates a document template editor from scratch ("basedOn" left empty) and checks it
// lists. Cleans up via DELETE /document-template-drafts/:uuid - note the backend route
// is "document-template-drafts", not "document-template-editors".
export function createDocumentTemplateEditor() {
  const documentTemplateId = `dt-${Date.now()}`
  const documentTemplateName = `Test Document Template ${Date.now()}`

  cy.visitApp('/document-templates/editors/create')

  cy.getField('name').type(documentTemplateName)
  cy.getField('id').clear().type(documentTemplateId)
  cy.getField('versionMajor').clear().type('1')
  cy.getField('versionMinor').clear().type('0')
  cy.getField('versionPatch').clear().type('0')

  cy.getCy('form-submit').click()

  // Redirects to the new editor's route on success; the uuid doubles as its listing row id.
  cy.url()
    .should('match', /\/document-templates\/editors\/[0-9a-f-]{36}$/)
    .then((url) => {
      const documentTemplateEditorUuid = url.split('/').pop()

      cy.visitApp('/document-templates/editors')
      cy.getCy(`listing-item_${documentTemplateEditorUuid}`).should('exist')

      cy.apiToken().then((token) => {
        cy.request({
          method: 'DELETE',
          url: `${Cypress.expose('apiUrl')}/document-template-drafts/${documentTemplateEditorUuid}`,
          headers: { Authorization: `Bearer ${token}` }
        })
      })
    })
}
