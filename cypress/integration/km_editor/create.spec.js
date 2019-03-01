describe('KM Editor', () => {
    const kmName = 'Test Knowledge Model'
    const kmId = 'test-km'

    beforeEach(() => {
        cy.task('mongo:delete', {
            collection: 'branches',
            args: { kmId: kmId }
        })
        cy.loginAs('datasteward')
        cy.visitApp('/km-editor')
    })

    it('can be created', () => {
        cy.get('.btn').contains('Create').click()
        cy.url().should('contain', '/km-editor/create')

        cy.get('#name').type(kmName)
        cy.get('#kmId').type(kmId)
        cy.get('.btn').contains('Save').click()
        cy.url().should('contain', '/km-editor/edit/')

        cy.visitApp('/km-editor')
        cy.get('.index-table tr').contains(kmId)
            .parent('tr')
            .should('contain', kmName)
            .and('contain', '-')
    })
})