describe('Users Create', () => {
    const user = {
        email: 'jayden.mills@example.com',
        name: 'Jayden',
        surname: 'Mills',
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
        cy.clickBtn('Create User')
        cy.fillFields(user)
        cy.clickBtn('Save')

        cy.url().should('match', /\/users$/)
        cy.getIndexTableRow(user.email)
            .should('contain', user.name)
            .and('contain', user.surname)
            .and('contain', user.s_role)
    })
})
