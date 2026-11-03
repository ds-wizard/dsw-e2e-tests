// Document Templates detail page / actions gated by permission - the detail route
// itself needs no permission at all (Feature.documentTemplatesView is just "logged
// in"), so anyone signed in can open a template, but every action in its kebab menu
// (Export, Create editor, Set deprecated/Restore, Delete) needs documentTemplates.
// manage - not documentTemplatesView, which is what gated Set deprecated/Restore
// before (DocumentTemplateActions.elm, setDeprecatedActionVisible/
// restoreActionVisible). Unlike the knowledge models version, there's no unconditional
// action left here once manage is off (Detail.elm's own "View detail" is always
// False - it's the page you're already on): ItemActions.menu renders nothing at all,
// trigger included, once its action list is empty (its own doc comment: "a menu that
// opens onto nothing is a tab stop that lies"), so the trigger itself - not just the
// items inside it - is what this checks is missing without the permission.
//
// Permission Probe, same as projectPermissions.js/navByPerm specs. Its own fixture
// (not action-template.zip/detail-action-template.zip, both actively deprecated/
// restored/deleted elsewhere) to avoid any collision with those specs.
//
// cy.importTemplate (admin token, independent of whoever is logged in in the
// browser). Deletes the template at the end.
export const permissionTemplateId = 'test.permission-template'

export function checkDocumentTemplateActionsGatedByManage() {
  cy.cleanupDocumentTemplate(permissionTemplateId)

  cy.importTemplate('templates/permission-template.zip').then((documentTemplate) => {
    const documentTemplateUuid = documentTemplate.uuid

    cy.setPermissionProbePermissions([])
    cy.logout()
    cy.loginAs('permissionProbe')

    cy.visitApp(`/document-templates/${documentTemplateUuid}`)
    cy.get('#document-template-actions-trigger').should('not.exist')

    cy.setPermissionProbePermissions(['documentTemplates.manage'])
    cy.visitApp(`/document-templates/${documentTemplateUuid}`)
    cy.get('#document-template-actions-trigger').click()
    cy.getCy('listing-item_action_export').should('exist')
    cy.getCy('listing-item_action_set-deprecated').should('exist')
    cy.getCy('listing-item_action_delete').should('exist')

    // Left as it started (empty) - Permission Probe is shared by both this spec's own
    // reruns and anything else that might use the persona later.
    cy.setPermissionProbePermissions([])

    cy.apiToken().then((token) => {
      cy.request({
        method: 'DELETE',
        url: `${Cypress.expose('apiUrl')}/document-templates/${documentTemplateUuid}?allVersions=true`,
        headers: { Authorization: `Bearer ${token}` }
      })
    })
  })
}
