describe('Users Index', () => {
    const user = {
        email: 'abigail.owen@example.com',
        firstName: 'Abigail',
        lastName: 'Owen',
        role: 'DATASTEWARD',
        password: 'passw0rd'
    }

    beforeEach(() => {
        cy.task('user:delete', { email: user.email })
        cy.clearServerCache()
        
        cy.createUser(user)
        cy.loginAs('admin')
        cy.visitApp('/users')
    })

    it('can delete user', () => {
        cy.clickListingItemAction(user.email, 'delete')
        cy.expectModalOpen('users-delete')
        cy.clickModalAction()
        cy.expectSuccessFlashMessage()
        cy.expectListingItemNotExist(user.email)
    })
})
