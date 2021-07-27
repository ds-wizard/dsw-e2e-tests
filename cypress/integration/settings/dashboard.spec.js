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
        cy.getCy('form-group_html-radio-dmp').click()
        cy.submitForm()
        cy.visitApp('/dashboard')
        cy.getCy('dashboard_dmp-workflow-widget').should('exist')
    })

    it('dashboard style Welcome', () => {
        cy.getCy('form-group_html-radio-welcome').click()
        cy.submitForm()
        cy.visitApp('/dashboard')
        cy.getCy('dashboard_welcome-widget').should('exist')
    })

    it('welcome info', () => {
        cy.fillFields({ welcomeInfo: '# Welcome info'})
        cy.submitForm()
        cy.visitApp('/dashboard')
        cy.getCy('dashboard_alert-info').contains('Welcome info')
    })

    it('welcome warning', () => {
        cy.fillFields({ welcomeWarning: '# Welcome warning'})
        cy.submitForm()
        cy.visitApp('/dashboard')
        cy.getCy('dashboard_alert-warning').contains('Welcome warning')
    })
})
