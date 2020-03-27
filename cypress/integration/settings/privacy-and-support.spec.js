describe('Settings / Privacy & Support', () => {
    beforeEach(() => {
        cy.putDefaultAppConfig()
        cy.loginAs('admin')
        cy.visitApp('/settings/privacy-and-support')
    })

    after(() => {
        cy.putDefaultAppConfig()
    })

    it('privacy URL', () => {
        const privacyUrl = 'http://example.com'
        cy.fillFields({ privacyUrl })
        cy.clickBtn('Save')
        cy.logout()
        cy.clickLink('Sign Up')
        cy.get('a').contains('Privacy').should('have.attr', 'href', privacyUrl)
    })

    it('support', () => {
        const supportEmail = 'support@ds-wizard.org'
        const supportRepositoryName = 'My Support Repository'
        const supportRepositoryUrl = 'http://example.com'

        // Set support properties
        cy.fillFields({ supportEmail, supportRepositoryName, supportRepositoryUrl })
        cy.clickBtn('Save')

        // Open report issue modal
        cy.get('.sidebar-link').contains('Help').click()
        cy.get('.dropdown-item').contains('Report issue').click()

        cy.get('.modal-body .link-with-icon').contains(supportRepositoryName).should('have.attr', 'href', supportRepositoryUrl)
        cy.get('.modal-body a').contains(supportEmail).should('have.attr', 'href', `mailto:${supportEmail}`)
    })
})