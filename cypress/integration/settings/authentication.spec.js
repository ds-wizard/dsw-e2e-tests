describe('Settings / Authentication', () => {
    const testEmail = 'careen.herberts@example.com'
    const testPassword = 'passw0rd'

    beforeEach(() => {
        cy.task('mongo:delete', {
            collection: 'users',
            args: { email: testEmail }
        })
        cy.putDefaultAppConfig()
        cy.loginAs('admin')
        cy.visitApp('/settings/authentication')
    })

    after(() => {
        cy.putDefaultAppConfig()
    })

    it('default role', () => {
        // Update default role to admin
        cy.fillFields({ s_defaultRole: 'admin' })
        cy.clickBtn('Save')
        cy.logout()

        // Sign up as a new user
        cy.visitApp('/signup')
        cy.fillFields({
            email: testEmail,
            firstName: 'Careen',
            lastName: 'Herberts',
            password: testPassword,
            passwordConfirmation: testPassword
        })
        cy.get('#accept').check()
        cy.clickBtn('Sign Up')
        cy.get('.lead').should('contain', 'Sign up was successful.')

        // Activate the new user account
        cy.task('mongo:updateOne', {
            collection: 'users',
            query: { email: testEmail },
            update: {
                $set: {
                    active: true
                }
            }
        })

        // Log in as the new user
        cy.visitApp('/')
        cy.fillFields({
            email: testEmail,
            password: testPassword
        })
        cy.clickBtn('Log In')

        // Check that admin only items are visible
        cy.get('.menu li').contains('Users')
        cy.get('.sidebar-link').contains('Settings')
    })

    it('registration enabled', () => {
        cy.checkToggle('registrationEnabled')
        cy.clickBtn('Save', true)
        cy.logout()
        cy.get('.nav-link').contains('Sign Up').should('exist')
    })

    it('registration not enabled', () => {
        cy.uncheckToggle('registrationEnabled')
        cy.clickBtn('Save', true)
        cy.logout()
        cy.get('.nav-link').contains('Sign Up').should('not.exist')
    })

    it('OpenID service', () => {
        // Fill in an OpenID service
        cy.clickBtn('Add', true)
        cy.fillFields({
            'services\\.0\\.id': 'google',
            'services\\.0\\.clientId': 'my_app',
            'services\\.0\\.clientSecret': 'asdfghjkl',
            'services\\.0\\.url': 'https://accounts.google.com',
            'services\\.0\\.styleIcon': 'fab fa-google',
            'services\\.0\\.name': 'Google',
            'services\\.0\\.styleBackground': '#900',
            'services\\.0\\.styleColor': '#FFF',
        })
        cy.get('.input-table .btn').contains('Add').click()
        cy.getCy('input-name').type('hd')
        cy.getCy('input-value').type('fit.cvut.cz')

        // check callback url
        cy.get('.form-value').contains('http://localhost:8080/auth/google/callback')

        // Save and log out
        cy.clickBtn('Save')
        cy.logout()

        // Check the button is there
        cy.get('.external-login-separator').should('exist')
        cy.get('.btn-external-login')
            .should('contain', 'Google')
            .should('have.css', 'color', 'rgb(255, 255, 255)')
            .should('have.css', 'backgroundColor', 'rgb(153, 0, 0)')
            .find('.fa-google').should('exist')

        // Log in again and remove the OpenID service
        cy.loginAs('admin')
        cy.visitApp('/settings/authentication')
        cy.clickBtn('Remove')
        cy.clickBtn('Save')
        cy.logout()

        // Check that the button is gone
        cy.get('.external-login-separator').should('not.exist')
        cy.get('.btn-external-login').should('not.exist')
    })
})