describe('Document Templates', () => {

    beforeEach(() => {
        cy.task('knowledgeModelPackage:delete')
        // all versions have to go, other specs may leave a newer one behind
        cy.task('documentTemplate:delete', { template_id: 'questionnaire-report' })
        cy.clearServerCache()

        cy.importKM('test-km-1')
        cy.importTemplate('templates/questionnaire-report.zip')
    })

    it('Default template', () => {
        cy.loginAs('datasteward')
        cy.visitApp('/document-templates')

        // View template detail
        cy.clickListingItemAction('Questionnaire Report', 'view')
        cy.url().should('contain', '/document-templates/')
        cy.getCy('detail-page-header-title').contains('Questionnaire Report')

        // Usable knowledge models
        cy.getCy('template_km-link').click()
        cy.getCy('detail-page-header-title').contains('Test Knowledge Model 1')
    })
})
