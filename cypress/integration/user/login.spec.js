describe('Login', () => {
    beforeEach(() => {
        cy.visitApp('/')
    })

    const roles = ['admin', 'datasteward', 'researcher']
    roles.forEach((role) => {
        it('navigates to welcome page after successful login as ' + role, () => {
            cy.fillFields({
                email: Cypress.env(role + '_username'),
                password: Cypress.env(role + '_password')
            })
            cy.clickBtn('Log in')
            cy.url().should('include', '/welcome')
        })
    })
})
