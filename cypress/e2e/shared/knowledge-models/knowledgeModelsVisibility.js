// Knowledge Models library / visibility - toggle a package public/private from its
// kebab menu; only one of "Set public"/"Set private" is ever shown at a time. Also
// confirms what that actually controls: an anonymous (logged-out) visitor can open the
// detail page while it's public, and not while it's private - Detail.elm is reachable
// without logging in, but still fetches the package through the same API as anyone
// else, so a private one 404s/errors for them same as it would for any other reader
// without access.
//
// Deletes the package at the end (allVersions=true) - see kmEditorPublish.js for why
// publishing leaves only the package, not the editor, to clean up.
export function toggleKnowledgeModelVisibility() {
  cy.cleanupAllKnowledgeModelPackages()

  const kmId = `km-${Date.now()}`
  const kmName = `Test KM ${Date.now()}`
  const readmeContent = `Readme content ${Date.now()}`

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

      // Publishing happens from within the editor itself, not the standalone
      // "/publish" form page (that one is only reached after a KM Migration completes
      // or from the editors list) - see kmEditorPublish.js for the full flow.
      cy.visitApp(`/knowledge-models/editors/${editorUuid}/settings`)
      cy.getField('versionMajor').clear().type('1')
      cy.getField('versionMinor').clear().type('0')
      cy.getField('versionPatch').clear().type('0')
      cy.getField('license').type('MIT')
      cy.getField('description').type('Published by the Knowledge Models E2E suite.')
      cy.getCy('markdown-editor_mode-markdown').click()
      cy.getField('readme').type(`# Readme\n\n${readmeContent}`)
      cy.getCy('form-submit').click()
      // Clicking Save doesn't block navigation while the PUT is in flight, and the
      // Publish button right after the next line isn't gated on it (unlike the
      // Document Template Editor's own Save/Publish, which are mutually exclusive) -
      // so publishing could otherwise run ahead of these settings and publish a
      // package whose readme never actually contains readmeContent, breaking this
      // test's own later assertion on it. Common.Components.Form's unsaved-changes
      // bar only hides once the save actually lands.
      cy.getCy('form-unsaved').should('have.attr', 'hidden')

      cy.visitApp(`/knowledge-models/editors/${editorUuid}`)
      cy.getCy('km-editor_publish').click()
      cy.getCy('km-editor_publish-modal_confirm').click()

      cy.url()
        .should('match', /\/knowledge-models\/[0-9a-f-]{36}$/)
        .then((packageUrl) => {
          const packageUuid = packageUrl.split('/').pop()

          // A freshly published package is private - anonymous can't open it yet.
          cy.logout()
          cy.visitApp(`/knowledge-models/${packageUuid}`)
          cy.get('.ui-detail__title').should('not.exist')
          cy.contains(readmeContent).should('not.exist')
          cy.loginAs('dataSteward')

          cy.visitApp('/knowledge-models')
          cy.openListingItemActions(packageUuid)
          cy.getCy('listing-item_action_set-public').click()

          cy.logout()
          cy.visitApp(`/knowledge-models/${packageUuid}`)
          cy.get('.ui-detail__title').should('contain.text', kmName)
          cy.contains(readmeContent).should('exist')
          cy.loginAs('dataSteward')

          cy.visitApp('/knowledge-models')
          cy.openListingItemActions(packageUuid)
          cy.getCy('listing-item_action_set-private').should('exist')

          cy.apiToken().then((token) => {
            cy.request({
              method: 'DELETE',
              url: `${Cypress.expose('apiUrl')}/knowledge-model-packages/${packageUuid}?allVersions=true`,
              headers: { Authorization: `Bearer ${token}` }
            })
          })
        })
    })
}
