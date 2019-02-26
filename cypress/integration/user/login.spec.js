describe('Login', () => {
    beforeEach(() => {
        cy.visitApp('/')
    })

    const roles = ['admin', 'datasteward', 'researcher']
    roles.forEach((role) => {
        it('navigates to welcome page after successful login as ' + role, () => {
            cy.get('#email').type(Cypress.env(role + '_username'))
            cy.get('#password').type(Cypress.env(role + '_password'))
            cy.get('.btn').contains('Log in').click()
            cy.url().should('include', '/welcome')
        })
    })
})
