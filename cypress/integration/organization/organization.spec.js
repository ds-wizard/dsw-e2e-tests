import * as form from '../../support/form-helpers'


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
        form.fillFields(organization)
        cy.get('.btn').contains('Save').click()

        // check for success message
        cy.get('.alert-success').contains('Organization was successfuly saved').should('exist')

        // reload page and check values
        cy.visitApp('/organization')
        form.checkFields(organization)
    })
})