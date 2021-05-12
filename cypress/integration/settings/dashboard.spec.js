describe('Settings / Dashboard', () => {
    beforeEach(() => {
        cy.putDefaultAppConfig()
        cy.loginAs('admin')
        cy.visitApp('/settings/dashboard')
    })

    after(() => {
        cy.putDefaultAppConfig()
    })

    it('dashboard style DMP', () => {
        cy.task('questionnaire:delete')
        cy.get('label').contains('DMP Workflow').click()
        cy.clickBtn('Save', true)
        cy.visitApp('/dashboard')
        cy.get('.DMPWorkflowWidget').should('exist')
    })

    it('dashboard style Welcome', () => {
        cy.get('label').contains('Welcome').click()
        cy.clickBtn('Save', true)
        cy.visitApp('/dashboard')
        cy.get('.WelcomeWidget').should('exist')
    })

    it('welcome info', () => {
        cy.fillFields({ welcomeInfo: '# Welcome info'})
        cy.clickBtn('Save', true)
        cy.visitApp('/dashboard')
        cy.get('.Dashboard .alert-info h1').contains('Welcome info')
    })

    it('welcome warning', () => {
        cy.fillFields({ welcomeWarning: '# Welcome warning'})
        cy.clickBtn('Save', true)
        cy.visitApp('/dashboard')
        cy.get('.Dashboard .alert-warning h1').contains('Welcome warning')
    })
})
