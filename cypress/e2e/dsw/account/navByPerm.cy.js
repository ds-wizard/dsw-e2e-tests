// Account / navByPerm - no shared core: the menu is specific to the DSW client
// (apps/dsw's AppLayout in engine-frontend).
//
// Permission Probe (an empty-permission role, dsw/scripts/create-users.js) isolates one
// permission at a time - every other persona already holds several at once. Each
// cy.setPermissionProbePermissions call needs a fresh cy.visitApp after it:
// permissions come from the app's boot-time bootstrap fetch, not a live subscription.
//
// Mostly checks the nav entry's own existence, not the route behind it - but
// project-documents also gets a real visit to confirm the route itself is blocked,
// not just its nav entry hidden.
describe('Account / nav gated by permission', () => {
  beforeEach(() => {
    cy.loginAs('permissionProbe')
  })

  it('shows/hides nav entries as their gating permission is granted/revoked', () => {
    cy.setPermissionProbePermissions([])
    cy.visitApp('/')
    cy.getCy('menu_knowledge-models-editors').should('not.exist')
    cy.getCy('menu_knowledge-models-list').should('not.exist')
    cy.getCy('menu_knowledge-model-secrets').should('not.exist')
    cy.getCy('menu_projects-files').should('not.exist')
    cy.getCy('menu_documents').should('not.exist')
    cy.getCy('menu_document-editors').should('not.exist')
    cy.getCy('menu_documents-list').should('not.exist')
    cy.getCy('menu_users').should('not.exist')
    cy.getCy('menu_system-settings').should('not.exist')

    // Not just the nav entry gone - the route itself refuses to load, same
    // projects.edit (Common.Pages.Documents.Routes.isAllowed).
    cy.visitApp('/project-documents')
    cy.get('#ui-main-heading').should('contain.text', 'Not Allowed')

    cy.setPermissionProbePermissions(['knowledgeModels.useEditor'])
    cy.visitApp('/')
    cy.getCy('menu_knowledge-models-editors').should('exist')
    cy.getCy('menu_knowledge-models-list').should('not.exist')

    cy.setPermissionProbePermissions(['knowledgeModels.manage'])
    cy.visitApp('/')
    cy.getCy('menu_knowledge-models-editors').should('not.exist')
    cy.getCy('menu_knowledge-models-list').should('exist')
    cy.getCy('menu_knowledge-model-secrets').should('exist')

    cy.setPermissionProbePermissions(['projects.edit'])
    cy.visitApp('/')
    cy.getCy('menu_projects-files').should('exist')
    cy.getCy('menu_documents').should('exist')
    cy.getCy('menu_knowledge-models-list').should('not.exist')

    cy.setPermissionProbePermissions(['documentTemplates.useEditor'])
    cy.visitApp('/')
    cy.getCy('menu_document-editors').should('exist')
    cy.getCy('menu_documents-list').should('not.exist')

    cy.setPermissionProbePermissions(['documentTemplates.manage'])
    cy.visitApp('/')
    cy.getCy('menu_documents-list').should('exist')
    cy.getCy('menu_document-editors').should('not.exist')

    cy.setPermissionProbePermissions(['users.manage'])
    cy.visitApp('/')
    cy.getCy('menu_users').should('exist')

    // menu_system-settings is Feature.settingsAny - settings.manage, workspaceSettings.
    // manage and roles.manage each independently satisfy it on their own.
    cy.setPermissionProbePermissions(['settings.manage'])
    cy.visitApp('/')
    cy.getCy('menu_system-settings').should('exist')

    cy.setPermissionProbePermissions(['workspaceSettings.manage'])
    cy.visitApp('/')
    cy.getCy('menu_system-settings').should('exist')

    cy.setPermissionProbePermissions(['roles.manage'])
    cy.visitApp('/')
    cy.getCy('menu_system-settings').should('exist')

    // Left as it started (empty) - Permission Probe is shared by both this spec's
    // own reruns and anything else that might use the persona later.
    cy.setPermissionProbePermissions([])
  })
})
