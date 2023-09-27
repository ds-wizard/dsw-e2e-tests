import { dataCy } from '../../support/utils'

describe('Settings / Authentication', () => {
    const testEmail = 'careen.herberts@example.com'
    const testPassword = 'StronkPassw0rd'

    beforeEach(() => {
        cy.task('user:delete', { email: testEmail })
        cy.putDefaultAppConfig()
        cy.clearServerCache()

        cy.loginAs('admin')
        cy.visitApp('/settings/authentication')
        cy.get('h2')
    })

    after(() => {
        cy.putDefaultAppConfig()
    })

    it('default role', () => {
        // Update default role to admin
        cy.fillFields({ s_defaultRole: 'admin' })
        cy.submitForm()
        cy.logout()

        // Sign up as a new user
        cy.visitApp('/signup')
        cy.fillFields({
            email: testEmail,
            firstName: 'Careen',
            lastName: 'Herberts',
            password: testPassword,
            passwordConfirmation: testPassword,
            c_accept: true
        })
        cy.submitForm()
        cy.expectSuccessPageMessage()

        // Activate the new user account
        cy.task('user:activate', { email: testEmail, active: true })

        // Log in as the new user
        cy.visitApp('/')
        cy.fillFields({
            email: testEmail,
            password: testPassword
        })
        cy.submitForm()

        // Check that admin only items are visible
        cy.get('#menu_administration').should('exist')
        cy.get('#menu_documents').should('exist')
    })

    it('registration enabled', () => {
        cy.expectToggleChecked('registrationEnabled')
        cy.logout()
        cy.getCy('public_nav_sign-up').should('exist')
    })

    it('registration not enabled', () => {
        cy.uncheckToggle('registrationEnabled')
        cy.submitForm()
        cy.logout()
        cy.getCy('public_nav_sign-up').should('not.exist')
    })

    it('2FA login', () => {
        cy.task('actionKey:delete')

        cy.checkToggle('twoFactorAuthEnabled')
        cy.submitForm()
        cy.logout()

        cy.visitApp('/')
        cy.fillFields({
            email: Cypress.env('datasteward_username'),
            password: Cypress.env('datasteward_password')
        })
        cy.submitForm()
        cy.get('#code').should('exist')
        cy.task('user:getActionParams', { email: Cypress.env('datasteward_username'), type: 'TwoFactorAuthActionKey' }).then(([uuid, hash]) => {
            cy.fillFields({
                code: hash
            })
            cy.submitForm()
            cy.url().should('include', '/dashboard')
        })
    })

    it('OpenID service', () => {
        // Fill in an OpenID service
        cy.getCy('form-group_list_add-button').contains('Add service').click()
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
        
        cy.getCy('settings_authentication_service_parameters')
            .find(dataCy('form-group_list_add-button'))
            .click()
        cy.getCy('settings_authentication_service_parameter-name').type('hd')
        cy.getCy('settings_authentication_service_parameter-value').type('fit.cvut.cz')

        // check callback url
        cy.getCy('form-group_text_callback-url').contains('http://localhost:8080/wizard/auth/google/callback')

        // Save and log out
        cy.submitForm()
        cy.logout()

        // Check the button is there
        cy.getCy('login_external_separator').should('exist')
        cy.getCy('login_external_google')
            .should('contain', 'Google')
            .should('have.css', 'color', 'rgb(255, 255, 255)')
            .should('have.css', 'backgroundColor', 'rgb(153, 0, 0)')
            .find('.fa-google').should('exist')

        // Log in again and remove the OpenID service
        cy.loginAs('admin')
        cy.visitApp('/settings/authentication')
        cy.getCy('settings_authentication_service_remove-button').click()
        cy.submitForm()
        cy.logout()

        // Check that the button is gone
        cy.getCy('login_external_separator').should('not.exist')
        cy.getCy('login_external_google').should('not.exist')
    })
})