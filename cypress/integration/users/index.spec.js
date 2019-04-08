describe('Users Index', () => {
    const user = {
        email: 'abigail.owen@example.com',
        name: 'Abigail',
        surname: 'Owen',
        role: 'DATASTEWARD',
        password: 'passw0rd'
    }

    beforeEach(() => {
        cy.task('mongo:delete', {
            collection: 'users',
            args: { email: user.email }
        })
        cy.createUser(user)
        cy.loginAs('admin')
        cy.visitApp('/users')
    })

    it('can delete user', () => {
        cy.clickIndexTableAction(user.email, 'Delete')
        cy.get('.modal-cover').should('be.visible')
        cy.clickBtn('Delete')
        cy.expectAlert('success', 'User was sucessfully deleted')
        cy.get('.index-table tr').contains(user.email).should('not.exist')
    })
})
