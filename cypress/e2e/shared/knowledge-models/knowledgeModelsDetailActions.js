// Knowledge Models detail page / actions - the same KnowledgeModelActions menu as
// the listing row's kebab, reused on the detail page (minus "View", already there).
//
// The trigger is a raw id, #km-detail-actions-trigger (Detail.elm's own
// actionsMenuId), not a data-cy. Delete here defaults to one version, not all
// versions (unlike the listing's own Delete) - the confirm field expects
// "<id>:<version>", not just "<id>".
export function manageKnowledgeModelDetailActions() {
  cy.cleanupAllKnowledgeModelPackages()

  const kmId = `km-${Date.now()}`
  const kmName = `Test KM ${Date.now()}`

  cy.visitApp('/knowledge-models/editors/create')
  cy.getField('name').type(kmName)
  cy.getField('id').clear().type(kmId)
  cy.getField('versionMajor').clear().type('1')
  cy.getField('versionMinor').clear().type('0')
  cy.getField('versionPatch').clear().type('0')
  cy.getCy('form-submit').click()

  cy.url()
    .should('match', /\/knowledge-models\/editors\/[0-9a-f-]{36}$/)
    .then((editorUrl) => {
      const editorUuid = editorUrl.split('/').pop()

      cy.visitApp(`/knowledge-models/editors/${editorUuid}/settings`)
      cy.getField('versionMajor').clear().type('1')
      cy.getField('versionMinor').clear().type('0')
      cy.getField('versionPatch').clear().type('0')
      cy.getField('license').type('MIT')
      cy.getField('description').type('Published by the Knowledge Models E2E suite.')
      cy.getCy('markdown-editor_mode-markdown').click()
      cy.getField('readme').type('# Readme')
      cy.getCy('form-submit').click()
      // Clicking Save doesn't block navigation while the PUT is in flight, and the
      // Publish button right after the next line isn't gated on it (unlike the
      // Document Template Editor's own Save/Publish, which are mutually exclusive) -
      // so publishing could otherwise run ahead of these settings and publish stale
      // ones. Common.Components.Form's unsaved-changes bar only hides once the save
      // actually lands.
      cy.getCy('form-unsaved').should('have.attr', 'hidden')

      cy.visitApp(`/knowledge-models/editors/${editorUuid}`)
      cy.getCy('km-editor_publish').click()
      cy.getCy('km-editor_publish-modal_confirm').click()

      cy.url()
        .should('match', /\/knowledge-models\/[0-9a-f-]{36}$/)
        .then((packageUrl) => {
          const packageUuid = packageUrl.split('/').pop()

          cy.visitApp(`/knowledge-models/${packageUuid}`)

          // Export - just confirms the request behind the button succeeds, not the file.
          cy.intercept('GET', `**/knowledge-model-packages/${packageUuid}/bundle*`).as('exportBundle')
          cy.get('#km-detail-actions-trigger').click()
          cy.getCy('listing-item_action_export').click()
          cy.wait('@exportBundle').its('response.statusCode').should('equal', 200)

          // Export .pot file
          cy.intercept('GET', `**/knowledge-model-packages/${packageUuid}/locales/template*`).as('exportPot')
          cy.get('#km-detail-actions-trigger').click()
          cy.getCy('listing-item_action_export-pot').click()
          cy.wait('@exportPot').its('response.statusCode').should('equal', 200)

          // Create KM editor - confirms the prefill, doesn't submit.
          cy.get('#km-detail-actions-trigger').click()
          cy.getCy('listing-item_action_create-km-editor').click()
          cy.url().should('match', new RegExp(`/knowledge-models/editors/create\\?selected=${packageUuid}&edit=true$`))
          cy.getField('name').should('have.value', kmName)
          cy.getField('id').should('have.value', kmId)

          // Fork KM - unlike "Create KM editor", only the language carries over.
          cy.visitApp(`/knowledge-models/${packageUuid}`)
          cy.get('#km-detail-actions-trigger').click()
          cy.getCy('listing-item_action_fork').click()
          cy.url().should('match', new RegExp(`/knowledge-models/editors/create\\?selected=${packageUuid}$`))
          cy.getField('name').should('have.value', '')

          // Delete - confirm text is "<id>:<version>" here, not just "<id>".
          cy.visitApp(`/knowledge-models/${packageUuid}`)
          cy.get('#km-detail-actions-trigger').click()
          cy.getCy('listing-item_action_delete').click()
          cy.getCy('km-delete_submit').should('not.be.disabled')
          cy.get('#library-delete-confirm').type(`${kmId}:1.0.0`)
          cy.getCy('km-delete_submit').click()
          cy.url().should('match', /\/knowledge-models$/)
        })
    })
}
