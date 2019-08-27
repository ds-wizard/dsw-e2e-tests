describe('Organization', () => {
    it('can be edited', () => {
        const organization = {
            name: 'My Testing Organization',
            organizationId: 'mto'
        }

        // open organization page as an admin
        cy.loginAs('admin')
        cy.visitApp('/organization')

        // fill and save
        cy.fillFields(organization)
        cy.clickBtn('Save')

        // check for success message
        cy.expectAlert('success', 'Organization was successfully saved')

        // reload page and check values
        cy.visitApp('/organization')
        cy.checkFields(organization)
    })
})
