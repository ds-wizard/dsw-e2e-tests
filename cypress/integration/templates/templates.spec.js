describe('Templates', () => {

    beforeEach(() => {
        cy.task('mongo:delete', {
            collection: 'packages',
        })
        cy.clearServerCache()

        cy.fixture('test-km-1').then((km) => {
            cy.importKM(km)
        })
    })

    it('Default template', () => {
        cy.loginAs('datasteward')
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
