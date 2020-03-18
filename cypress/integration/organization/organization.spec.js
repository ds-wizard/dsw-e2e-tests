describe('Organization', () => {
    it('can be edited', () => {
        const organization = {
            name: 'My Testing Organization',
            organizationId: 'mto'
        }

        // open organization page as an admin
        cy.loginAs('admin')
        cy.visitApp('/settings/organization')

        // fill and save
        cy.fillFields(organization)
        cy.clickBtn('Save')

        // reload page and check values
        cy.visitApp('/settings/organization')
        cy.checkFields(organization)
    })
})
