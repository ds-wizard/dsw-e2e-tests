describe('Sign up', () => {
    const testEmail = 'careen.herberts@example.com'
    const testPassword = 'passw0rd'

    beforeEach(() => {
        cy.task('user:delete', { email: testEmail })
        cy.putDefaultAppConfig()
        cy.clearServerCache()
        
        cy.visitApp('/signup')
    })

    it('should work', () => {
        // fill in the form
        cy.fillFields({
            email: testEmail,
            firstName: 'Careen',
            lastName: 'Herberts',
            password: testPassword,
            passwordConfirmation: testPassword
        })
        cy.get('#accept').check()
        cy.clickBtn('Sign Up')

        // form submission works
        cy.get('.lead').should('contain', 'Sign up was successful.')

        // navigate to correct signup confirmation
        cy.task('user:getActionParams', { email: testEmail, type: 'RegistrationActionKey' }).then(([uuid, hash]) => {
            cy.visitApp(`/signup/${uuid}/${hash}`)
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
        cy.clickBtn('Log In')
        cy.url().should('include', '/dashboard')
    })
})
