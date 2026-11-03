// Knowledge Models library / preview - publish a package, open its listing row's
// "Preview" action, and confirm it actually renders the KM's own content, not just
// its name. Separate from knowledgeModelsBrowse.js, which covers the listing's own
// search/sort behavior with three rows - this one only ever has the single package it
// publishes, and visiting the listing here is just the path to reach Preview, not the
// thing under test.
//
// Preview reuses the same Questionnaire component real projects use, readonly - its
// chapter nav entries and question titles all share one flat data-cy each (no
// per-uuid suffix, confirmed by reading Common.Components.Questionnaire), so they're
// matched by scoping cy.contains to that data-cy rather than targeting a specific row.
//
// Deletes the package at the end (allVersions=true) - see kmEditorPublish.js for why
// publishing leaves only the package, not the editor, to clean up.
export function previewKnowledgeModel() {
  cy.cleanupAllKnowledgeModelPackages()

  const kmId = `km-${Date.now()}`
  const kmName = `Test KM ${Date.now()}`
  const chapterTitle = `Test Chapter ${Date.now()}`
  const questionTitle = `Test Question ${Date.now()}`
  let chapterUuid

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

      // The root-level "chapters-add" trigger is keyed by the knowledge model's own
      // entity uuid, a real uuid generated per editor, not the editor's own uuid -
      // fetched here rather than assumed.
      cy.apiToken().then((token) => {
        cy.request({
          method: 'GET',
          url: `${Cypress.expose('apiUrl')}/knowledge-model-editors/${editorUuid}`,
          headers: { Authorization: `Bearer ${token}` }
        }).then(({ body }) => {
          cy.get(`#km-editor-${body.knowledgeModel.uuid}-chapters-add`).click()
        })
      })
      cy.url()
        .should('match', /\/edit\/[0-9a-f-]{36}$/)
        .then((chapterUrl) => {
          chapterUuid = chapterUrl.split('/').pop()
          cy.get(`#km-editor-${chapterUuid}-title`).type(chapterTitle)

          cy.get(`#km-editor-${chapterUuid}-questions-add`).click()
          cy.url()
            .should('match', /\/edit\/[0-9a-f-]{36}$/)
            .then((questionUrl) => {
              const questionUuid = questionUrl.split('/').pop()
              cy.get(`#km-editor-${questionUuid}-title`).type(questionTitle)

              cy.wait(1200)
              cy.getCy('saving-indicator').should('not.have.attr', 'data-state', 'saving')
            })
        })

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
          cy.getCy(`listing-item_${packageUuid}`).should('exist')
          cy.openListingItemActions(packageUuid)
          cy.getCy('listing-item_action_preview').click()

          cy.url().should('match', new RegExp(`/knowledge-models/${packageUuid}/preview$`))
          cy.contains(kmName).should('exist')
          cy.getCy(`questionnaire_chapter-nav_${chapterUuid}`).click()
          cy.contains('[data-cy="questionnaire_question-title"]', questionTitle).should('exist')

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
