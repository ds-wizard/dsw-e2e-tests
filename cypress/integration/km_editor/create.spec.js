describe('KM Editor Create', () => {
    const kmName = 'Test Knowledge Model'
    const kmId = 'test-km'

    beforeEach(() => {
        cy.task('mongo:delete', {
            collection: 'branches',
            args: { kmId }
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
        cy.getIndexTableRow(kmId)
            .should('contain', kmName)
            .and('contain', '-')
    })
})