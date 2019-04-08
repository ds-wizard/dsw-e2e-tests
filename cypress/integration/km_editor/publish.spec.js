describe('KM Editor Publish', () => {
    const kmName = 'Test Knowledge Model'
    const kmId = 'test-km'
    const description = 'This is the first version.'

    beforeEach(() => {
        cy.task('mongo:delete', {
            collection: 'branches',
            args: { kmId }
        })
        cy.task('mongo:delete', {
            collection: 'packages',
            args: { kmId }
        })
        cy.createKMEditor({ kmId, name: kmName, parentPackageId: null })
        cy.loginAs('datasteward')
        cy.visitApp('/km-editor')
    })

    it('can be published', () => {
        cy.clickIndexTableAction(kmId, 'Publish')
        cy.url().should('contain', '/km-editor/publish')

        cy.get('.version-inputs input:nth-child(1)').type('1')
        cy.get('.version-inputs input:nth-child(2)').type('0')
        cy.get('.version-inputs input:nth-child(3)').type('0')
        cy.get('#description').type(description)
        cy.clickBtn('Publish')

        cy.url().should('contain', '/knowledge-models')

        cy.getIndexTableRow(kmId)
            .should('contain', kmName)
            .and('contain', '1.0.0')

        cy.clickIndexTableAction(kmId, 'View detail')
        cy.url().should('contain', '/test-km')
        cy.get('.card')
            .should('contain', '1.0.0')
            .and('contain', description)
    })
})