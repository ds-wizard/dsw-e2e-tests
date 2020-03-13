describe('Users Create', () => {
    const user = {
        email: 'jayden.mills@example.com',
        firstName: 'Jayden',
        lastName: 'Mills',
        s_role: 'RESEARCHER',
        password: 'passw0rd'
    }

    beforeEach(() => {
        cy.task('mongo:delete', {
            collection: 'users',
            args: { email: user.email }
        })
        cy.loginAs('admin')
        cy.visitApp('/users')
    })

    it('can be created', () => {
        cy.clickBtn('Create')
        cy.fillFields(user)
        cy.clickBtn('Save')

        cy.url().should('match', /\/users$/)
        cy.getListingItem(user.email)
            .should('contain', user.firstName)
            .and('contain', user.lastName)
            .and('contain', user.s_role)
    })
})
