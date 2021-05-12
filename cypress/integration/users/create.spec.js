describe('Users Create', () => {
    const user = {
        email: 'jayden.mills@example.com',
        firstName: 'Jayden',
        lastName: 'Mills',
        s_role: 'researcher',
        password: 'passw0rd'
    }

    beforeEach(() => {
        cy.task('user:delete', { email: user.email })
        cy.clearServerCache()
        
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
            .and('contain', 'Researcher')
    })
})
