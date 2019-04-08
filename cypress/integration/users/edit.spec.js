describe('Users Edit', () => {

    const user = {
        email: 'danny.morgan@example.com',
        name: 'Danny',
        surname: 'Morgan',
        role: 'ADMIN',
        password: 'passw0rd'
    }
    const newEmail = 'danny.silver.mcmorgan@example.com'



    beforeEach(() => {
        cy.task('mongo:delete', {
            collection: 'users',
            args: { email: { $in: [user.email, newEmail] } }
        })
        cy.createUser(user)
        cy.loginAs('admin')
        cy.visitApp('/users')
    })


    it('can edit profile', () => {
        const newUser = {
            email: newEmail,
            name: 'Danny Silver',
            surname: 'McMorgan',
            s_role: 'DATASTEWARD',
        }

        // edit user profile
        cy.clickIndexTableAction(user.email, 'Edit')
        cy.url().should('contain', '/users/edit/')
        cy.fillFields(newUser)
        cy.clickBtn('Save')
        cy.expectAlert('success', 'Profile was successfully updated')

        // check it is correct in index table
        cy.visitApp('/users')
        cy.getIndexTableRow(newUser.email)
            .should('contain', newUser.name)
            .and('contain', newUser.surname)
            .and('contain', newUser.s_role)

        // check it is correct when reopened
        cy.clickIndexTableAction(newUser.email, 'Edit')
        cy.checkFields(newUser)
    })

    it('can edit password', () => {
        const password = 'new/passw0rd'

        // open password edit form and save
        cy.clickIndexTableAction(user.email, 'Edit')
        cy.url().should('contain', '/users/edit/')
        cy.get('.nav-tabs').should('exist') // make sure to not click Password link before it's there
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
        cy.clickBtn('Log in')
        cy.url().should('contain', '/welcome')
    })
})
