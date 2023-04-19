describe('Settings / Dashboard', () => {
    beforeEach(() => {
        cy.putDefaultAppConfig()
        cy.loginAs('admin')
        cy.visitApp('/settings/dashboard')
    })

    after(() => {
        cy.putDefaultAppConfig()
    })

    it('dashboard style DMP', () => {
        cy.task('questionnaire:delete')
        cy.getCy('form-group_html-radio-roleBased').find('input[type=radio]').should('be.checked')

        cy.visitApp('/dashboard')
        cy.getCy('dashboard_welcome').should('not.exist')
    })

    it('dashboard style Welcome', () => {
        cy.getCy('form-group_html-radio-welcome').click()
        cy.submitForm()
        cy.visitApp('/dashboard')
        cy.getCy('dashboard_welcome').should('exist')
    })

    const loginInfoCases = [{
        name: 'markdown',
        fields: { loginInfo: '# Welcome\n\nThis is a wizard instance for e2e tests' },
        element: 'login_info'
    }, {
        name: 'html',
        fields: { loginInfo: '<h1>Welcome</h1><p>This is a wizard instance for e2e tests</p>' },
        element: 'login_info'
    }, {
        name: 'sidebar markdown',
        fields: { loginInfoSidebar: '# Welcome\n\nThis is a wizard instance for e2e tests' },
        element: 'login_info-sidebar'
    }, {
        name: 'sidebar html',
        fields: { loginInfoSidebar: '<h1>Welcome</h1><p>This is a wizard instance for e2e tests</p>' },
        element: 'login_info-sidebar'
    }]
    loginInfoCases.forEach(({ name, fields, element }) => {
        it(`login info ${name}`, () => {
            cy.fillFields(fields)
            cy.submitForm()
            cy.logout()

            cy.getCy(element).find('h1').contains('Welcome')
            cy.getCy(element).find('p').contains('This is a wizard instance for e2e tests')
        })
    })

    it('announcement info', () => {
        // Add welcome info and fill some details
        cy.getCy('form-group_list_add-button').click()
        cy.get('label').contains('Info').click()
        cy.fillFields({ 'announcements\\.0\\.content': '# Info Announcement' })
        cy.checkToggle('announcements\\.0\\.dashboard')
        cy.submitForm()

        // It should be visible on the dashboard
        cy.visitApp('/dashboard')
        cy.getCy('announcement_info').contains('Info Announcement')

        // But not on the login screen
        cy.logout()
        cy.visitApp('/')
        cy.getCy('announcement_info').should('not.exist')
    })

    it('announcement warning', () => {
        // Add welcome info and fill some details
        cy.getCy('form-group_list_add-button').click()
        cy.get('label').contains('Warning').click()
        cy.fillFields({ 'announcements\\.0\\.content': '# Warning Announcement' })
        cy.checkToggle('announcements\\.0\\.loginScreen')
        cy.submitForm()

        // It should not be visible on the dashboard
        cy.visitApp('/dashboard')
        cy.get('.Dashboard').should('exist')
        cy.getCy('announcement_warning').should('not.exist')

        // But visible on the login screen
        cy.logout()
        cy.visitApp('/')
        cy.getCy('announcement_warning').contains('Warning Announcement')
    })

    it('announcement critical', () => {
        // Add welcome info and fill some details
        cy.getCy('form-group_list_add-button').click()
        cy.get('label').contains('Critical').click()
        cy.fillFields({ 'announcements\\.0\\.content': '# Critical Announcement' })
        cy.checkToggle('announcements\\.0\\.dashboard')
        cy.checkToggle('announcements\\.0\\.loginScreen')
        cy.submitForm()

        // It should be visible on the dashboard
        cy.visitApp('/dashboard')
        cy.getCy('announcement_danger').contains('Critical Announcement')

        // And visible on the login screen
        cy.logout()
        cy.visitApp('/')
        cy.getCy('announcement_danger').contains('Critical Announcement')
    })
})
