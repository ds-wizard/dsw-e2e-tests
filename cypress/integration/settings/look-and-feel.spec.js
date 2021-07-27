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
        cy.submitForm()
        cy.logout()
        cy.getCy('nav_app-title').should('contain', appTitle)
    })

    it('application title short', () => {
        const appTitleShort = 'MT Wizard'
        cy.fillFields({ appTitleShort })
        cy.submitForm()
        cy.getCy('nav_app-title-short').should('contain', appTitleShort)
    })

    it('custom menu links', () => {
        const icon = 'fas fa-magic'
        const title = 'Magic'
        const url = 'http://localhost:8080/users'

        // Add new link to the menu
        cy.getCy('form-group_list_add-button').click()
        cy.getCy('input-icon').type(icon)
        cy.getCy('input-title').type(title)
        cy.getCy('input-url').type(url)
        cy.submitForm()

        // Check that the new link works
        cy.getCy('menu_custom-link').find('.fa-magic').should('exist')
        cy.getCy('menu_custom-link').contains(title).click()
        cy.url().should('eq', url)

        // Remove the link
        cy.visitApp('/settings/look-and-feel')
        cy.getCy('button-remove').click()
        cy.submitForm()

        // Check that the link is gone
        cy.getCy('menu_custom-link').should('not.exist')
    })

    it('login info', () => {
        cy.fillFields({ loginInfo: '# Welcome\n\nThis is a wizard instance for e2e tests'})
        cy.submitForm()
        cy.logout()

        cy.getCy('login_side-info').find('h1').contains('Welcome')
        cy.getCy('login_side-info').find('p').contains('This is a wizard instance for e2e tests')
    })
})
