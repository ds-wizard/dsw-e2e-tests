describe('Settings / Knowledge Model Registry', () => {
    beforeEach(() => {
        cy.putDefaultAppConfig()
        cy.loginAs('admin')
        cy.visitApp('/settings/knowledge-model-registry')
    })

    after(() => {
        cy.putDefaultAppConfig()
    })

    it('enabled', () => {
        cy.checkToggle('enabled')
        cy.fillFields({ token: 'qwertyuiop' })
        cy.clickBtn('Save')

        cy.visitApp('/knowledge-models/import')
        cy.get('.nav-link').contains('From Registry').should('exist')
        cy.get('.KnowledgeModels__Import__RegistryImport').should('exist')
    })

    it('disabled', () => {
        cy.uncheckToggle('enabled')
        cy.clickBtn('Save')

        cy.visitApp('/knowledge-models/import')
        cy.get('.nav-link').should('not.exist')
        cy.get('.KnowledgeModels__Import__RegistryImport').should('not.exist')

    })
})