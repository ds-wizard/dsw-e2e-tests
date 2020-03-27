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
            cy.clickBtn('Log in')
            cy.url().should('include', '/dashboard')
        })
    })

    it('redirect to original URL after login', () => {
        cy.visitApp('/questionnaires')
        cy.fillFields({
            email: Cypress.env('datasteward_username'),
            password: Cypress.env('datasteward_password')
        })
        cy.clickBtn('Log in')
        cy.url().should('include', '/questionnaires')
    })
})
