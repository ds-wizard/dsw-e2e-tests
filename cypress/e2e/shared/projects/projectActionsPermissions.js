// Projects / list actions - the "Create" toolbar button and a project's own "Clone"
// action (its listing dropdown) are both gated by Feature.projectsCreate (engine-
// frontend's Common.Data.Feature), which needs projects.create - not projects.view/
// comment/edit/manage, the permissions projectPermissions.js's matrix already covers.
// Before this, "Clone" was shown unconditionally; "Create" has always needed it.
//
// Permission Probe, same as projectPermissions.js - needs projects.view on top (fully
// reset in between) just to see Data Steward's project row at all, independently of
// whatever projects.create is set to.
//
// Data Steward creates and owns the project; deletes it at the end.
export function checkProjectsListActionsGatedByCreate() {
  cy.fixture('shared/basic-km.json').then((fixture) => cy.cleanupKnowledgeModelPackage(fixture.id))

  cy.loginAs('dataSteward')
  cy.importKM('shared/basic-km.json').then((kmPackage) => {
    const projectName = `Test Create Permission Project ${Date.now()}`

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

        cy.setPermissionProbePermissions([])
        cy.logout()
        cy.loginAs('permissionProbe')

        cy.setPermissionProbePermissions(['projects.view'])
        cy.visitApp('/projects')
        cy.getCy('projects_create-button').should('not.exist')
        cy.openListingItemActions(projectUuid)
        cy.getCy('listing-item_action_open').should('exist')
        cy.getCy('listing-item_action_clone').should('not.exist')

        cy.setPermissionProbePermissions(['projects.view', 'projects.create'])
        cy.visitApp('/projects')
        cy.getCy('projects_create-button').should('exist')
        cy.openListingItemActions(projectUuid, 'listing-item_action_clone')
        cy.getCy('listing-item_action_clone').should('exist')

        // Left as it started (empty) - Permission Probe is shared by both this spec's
        // own reruns and anything else that might use the persona later.
        cy.setPermissionProbePermissions([])

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
