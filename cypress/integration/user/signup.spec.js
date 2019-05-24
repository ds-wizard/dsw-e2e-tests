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
        cy.fillFields({
            email: testEmail,
            name: 'Careen',
            surname: 'Herberts',
            password: testPassword,
            passwordConfirmation: testPassword
        })
        cy.get('#accept').check()
        cy.clickBtn('Sign up')

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
                cy.visitApp('/signup/' + user.uuid + '/' + actionKey.hash)
            })
        })

        // signup confirmation works
        cy.get('.lead').should('contain', 'Your email was successfully confirmed.')

        // navigate to login
        cy.clickLink('log in')

        // test that new user can login
        cy.fillFields({
            email: testEmail,
            password: testPassword
        })
        cy.clickBtn('Log in')
        cy.url().should('include', '/dashboard')
    })
})
