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
        cy.task('user:delete', { email: user.email })
        cy.task('user:delete', { email: newEmail })
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
        cy.clickListingItemAction(user.email, 'edit')
        cy.url().should('contain', '/users/edit/')
        cy.fillFields(newUser)
        cy.submitForm()
        cy.expectSuccessFlashMessage()

        // check it is correct in index table
        cy.visitApp('/users')
        cy.getListingItem(newUser.email)
            .should('contain', newUser.firstName)
            .and('contain', newUser.lastName)
            .and('contain', 'Data Steward')

        // check it is correct when reopened
        cy.clickListingItemAction(newUser.email, 'edit')
        cy.checkFields(newUser)
    })

    it('can edit password', () => {
        const password = 'new/passw0rd'

        // open password edit form and save
        cy.clickListingItemAction(user.email, 'edit')
        cy.url().should('contain', '/users/edit/')
        cy.getCy('user_nav_password').click()
        cy.fillFields({ password, passwordConfirmation: password })
        cy.submitForm()
        cy.expectSuccessFlashMessage()
        
        // make sure user is active
        cy.task('user:activate', { email: user.email })

        // logout and try to login with the new password
        cy.logout()
        cy.fillFields({ email: user.email, password })
        cy.submitForm()
        cy.url().should('contain', '/dashboard')
    })
})
