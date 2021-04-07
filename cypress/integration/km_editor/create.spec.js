describe('KM Editor Create', () => {
    const kmName = 'Test Knowledge Model'
    const kmId = 'test-km'

    beforeEach(() => {
        cy.task('mongo:delete', {
            collection: 'packages',
        })
        cy.task('mongo:delete', {
            collection: 'branches',
        })
        cy.clearServerCache()
        
        cy.loginAs('datasteward')
        cy.visitApp('/km-editor')
    })

    it('can be created', () => {
        cy.clickBtn('Create')
        cy.url().should('contain', '/km-editor/create')

        cy.fillFields({ name: kmName, kmId })
        cy.clickBtn('Save')
        cy.url().should('contain', '/km-editor/edit/')

        cy.visitApp('/km-editor')
        cy.getListingItem(kmId).should('contain', kmName)
    })
})
