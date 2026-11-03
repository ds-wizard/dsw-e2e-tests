// Document Templates detail page / actions - the same DocumentTemplateActions menu as
// the listing row's kebab, reused on the detail page (minus "View detail", already
// there). Data Steward, same reasoning as documentTemplatesBrowse.js. Uses its own
// fixture, separate from documentTemplatesActions.js's listing-row one.
//
// The trigger is a raw id, #document-template-actions-trigger (Detail.elm's own
// actionsMenuId), not a data-cy. Delete here defaults to one version, not all
// versions (unlike the listing's own Delete) - the confirm field expects
// "<id>:<version>", not just "<id>".
export const detailActionTemplateId = 'test.detail-action-template'

export function manageDocumentTemplateDetailActions() {
  cy.cleanupDocumentTemplate(detailActionTemplateId)

  return cy.importTemplate('templates/detail-action-template.zip').then((documentTemplate) => {
    const documentTemplateUuid = documentTemplate.uuid

    cy.visitApp(`/document-templates/${documentTemplateUuid}`)

    // Export - just confirms the request behind the button succeeds, not the file.
    cy.intercept('GET', `**/document-templates/${documentTemplateUuid}/bundle*`).as('exportBundle')
    cy.get('#document-template-actions-trigger').click()
    cy.getCy('listing-item_action_export').click()
    cy.wait('@exportBundle').its('response.statusCode').should('equal', 200)

    // Create editor - confirms the prefill, doesn't submit.
    cy.get('#document-template-actions-trigger').click()
    cy.getCy('listing-item_action_create-editor').click()
    cy.url().should('match', new RegExp(`/document-templates/editors/create\\?selected=${documentTemplateUuid}&edit=true$`))
    cy.getField('name').should('have.value', 'Detail Action Template')
    cy.getField('id').should('have.value', detailActionTemplateId)
    cy.getField('versionMajor').should('have.value', '1')
    cy.getField('versionMinor').should('have.value', '1')
    cy.getField('versionPatch').should('have.value', '0')

    // Set deprecated
    cy.visitApp(`/document-templates/${documentTemplateUuid}`)
    cy.get('#document-template-actions-trigger').click()
    cy.getCy('listing-item_action_set-deprecated').click()
    cy.get('.ui-detail__title').should('contain.text', 'deprecated')

    // Restore
    cy.get('#document-template-actions-trigger').click()
    cy.getCy('listing-item_action_restore').click()
    cy.get('.ui-detail__title').should('not.contain.text', 'deprecated')

    // Delete - confirm text is "<id>:<version>" here, not just "<id>".
    cy.get('#document-template-actions-trigger').click()
    cy.getCy('listing-item_action_delete').click()
    cy.getCy('template-delete_submit').should('not.be.disabled')
    cy.get('#library-delete-confirm').type(`${detailActionTemplateId}:1.0.0`)
    cy.getCy('template-delete_submit').click()
    cy.url().should('match', /\/document-templates$/)
  })
}
