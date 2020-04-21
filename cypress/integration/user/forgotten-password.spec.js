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
        cy.task('mongo:delete', {
            collection: 'users',
            args: { email: user.email }
        })
        cy.createUser(user)
        cy.task('mongo:updateOne', {
            collection: 'users',
            query: { email: user.email },
            update: {
                $set: {
                    active: true
                }
            }
        })
    })

    it('can recover password', () => {
        // fill in the forgotten password form
        cy.visitApp('/forgotten-password')
        cy.fillFields({ email: user.email })
        cy.clickBtn('Recover')
        cy.get('.lead').should('contain', 'We\'ve sent you a recover link.')

        // navigate to correct password recovery page
        cy.task('mongo:findOne', {
            collection: 'users',
            args: { email: user.email }
        }).then(user => {
            cy.task('mongo:findOne', {
                collection: 'actionKeys',
                args: { userId: user.uuid }
            }).then(actionKey => {
                cy.visitApp(`/forgotten-password/${user.uuid}/${actionKey.hash}`)
            })
        })

        // fill in the new password
        cy.fillFields({
            password: newPassword,
            passwordConfirmation: newPassword,
        })
        cy.clickBtn('Save')
        cy.get('.lead').should('contain', 'Your password was has been changed. You can now log in.')
        
        // check that we can login using the new password
        cy.clickLink('log in')
        cy.fillFields({
            email: user.email,
            password: newPassword
        })
        cy.clickBtn('Log in')
        cy.url().should('include', '/dashboard')
    })
})
