// Knowledge Models library / row actions (the listing's kebab menu). Covers the
// actions deprecate.cy.js/visibility.cy.js don't already exercise: View, Export,
// Export .pot, Create KM editor, Fork KM, Delete. Skips Compare/Create project -
// they open unrelated features (KM diffing, project creation) rather than exercising
// anything specific to the knowledge model listing itself.
//
// Re-visits the listing fresh before each action rather than reopening the same
// kebab, since nothing guarantees it's still open after a phase change.
export function manageKnowledgeModelActions() {
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

          // View
          cy.visitApp('/knowledge-models')
          cy.openListingItemActions(packageUuid, 'listing-item_action_view').click()
          cy.url().should('match', new RegExp(`/knowledge-models/${packageUuid}$`))
          cy.getCy('km-detail_nav_readme').should('exist')

          // Export - just confirms the request behind the button succeeds, not the file.
          cy.visitApp('/knowledge-models')
          cy.intercept('GET', `**/knowledge-model-packages/${packageUuid}/bundle*`).as('exportBundle')
          cy.openListingItemActions(packageUuid, 'listing-item_action_export').click()
          cy.wait('@exportBundle').its('response.statusCode').should('equal', 200)

          // Export .pot file
          cy.visitApp('/knowledge-models')
          cy.intercept('GET', `**/knowledge-model-packages/${packageUuid}/locales/template*`).as('exportPot')
          cy.openListingItemActions(packageUuid, 'listing-item_action_export-pot').click()
          cy.wait('@exportPot').its('response.statusCode').should('equal', 200)

          // Create KM editor - confirms the prefill, doesn't submit. Unlike Document
          // Templates, the version fields aren't prefilled, just offered as suggestion
          // chips next to them.
          cy.visitApp('/knowledge-models')
          cy.openListingItemActions(packageUuid, 'listing-item_action_create-km-editor').click()
          cy.url().should('match', new RegExp(`/knowledge-models/editors/create\\?selected=${packageUuid}&edit=true$`))
          cy.getField('name').should('have.value', kmName)
          cy.getField('id').should('have.value', kmId)

          // Fork KM - unlike "Create KM editor", only the language carries over.
          cy.visitApp('/knowledge-models')
          cy.openListingItemActions(packageUuid, 'listing-item_action_fork').click()
          cy.url().should('match', new RegExp(`/knowledge-models/editors/create\\?selected=${packageUuid}$`))
          cy.getField('name').should('have.value', '')

          // Delete - confirm by typing the package's own id; submit is disabled until the
          // dependents check clears.
          cy.visitApp('/knowledge-models')
          cy.openListingItemActions(packageUuid, 'listing-item_action_delete').click()
          cy.getCy('km-delete_submit').should('not.be.disabled')
          cy.get('#library-delete-confirm').type(kmId)
          cy.getCy('km-delete_submit').click()
          // Not asserting the dialog's own closed state - see the matching comment in
          // document-templates/documentTemplatesActions.js (same shared
          // LibraryDeleteModal.view): the row's own disappearance below already proves
          // the delete went through.
          cy.getCy(`listing-item_${packageUuid}`).should('not.exist')
        })
    })
}
