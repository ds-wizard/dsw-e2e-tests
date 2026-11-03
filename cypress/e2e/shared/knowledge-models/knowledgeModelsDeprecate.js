// Knowledge Models library / deprecate - deprecate a package then restore it from its
// kebab menu; the two actions are mutually exclusive by the package's phase. Also
// confirms the consequence: the knowledge model suggestions endpoint only returns
// released packages, so a deprecated one can't be picked when creating a project,
// and picking it back up again once restored.
//
// With this tenant's zero project templates, Projects/Create.elm shows a "starting
// point" radio (template vs. knowledge model) only while there's no selectable
// knowledge model either; with exactly one (once restored), it skips straight to the
// knowledge model picker instead - so the two checks below reach the picker
// differently rather than sharing one helper.
//
// Deletes the package at the end (allVersions=true) - see kmEditorPublish.js for why
// publishing leaves only the package, not the editor, to clean up.
export function deprecateAndRestoreKnowledgeModel() {
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

          cy.visitApp('/knowledge-models')
          cy.openListingItemActions(packageUuid)
          cy.getCy('listing-item_action_set-deprecated').click()

          cy.visitApp('/projects/create')
          cy.intercept('GET', '**/knowledge-model-packages/suggestions*').as('suggestions')
          cy.getCy('project-create-starting-point_knowledge-model').click()
          cy.getField('knowledgeModelPackageUuid').click()
          cy.focused().type(kmName)
          cy.wait('@suggestions')
          cy.getCy(`form-knowledgeModelPackageUuid_option_${packageUuid}`).should('not.exist')

          cy.visitApp('/knowledge-models')
          cy.openListingItemActions(packageUuid)
          cy.getCy('listing-item_action_restore').click()

          cy.visitApp('/knowledge-models')
          cy.openListingItemActions(packageUuid)
          cy.getCy('listing-item_action_set-deprecated').should('exist')

          cy.visitApp('/projects/create')
          cy.intercept('GET', '**/knowledge-model-packages/suggestions*').as('suggestionsAfterRestore')
          cy.getField('knowledgeModelPackageUuid').click()
          cy.focused().type(kmName)
          cy.wait('@suggestionsAfterRestore')
          cy.getCy(`form-knowledgeModelPackageUuid_option_${packageUuid}`).should('exist')

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
