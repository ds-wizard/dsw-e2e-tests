describe('Settings / Knowledge Model', () => {
    beforeEach(() => {
        cy.putDefaultAppConfig()
    })

    after(() => {
        cy.putDefaultAppConfig()
    })

    it('integration config', () => {
        cy.loginAs('admin')
        cy.visitApp('/settings/knowledge-models')

        const integrationConfig = 'bioportal:\n\tsecret: elephant'
        cy.fillFields({ integrationConfig })
        cy.submitForm()


        cy.visitApp('/settings/knowledge-models')
        cy.checkFields({ integrationConfig })
    })
})
