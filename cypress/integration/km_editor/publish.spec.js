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
        cy.clickListingItemAction(kmId, 'publish')
        cy.url().should('contain', '/km-editor/publish')

        cy.fillFields({
            'version-major': '1',
            'version-minor': '0',
            'version-patch': '0',
            'license': license,
            'description': description,
            'readme': readme
        })
        cy.getCy('km-publish_publish-button').click()

        cy.url().should('contain', '/knowledge-models')

        cy.getListingItem(`:${kmId}:`)
            .should('contain', kmName)
            .and('contain', '1.0.0')

        cy.clickListingItemAction(`:${kmId}:`, 'view')
        cy.url().should('contain', kmId)
        cy.getCy('detail-page_header-title').should('contain', kmName)
        cy.getCy('detail-page_content').should('contain', readme)
    })
})
