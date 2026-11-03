// Document Templates library / row actions (the listing's kebab menu). Data Steward,
// same reasoning as documentTemplatesBrowse.js. Uses its own metadata-only fixture,
// separate from documentTemplatesBrowse.js's three, since this one gets deprecated,
// restored and deleted by the actions under test.
//
// Covers View detail, Export, Create editor, Set deprecated/Restore and Delete.
// Skips "Export .pot file": it only becomes available once an async, infra-dependent
// pot-generation job finishes, which a fresh import can't reliably wait for.
//
// Re-visits the listing fresh before each action rather than reopening the same
// kebab, since nothing guarantees it's still open after a phase change.
//
// Delete is this test's own cleanup on the happy path; an afterEach still removes
// the fixture by id if an earlier assertion aborts before reaching it.
export const actionTemplateId = 'test.action-template'

export function manageDocumentTemplateActions() {
  cy.cleanupDocumentTemplate(actionTemplateId)

  return cy.importTemplate('templates/action-template.zip').then((documentTemplate) => {
    const documentTemplateUuid = documentTemplate.uuid

    cy.visitApp('/document-templates')

    // View detail
    cy.openListingItemActions(documentTemplateUuid)
    cy.getCy('listing-item_action_view').click()
    cy.url().should('match', new RegExp(`/document-templates/${documentTemplateUuid}$`))
    cy.getCy('document-template-detail_nav_readme').should('exist')

    // Export - just confirms the request behind the button succeeds, not the file.
    cy.visitApp('/document-templates')
    cy.intercept('GET', `**/document-templates/${documentTemplateUuid}/bundle*`).as('exportBundle')
    cy.openListingItemActions(documentTemplateUuid)
    cy.getCy('listing-item_action_export').click()
    cy.wait('@exportBundle').its('response.statusCode').should('equal', 200)

    // Create editor - confirms the prefill, doesn't submit (that's create.cy.js's job).
    cy.visitApp('/document-templates')
    cy.openListingItemActions(documentTemplateUuid)
    cy.getCy('listing-item_action_create-editor').click()
    cy.url().should('match', new RegExp(`/document-templates/editors/create\\?selected=${documentTemplateUuid}&edit=true$`))
    cy.getField('name').should('have.value', 'Action Template')
    cy.getField('id').should('have.value', actionTemplateId)
    cy.getField('versionMajor').should('have.value', '1')
    cy.getField('versionMinor').should('have.value', '1')
    cy.getField('versionPatch').should('have.value', '0')

    // Set deprecated - the listing refetches in place, no revisit needed.
    cy.visitApp('/document-templates')
    cy.openListingItemActions(documentTemplateUuid)
    cy.getCy('listing-item_action_set-deprecated').click()
    cy.getCy(`listing-item_${documentTemplateUuid}`).should('contain.text', 'deprecated')

    // Restore
    cy.visitApp('/document-templates')
    cy.openListingItemActions(documentTemplateUuid)
    cy.getCy('listing-item_action_restore').click()
    cy.getCy(`listing-item_${documentTemplateUuid}`).should('not.contain.text', 'deprecated')

    // Delete - confirm by typing the template's own id; submit is disabled until the
    // dependents check clears.
    cy.visitApp('/document-templates')
    cy.openListingItemActions(documentTemplateUuid)
    cy.getCy('listing-item_action_delete').click()
    cy.getCy('template-delete_submit').should('not.be.disabled')
    cy.get('#library-delete-confirm').type(actionTemplateId)
    cy.getCy('template-delete_submit').click()
    // Not asserting the dialog's own closed state - it doesn't reliably stay in the DOM
    // after this reload. The row's own disappearance below already proves the delete
    // went through.
    cy.getCy(`listing-item_${documentTemplateUuid}`).should('not.exist')
  })
}
