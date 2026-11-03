// Projects / create. No ".cy." in the filename, so Cypress's specPattern never picks
// this up as a spec of its own.
//
// A project can't be created from scratch - it needs an existing template or
// knowledge model, so this imports one first. With exactly one KM and no templates,
// Create.elm skips the "from template / from KM" choice and goes straight to the KM
// picker, which is why there's no radio-group step here. The KM picker's option is
// addressed by the imported package's own uuid (data-cy="form-
// knowledgeModelPackageUuid_option_<uuid>").
//
// Deletes the project it created at the end - not the imported KM package itself,
// which cy.cleanupKnowledgeModelPackage resets at the start of every run instead.
export function createProject() {
  // basic-km.json's id is fixed, not unique per run - clear out a previous run's
  // import first or the re-import below collides on the uniqueness constraint.
  cy.fixture('shared/basic-km.json').then((fixture) => cy.cleanupKnowledgeModelPackage(fixture.id))

  // Must stay inside this .then() - cy.importKM resolves asynchronously, so the uuid
  // isn't available until then, unlike a plain JS expression.
  cy.importKM('shared/basic-km.json').then((kmPackage) => {
    const projectName = `Test Project ${Date.now()}`

    cy.visitApp('/projects/create')

    cy.getField('name').type(projectName)

    // TypeHint fetches options from the API as you type - open, search, then pick by
    // uuid (the search text only narrows the request).
    cy.getField('knowledgeModelPackageUuid').click()
    cy.focused().type('Basic KM')
    cy.getCy(`form-knowledgeModelPackageUuid_option_${kmPackage.uuid}`).click()

    cy.getCy('form-submit').click()

    cy.url()
      .should('match', /\/projects\/[0-9a-f-]{36}/).waitForPageFocus()
      .then((url) => {
        const projectUuid = url.match(/\/projects\/([0-9a-f-]{36})/)[1]

        cy.visitApp('/projects')
        cy.getCy(`listing-item_${projectUuid}`).should('exist')

        cy.apiToken().then((token) => {
          cy.request({
            method: 'DELETE',
            url: `${Cypress.expose('apiUrl')}/projects/${projectUuid}`,
            headers: { Authorization: `Bearer ${token}` }
          })
        })
      })
  })
}
