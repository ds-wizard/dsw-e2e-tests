// Document Templates / import (route /document-templates/import). The registry isn't
// configured in this stack, so the page opens directly on the file upload.
//
// Uploads templates/questionnaire-report.zip - the "Questionnaire Report" template.
// See "Templates packaging" in cypress/README.md for how the committed .json becomes
// the uploaded .zip.
//
// "dsw.questionnaire-report" is a fixed id, cleaned up by id before each run.
//
// The created uuid comes from cy.intercept rather than the UI, since the "Done" link
// goes to the Index page, not the new template's own detail page.
export function importDocumentTemplate() {
  const documentTemplateId = 'dsw.questionnaire-report'

  cy.cleanupDocumentTemplate(documentTemplateId)

  cy.intercept('POST', '**/document-templates/bundle*').as('importBundle')

  cy.visitApp('/document-templates/import')

  cy.fixture('templates/questionnaire-report.zip', 'binary').then((binary) => {
    cy.getCy('file-upload_dropzone').selectFile(
      { contents: Cypress.Buffer.from(binary, 'binary'), fileName: 'questionnaire-report.zip', mimeType: 'application/zip' },
      { action: 'drag-drop' }
    )
  })
  cy.getCy('file-import_submit').click()

  cy.wait('@importBundle').its('response.body.uuid').then((documentTemplateUuid) => {
    cy.getCy('file-import_done').click()

    cy.visitApp('/document-templates')
    cy.getCy(`listing-item_${documentTemplateUuid}`).should('exist').and('contain.text', 'Questionnaire Report')

    cy.apiToken().then((token) => {
      cy.request({
        method: 'DELETE',
        url: `${Cypress.expose('apiUrl')}/document-templates/${documentTemplateUuid}?allVersions=true`,
        headers: { Authorization: `Bearer ${token}` }
      })
    })
  })
}
