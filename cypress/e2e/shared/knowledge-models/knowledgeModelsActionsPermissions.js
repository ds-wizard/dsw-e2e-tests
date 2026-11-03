// Knowledge Models detail page / actions gated by permission - the detail route
// itself needs no permission at all (Feature.knowledgeModelsView is just "logged in"),
// so anyone signed in can open a package and see its read-only actions (Preview,
// Compare), but the manage ones (Export, Create KM editor, Fork, Set deprecated/
// Restore, Set public/private, Delete) all need knowledgeModels.manage - see
// KnowledgeModelActions.elm's own "manage" let-binding.
//
// Permission Probe, same as projectPermissions.js/navByPerm specs. Logging in before
// granting anything (rather than after) checks the page is reachable with zero
// permissions at all, not just that the gated actions are absent from it.
//
// cy.importKM (admin token, independent of whoever is logged in in the browser) -
// same already-Released fixture projectPermissions.js uses, so cleaned up first the
// same way. Deletes the package at the end (allVersions=true, same as
// knowledgeModelsDeprecate.js).
export function checkKnowledgeModelActionsGatedByManage() {
  cy.fixture('shared/basic-km.json').then((fixture) => cy.cleanupKnowledgeModelPackage(fixture.id))

  cy.importKM('shared/basic-km.json').then((kmPackage) => {
    const packageUuid = kmPackage.uuid

    cy.setPermissionProbePermissions([])
    cy.logout()
    cy.loginAs('permissionProbe')

    cy.visitApp(`/knowledge-models/${packageUuid}`)
    cy.get('#km-detail-actions-trigger').click()
    cy.getCy('listing-item_action_preview').should('exist')
    cy.getCy('listing-item_action_export').should('not.exist')
    cy.getCy('listing-item_action_create-km-editor').should('not.exist')
    cy.getCy('listing-item_action_fork').should('not.exist')
    cy.getCy('listing-item_action_set-deprecated').should('not.exist')
    cy.getCy('listing-item_action_delete').should('not.exist')

    cy.setPermissionProbePermissions(['knowledgeModels.manage'])
    cy.visitApp(`/knowledge-models/${packageUuid}`)
    cy.get('#km-detail-actions-trigger').click()
    cy.getCy('listing-item_action_export').should('exist')
    cy.getCy('listing-item_action_set-deprecated').should('exist')
    cy.getCy('listing-item_action_delete').should('exist')

    // Left as it started (empty) - Permission Probe is shared by both this spec's own
    // reruns and anything else that might use the persona later.
    cy.setPermissionProbePermissions([])

    cy.apiToken().then((token) => {
      cy.request({
        method: 'DELETE',
        url: `${Cypress.expose('apiUrl')}/knowledge-model-packages/${packageUuid}?allVersions=true`,
        headers: { Authorization: `Bearer ${token}` }
      })
    })
  })
}
