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
        cy.submitForm()

        // form submission works
        cy.expectSuccessPageMessage()

        // navigate to correct signup confirmation
        cy.task('user:getActionParams', { email: testEmail, type: 'RegistrationActionKey' }).then(([uuid, hash]) => {
            cy.visitApp(`/signup/${uuid}/${hash}`)
        })

        // signup confirmation works
        cy.expectSuccessPageMessage()

        // navigate to login
        cy.getCy('public_nav_login').click()


        // test that new user can login
        cy.fillFields({
            email: testEmail,
            password: testPassword
        })
        cy.submitForm()
        cy.url().should('include', '/dashboard')
    })
})
