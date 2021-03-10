describe('Users Edit', () => {

    const user = {
        email: 'danny.morgan@example.com',
        firstName: 'Danny',
        lastName: 'Morgan',
        role: 'admin',
        password: 'passw0rd'
    }
    const newEmail = 'danny.silver.mcmorgan@example.com'



    beforeEach(() => {
        cy.task('mongo:delete', {
            collection: 'users',
            args: { email: { $in: [user.email, newEmail] } }
        })
        cy.clearServerCache()
        
        cy.createUser(user)
        cy.loginAs('admin')
        cy.visitApp('/users')
    })


    it('can edit profile', () => {
        const newUser = {
            email: newEmail,
            firstName: 'Danny Silver',
            lastName: 'McMorgan',
            s_role: 'dataSteward',
        }

        // edit user profile
        cy.clickListingItemAction(user.email, 'Edit')
        cy.url().should('contain', '/users/edit/')
        cy.fillFields(newUser)
        cy.clickBtn('Save')
        cy.expectAlert('success', 'Profile was successfully updated')

        // check it is correct in index table
        cy.visitApp('/users')
        cy.getListingItem(newUser.email)
            .should('contain', newUser.firstName)
            .and('contain', newUser.lastName)
            .and('contain', 'Data Steward')

        // check it is correct when reopened
        cy.clickListingItemAction(newUser.email, 'Edit')
        cy.checkFields(newUser)
    })

    it('can edit password', () => {
        const password = 'new/passw0rd'

        // open password edit form and save
        cy.clickListingItemAction(user.email, 'Edit')
        cy.url().should('contain', '/users/edit/')
        cy.get('.nav-pills').should('exist') // make sure to not click Password link before it's there
        cy.clickLink('Password')
        cy.fillFields({ password, passwordConfirmation: password })
        cy.clickBtn('Save')
        cy.expectAlert('success', 'Password was successfully changed')

        // make sure user is active
        cy.task('mongo:updateOne', {
            collection: 'users',
            query: { email: user.email },
            update: { $set: { active: true } }
        })

        // logout and try to login with the new password
        cy.logout()
        cy.fillFields({ email: user.email, password })
        cy.clickBtn('Log In')
        cy.url().should('contain', '/dashboard')
    })
})
