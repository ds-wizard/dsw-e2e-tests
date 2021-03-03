describe('Templates', () => {
    it('Default template', () => {
        cy.loginAs('datasteward')
        cy.visitApp('/templates')
        cy.clickListingItemAction('Questionnaire Report', 'View detail')
        cy.url().should('contain', '/templates/')
        cy.get('h1').contains('Questionnaire Report')
    })
})
