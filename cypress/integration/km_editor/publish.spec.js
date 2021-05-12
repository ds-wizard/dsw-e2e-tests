describe('KM Editor Publish', () => {
    const kmName = 'Test Knowledge Model'
    const kmId = 'test-km'
    const license = 'MIT'
    const description = 'This is the first version.'
    const readme = 'This is readme'

    beforeEach(() => {
        cy.task('package:delete', { km_id: kmId })
        cy.task('branch:delete', { km_id: kmId })
        cy.clearServerCache()

        cy.createKMEditor({ kmId, name: kmName, previousPackageId: null })
        cy.loginAs('datasteward')
        cy.visitApp('/km-editor')
    })

    it('can be published', () => {
        cy.clickListingItemAction(kmId, 'Publish')
        cy.url().should('contain', '/km-editor/publish')

        cy.get('.version-inputs input:nth-child(1)').type('1')
        cy.get('.version-inputs input:nth-child(2)').type('0')
        cy.get('.version-inputs input:nth-child(3)').type('0')
        cy.get('#license').type(license)
        cy.get('#description').type(description)
        cy.get('#readme').type(readme)
        cy.clickBtn('Publish')

        cy.url().should('contain', '/knowledge-models')

        cy.getListingItem(`:${kmId}:`)
            .should('contain', kmName)
            .and('contain', '1.0.0')

        cy.clickListingItemAction(`:${kmId}:`, 'View detail')
        cy.url().should('contain', kmId)
        cy.get('.top-header-title').should('contain', kmName)
        cy.get('.readme').should('contain', readme)
    })
})
