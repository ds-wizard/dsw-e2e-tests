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

        cy.createKMEditor({ kmId, name: kmName, version: '1.0.0', previousPackageId: null })
        cy.loginAs('datasteward')
        cy.visitApp('/km-editor')
    })

    it('can be published', () => {
        cy.clickListingItemAction(kmId, 'open-editor')
        
        cy.getCy('km-editor_nav_settings').click()
        cy.fillFields({
            'license': license,
            'description': description,
            'readme': readme
        })
        cy.clickBtn('Save')

        cy.getCy('km-editor_publish-button').click()
        cy.clickModalAction()
        
        cy.url().should('contain', kmId)
        cy.getCy('detail-page_header-title').should('contain', kmName)
        cy.getCy('detail-page_content').should('contain', readme)
        cy.getCy('detail-page_metadata_license').should('contain', license)
    })
})
