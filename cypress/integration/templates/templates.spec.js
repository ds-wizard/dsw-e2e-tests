describe('Templates', () => {

    beforeEach(() => {
        cy.task('package:delete')
        cy.removeTemplate('dsw:questionnaire-report:1.3.0')
        cy.clearServerCache()

        cy.importKM('test-km-1')
        cy.importTemplate('templates/questionnaire-report.zip')
    })

    it('Default template', () => {
        cy.loginAs('datasteward')
        cy.visitApp('/templates')

        // View template detail
        cy.clickListingItemAction('Questionnaire Report', 'view')
        cy.url().should('contain', '/templates/')
        cy.getCy('template_header-title').contains('Questionnaire Report')

        // Usable knowledge models
        cy.getCy('template_km-link').click()
        cy.getCy('km-detail_header-title').contains('Test Knowledge Model 1')
    })
})
