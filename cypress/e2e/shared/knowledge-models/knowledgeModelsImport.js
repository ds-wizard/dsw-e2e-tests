// Knowledge Models / import (route /knowledge-models/import). The registry isn't
// configured in this stack, so the page opens directly on the file upload.
//
// Unlike a document template, a KM bundle is just the package's own raw JSON (no zip,
// no assets) - fixtures/shared/import-km.json is fixtures/shared/basic-km.json's own
// shape with a different id/name so it doesn't collide.
//
// Wipes every other package in the workspace first too, so a leftover one from an
// earlier failed run can't push this one off the listing's first page. The created
// uuid comes from cy.intercept rather than the UI, since the "Done" link goes to the
// Index page, not the new package's own detail page.
export function importKnowledgeModel() {
  cy.cleanupAllKnowledgeModelPackages()

  cy.intercept('POST', '**/knowledge-model-packages/bundle*').as('importBundle')

  cy.visitApp('/knowledge-models/import')

  cy.fixture('shared/import-km.json').then((km) => {
    cy.getCy('file-upload_dropzone').selectFile(
      { contents: Cypress.Buffer.from(JSON.stringify(km)), fileName: 'import-km.json', mimeType: 'application/json' },
      { action: 'drag-drop' }
    )
  })
  cy.getCy('file-import_submit').click()

  cy.wait('@importBundle').its('response.body.uuid').then((packageUuid) => {
    cy.getCy('file-import_done').click()

    cy.visitApp('/knowledge-models')
    cy.getCy(`listing-item_${packageUuid}`).should('exist').and('contain.text', 'Import Test KM')

    cy.apiToken().then((token) => {
      cy.request({
        method: 'DELETE',
        url: `${Cypress.expose('apiUrl')}/knowledge-model-packages/${packageUuid}?allVersions=true`,
        headers: { Authorization: `Bearer ${token}` }
      })
    })
  })
}
