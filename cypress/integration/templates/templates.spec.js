describe('Templates', () => {
    it('Default template', () => {
        cy.loginAs('admin')
        cy.visitApp('/templates')
        cy.clickListingItemAction('Default Template', 'View detail')
        cy.url().should('contain', '/templates/')
        cy.get('h1').contains('Default Template')
    })
})
