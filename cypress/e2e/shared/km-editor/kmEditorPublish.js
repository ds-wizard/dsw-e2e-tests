// Publishing happens from within the editor itself: version/license/description/readme
// are set on its "settings" tab, then the editor's own "Publish" button opens a
// read-only confirm recapping them and publishes with whatever's already saved - it
// takes no input of its own. The standalone "/publish" form page is a different flow,
// reached only after a KM Migration completes or from the editors list, not from
// inside the editor.
//
// The settings tab's own save is a plain (non-debounced) PUT, but it's still
// fire-and-forget from the form's own perspective - clicking its "form-submit" button
// does not itself block navigation while the request is in flight, so navigating away
// immediately can abort it. The "form-unsaved" bar stays visible until the save
// actually succeeds, so that's what a test has to wait on before leaving the page.
//
// "readme" is a markdown editor - its source textarea is hidden until the mode switch
// ("markdown-editor_mode-markdown") is clicked.
export function publishKmEditor() {
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
    .then((url) => {
      const kmEditorUuid = url.split('/').pop()

      cy.visitApp(`/knowledge-models/editors/${kmEditorUuid}/settings`)
      cy.getField('versionMajor').clear().type('1')
      cy.getField('versionMinor').clear().type('0')
      cy.getField('versionPatch').clear().type('0')
      cy.getField('license').type('MIT')
      cy.getField('description').type('A knowledge model published by the E2E suite.')
      cy.getCy('markdown-editor_mode-markdown').click()
      cy.getField('readme').type('# Readme\n\nPublished by the E2E suite.')
      cy.getCy('form-submit').click()
      cy.getCy('form-unsaved').should('have.attr', 'hidden')

      cy.visitApp(`/knowledge-models/editors/${kmEditorUuid}`)
      cy.getCy('km-editor_publish').click()
      cy.getCy('km-editor_publish-modal_confirm').click()

      cy.url()
        .should('match', /\/knowledge-models\/[0-9a-f-]{36}$/)
        .then((publishedUrl) => {
          const publishedUuid = publishedUrl.split('/').pop()
          expect(publishedUuid).not.to.equal(kmEditorUuid)

          cy.apiToken().then((token) => {
            cy.request({
              method: 'DELETE',
              url: `${Cypress.expose('apiUrl')}/knowledge-model-packages/${publishedUuid}?allVersions=true`,
              headers: { Authorization: `Bearer ${token}` }
            })
          })
        })
    })
}
