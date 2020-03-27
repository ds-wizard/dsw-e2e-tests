describe('Settings / Look & Feel', () => {
    beforeEach(() => {
        cy.putDefaultAppConfig()
        cy.loginAs('admin')
        cy.visitApp('/settings/look-and-feel')
    })

    after(() => {
        cy.putDefaultAppConfig()
    })

    it('application title', () => {
        const appTitle = 'My Testing Wizard'
        cy.fillFields({ appTitle })
        cy.clickBtn('Save', true)
        cy.logout()
        cy.get('.navbar-brand').should('contain', appTitle)
    })

    it('application title short', () => {
        const appTitleShort = 'MT Wizard'
        cy.fillFields({ appTitleShort })
        cy.clickBtn('Save', true)
        cy.get('.logo-full').should('contain', appTitleShort)
    })

    it('custom menu links', () => {
        const icon = 'fas fa-magic'
        const title = 'Magic'
        const url = 'http://localhost:8080/users'

        // Add new link to the menu
        cy.clickBtn('Add', true)
        cy.getCy('input-icon').type(icon)
        cy.getCy('input-title').type(title)
        cy.getCy('input-url').type(url)
        cy.clickBtn('Save', true)

        // Check that the new link works
        cy.get('.menu a i.fa-magic').should('exist')
        cy.get('.menu a').contains(title).click()
        cy.url().should('be', url)

        // Remove the link
        cy.visitApp('/settings/look-and-feel')
        cy.getCy('button-remove').click()
        cy.clickBtn('Save', true)

        // Check that the link is gone
        cy.get('.menu a').contains(title).should('not.exist')
    })

    it('login info', () => {
        cy.fillFields({ loginInfo: '# Welcome\n\nThis is a wizard instance for e2e tests'})
        cy.clickBtn('Save', true)
        cy.logout()
        cy.get('.side-info h1').contains('Welcome')
        cy.get('.side-info p').contains('This is a wizard instance for e2e tests')
    })
})
