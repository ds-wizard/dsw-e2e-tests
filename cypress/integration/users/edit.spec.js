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

        cy.clickIndexTableAction(user.email, 'Edit')
        cy.fillFields(newUser)
        cy.clickBtn('Save')
        cy.get('.alert-success').should('contain', 'Profile was successfully updated')

        cy.visitApp('/users')
        cy.getIndexTableRow(newUser.email)
            .should('contain', newUser.name)
            .and('contain', newUser.surname)
            .and('contain', newUser.s_role)

        cy.clickIndexTableAction(newUser.email, 'Edit')
        cy.checkFields(newUser)
    })
})