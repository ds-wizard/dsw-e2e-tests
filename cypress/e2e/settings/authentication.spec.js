import { dataCy } from '../../support/utils'

describe('Settings / Authentication', () => {
    const testEmail = 'careen.herberts@example.com'
    const testPassword = 'StronkPassw0rd'
    
    let adminRoleUuid

    before(() => {
        cy.task('role:get', { name: 'Admin' }).then((result) => {
            adminRoleUuid = result.rows[0].uuid
        })
    })

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
        cy.fillFields({ s_defaultRoleUuid: adminRoleUuid })
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
        cy.task('userEmailLink:delete')

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
        cy.task('user:getActionParams', { email: Cypress.env('datasteward_username'), type: 'TwoFactorAuthUserEmailLinkType' }).then(([uuid, hash]) => {
            cy.fillFields({
                code: hash
            })
            cy.submitForm()
            cy.url().should('include', '/dashboard')
        })
    })
})