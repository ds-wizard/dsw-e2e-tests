describe('Templates', () => {

    beforeEach(() => {
        cy.task('package:delete')
        cy.clearServerCache()

        cy.importKM('test-km-1')
    })

    it('Default template', () => {
        // TODO return datasteward once fixed
        // cy.loginAs('datasteward')
        cy.loginAs('admin')
        cy.visitApp('/templates')

        // View template detail
        cy.clickListingItemAction('Questionnaire Report', 'View detail')
        cy.url().should('contain', '/templates/')
        cy.get('h1').contains('Questionnaire Report')

        // Usable knowledge models
        cy.get('dt').contains('Usable with')
        cy.get('a').contains('dsw:test-km-1:1.0.0').click()
        cy.get('.top-header-title').contains('Test Knowledge Model 1')
    })
})
