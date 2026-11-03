// Creates a KM editor, confirms it appears in the listing with "Open editor"
// available, then deletes it via the API so reruns don't pile up rows.
//
// Selectors: cy.getField(path) for form fields (ids are prefixed "form-"), data-cy
// for everything else - never cy.contains(visibleText). No ".cy." in this filename
// so Cypress's specPattern skips it even though it lives next to the specs that
// import it.
export function createKmEditor() {
  // Unique per run so reruns against the same tenant don't collide on the KM ID's uniqueness constraint.
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

      // Row actions aren't rendered until the kebab menu is opened.
      cy.visitApp('/knowledge-models/editors')
      cy.getCy(`listing-item_${kmEditorUuid}`).should('exist')
      cy.getCy(`listing-item_${kmEditorUuid}`).within(() => {
        cy.openListingItemActions(kmEditorUuid)
        cy.getCy('listing-item_action_open-editor').should('exist')
      })

      cy.apiToken().then((token) => {
        cy.request({
          method: 'DELETE',
          url: `${Cypress.expose('apiUrl')}/knowledge-model-editors/${kmEditorUuid}`,
          headers: { Authorization: `Bearer ${token}` }
        })
      })
    })
}
