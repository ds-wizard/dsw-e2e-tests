// Projects / clone - the kebab menu's confirm-only clone modal (no name field, no
// permission gate beyond owning the project). Opens the new clone's own uuid on
// success.
//
// Deletes both the original and the clone at the end - two separate project rows.
export function cloneProject() {
  cy.fixture('shared/basic-km.json').then((fixture) => cy.cleanupKnowledgeModelPackage(fixture.id))

  cy.importKM('shared/basic-km.json').then((kmPackage) => {
    const projectName = `Test Clone Project ${Date.now()}`

    cy.visitApp('/projects/create')
    cy.getField('name').type(projectName)
    cy.getField('knowledgeModelPackageUuid').click()
    cy.focused().type('Basic KM')
    cy.getCy(`form-knowledgeModelPackageUuid_option_${kmPackage.uuid}`).click()
    cy.getCy('form-submit').click()

    cy.url()
      .should('match', /\/projects\/[0-9a-f-]{36}/).waitForPageFocus()
      .then((url) => {
        const projectUuid = url.match(/\/projects\/([0-9a-f-]{36})/)[1]

        cy.visitApp('/projects')
        cy.openListingItemActions(projectUuid)
        cy.getCy('listing-item_action_clone').click()
        cy.getCy('clone-project_confirm').click()

        cy.url()
          .should('match', /\/projects\/[0-9a-f-]{36}/).waitForPageFocus()
          .then((clonedUrl) => {
            const clonedProjectUuid = clonedUrl.match(/\/projects\/([0-9a-f-]{36})/)[1]
            expect(clonedProjectUuid).not.to.equal(projectUuid)

            cy.visitApp('/projects')
            cy.getCy(`listing-item_${clonedProjectUuid}`).should('exist')

            cy.apiToken().then((token) => {
              cy.request({
                method: 'DELETE',
                url: `${Cypress.expose('apiUrl')}/projects/${projectUuid}`,
                headers: { Authorization: `Bearer ${token}` }
              })
              cy.request({
                method: 'DELETE',
                url: `${Cypress.expose('apiUrl')}/projects/${clonedProjectUuid}`,
                headers: { Authorization: `Bearer ${token}` }
              })
            })
          })
      })
  })
}
