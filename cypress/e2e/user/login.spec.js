describe('Login', () => {
    beforeEach(() => {
        cy.visitApp('/')
    })

    const roles = ['admin', 'datasteward', 'researcher']
    roles.forEach((role) => {
        it('navigates to dashboard page after successful login as ' + role, () => {
            cy.fillFields({
                email: Cypress.env(role + '_username'),
                password: Cypress.env(role + '_password')
            })
            cy.submitForm()
            cy.url().should('include', '/dashboard')
        })
    })

    it('redirect to original URL after login', () => {
        cy.visitApp('/projects')
        cy.fillFields({
            email: Cypress.env('datasteward_username'),
            password: Cypress.env('datasteward_password')
        })
        cy.submitForm()
        cy.url().should('include', '/projects')
    })

    it('shows session expiring soon', () => {
        // create a session that expires in 8 minutes
        cy.loginAs('researcher', new Date(Date.now() + 8 * 60 * 1000))

        // check that warning modal and session warning are visible
        cy.visitApp('/')
        cy.getCy('modal_session-modal_expires-soon').should('exist')
        cy.clickModalCancel()
        cy.get('.session-warning').should('exist')

        // check that logout works correctly
        cy.get('.session-warning .btn').click()
        cy.get('.Public__Login').should('exist')
    })

    it('shows session expired', () => {
        // create an expired session
        cy.loginAs('researcher', new Date(Date.now() - 10 * 1000))

        // open projects and check that session expired modal is there
        cy.visitApp('/projects')
        cy.getCy('modal_session-modal_expired').should('exist')
        cy.clickModalAction()

        // login again
        cy.fillFields({
            email: Cypress.env('researcher_username'),
            password: Cypress.env('researcher_password')
        })
        cy.submitForm()

        // check redirect back to projects after the login
        cy.get('.Listing').should('exist')
        cy.url().should('match', /\/projects/)
    })
})
