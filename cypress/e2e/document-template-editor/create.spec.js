describe('Document Template Editor / Create', () => {
    before(() => {
        cy.putDefaultAppConfig()
        cy.clearServerCache()
    })

    beforeEach(() => {
        cy.task('documentTemplate:delete')
        
        cy.importTemplate('templates/questionnaire-report.zip')
        cy.loginAs('datasteward')
    })

    it('can create empty', () => {
        const name = 'Empty Template'
        const templateId = 'empty-template'

        cy.visitApp('/document-template-editors')
        cy.getCy('document-template-editors_create-button').click()
        cy.url().should('contain', '/document-template-editors/create')

        cy.fillFields({
            name,
            templateId,
            'version-major': '1',
            'version-minor': '0',
            'version-patch': '0',
        })
        cy.submitForm()

        cy.url().should('contain', `/document-template-editors/dsw:${templateId}:1.0.0`)

        cy.visitApp('/document-template-editors')
        cy.getListingItem(templateId).should('contain', name)
    })

    it('can create from existing', () => {
        cy.visitApp('/document-templates/dsw:questionnaire-report:1.4.0')
        cy.getCy('dt-detail_create-editor-link').click()
        cy.submitForm()

        // it should be prefilled to next minor version
        cy.url().should('contain', `/document-template-editors/dsw:questionnaire-report:1.5.0`)

        cy.visitApp('/document-template-editors')
        cy.getListingItem('questionnaire-report').should('contain', 'Questionnaire Report')
    })
})