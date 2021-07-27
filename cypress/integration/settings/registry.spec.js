describe('Settings / Knowledge Model Registry', () => {
    beforeEach(() => {
        cy.putDefaultAppConfig()
        cy.loginAs('admin')
        cy.visitApp('/settings/registry')
    })

    after(() => {
        cy.putDefaultAppConfig()
    })

    it('enabled', () => {
        cy.checkToggle('enabled')
        cy.fillFields({ token: 'qwertyuiop' })
        cy.submitForm()

        cy.visitApp('/knowledge-models/import')
        cy.getCy('km_import_nav_registry').should('exist')
        cy.getCy('km_import_registry').should('exist')

        cy.visitApp('/templates/import')
        cy.getCy('templates_import_nav_registry').should('not.exist')
        cy.getCy('templates_import_registry').should('not.exist')
    })

    it('disabled', () => {
        cy.uncheckToggle('enabled')
        cy.submitForm()

        cy.visitApp('/knowledge-models/import')
        cy.getCy('km_import_nav_registry').should('not.exist')
        cy.getCy('km_import_registry').should('not.exist')

        cy.visitApp('/templates/import')
        cy.getCy('templates_import_nav_registry').should('not.exist')
        cy.getCy('templates_import_registry').should('not.exist')
    })
})