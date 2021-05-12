describe('Forgotten password', () => {
    const user = {
        email: 'katie.hudson@example.com',
        firstName: 'Katie',
        lastName: 'Hudson',
        role: 'researcher',
        password: 'passw0rd',
    }
    const newPassword = 'passw1rd'

    beforeEach(() => {
        cy.task('user:delete', { email: user.email })
        cy.clearServerCache()

        cy.createUser(user)
        cy.task('user:activate', { email: user.email })
    })

    it('can recover password', () => {
        // fill in the forgotten password form
        cy.visitApp('/forgotten-password')
        cy.fillFields({ email: user.email })
        cy.clickBtn('Recover')
        cy.get('.lead').should('contain', 'We\'ve sent you a recover link.')

        // navigate to correct password recovery page
        cy.task('user:getActionParams', { email: user.email, type: 'ForgottenPasswordActionKey' }).then(([uuid, hash]) => {
            cy.visitApp(`/forgotten-password/${uuid}/${hash}`)
        })

        // fill in the new password
        cy.fillFields({
            password: newPassword,
            passwordConfirmation: newPassword,
        })
        cy.clickBtn('Save')
        cy.get('.lead').should('contain', 'Your password has been changed. You can now log in.')

        // check that we can login using the new password
        cy.clickLink('log in')
        cy.fillFields({
            email: user.email,
            password: newPassword
        })
        cy.clickBtn('Log In')
        cy.url().should('include', '/dashboard')
    })
})
