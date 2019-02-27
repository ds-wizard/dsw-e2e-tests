describe('Sign up', () => {
    const testEmail = 'careen.herberts@example.com'
    const testPassword = 'passw0rd'

    beforeEach(() => {
        cy.task('mongo:delete', {
            collection: 'users',
            args: { email: testEmail }
        })
        cy.visitApp('/signup')
    })

    it('should work', () => {
        // fill in the form
        cy.get('#email').type(testEmail)
        cy.get('#name').type('Careen')
        cy.get('#surname').type('Herberts')
        cy.get('#password').type(testPassword)
        cy.get('#passwordConfirmation').type(testPassword)
        cy.get('#accept').check()
        cy.get('.btn').contains('Sign up').click()

        // form submission works
        cy.get('.lead').should('contain', 'Sign up was successful.')

        // navigate to correct signup confirmation
        cy.task('mongo:findOne', {
            collection: 'users',
            args: { email: testEmail }
        }).then(user => {
            cy.task('mongo:findOne', {
                collection: 'actionKeys',
                args: { userId: user.uuid }
            }).then(actionKey => {
                cy.visitApp('/signup-confirmation/' + user.uuid + '/' + actionKey.hash)
            })
        })

        // signup confirmation works
        cy.get('.lead').should('contain', 'Your email was successfully confirmed.')

        // navigate to login
        cy.get('a').contains('log in').click()

        // test that new user can login
        cy.get('#email').type(testEmail)
        cy.get('#password').type(testPassword)
        cy.get('.btn').contains('Log in').click()
        cy.url().should('include', '/welcome')
    })
})
