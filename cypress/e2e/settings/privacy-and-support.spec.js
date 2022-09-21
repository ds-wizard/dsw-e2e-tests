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
        cy.submitForm()
        cy.logout()
        cy.getCy('public_nav_sign-up').click()
        cy.getCy('signup_link_privacy').should('have.attr', 'href', privacyUrl)
    })

    it('terms of use URL', () => {
        const termsOfServiceUrl = 'http://example.com'
        cy.fillFields({ termsOfServiceUrl })
        cy.submitForm()
        cy.logout()
        cy.getCy('public_nav_sign-up').click()
        cy.getCy('signup_link_tos').should('have.attr', 'href', termsOfServiceUrl)
    })

    it('support', () => {
        const supportEmail = 'support@ds-wizard.org'
        const supportRepositoryName = 'My Support Repository'
        const supportRepositoryUrl = 'http://example.com'

        // Set support properties
        cy.fillFields({ supportEmail, supportRepositoryName, supportRepositoryUrl })
        cy.submitForm()

        // Open report issue modal
        cy.get('#menu_profile').trigger('mouseenter')
        cy.getCy('menu_report-issue').click()

        cy.getCy('report-modal_link_repository').contains(supportRepositoryName).should('have.attr', 'href', supportRepositoryUrl)
        cy.getCy('report-modal_link_support-mail').contains(supportEmail).should('have.attr', 'href', `mailto:${supportEmail}`)
    })
})