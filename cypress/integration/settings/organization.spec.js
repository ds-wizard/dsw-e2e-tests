describe('Settings / Organization', () => {
    beforeEach(() => {
        cy.putDefaultAppConfig()
        cy.loginAs('admin')
        cy.visitApp('/settings/organization')
    })

    after(() => {
        cy.putDefaultAppConfig()
    })

    it('name & organizationId', () => {
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

    it('affiliations', () => {
        const affiliations = [
            'Czech Technical University in Prague',
            'Institute of Organic Chemistry and Biochemistry of the CAS',
            'Something else'
        ]

        // Save affiliations
        cy.fillFields({ affiliations: affiliations.join('\n') })
        cy.clickBtn('Save', true)

        // Go to sign up and focus affiliation field
        cy.logout()
        cy.visitApp('/signup')
        cy.get('#affiliation').focus()

        // Check that the affiliation options are available
        affiliations.forEach(affiliation => {
            cy.get('.typehints li').contains(affiliation).should('exist')
        })
    })
})
