import { dataCy } from '../../support/utils'

describe('Settings / OpenID', () => {
    beforeEach(() => {
        cy.task('openIdClient:delete')
        cy.putDefaultAppConfig()
        cy.clearServerCache()

        cy.loginAs('admin')
    })

    after(() => {
        cy.putDefaultAppConfig()
    })

    it('add and remove OpenID service', () => {
        cy.visitApp('/settings/open-id/create')

        // Fill in an OpenID service
        cy.get('.nav-link').contains('Custom').click()
        cy.fillFields({
            'clientId': 'my_app',
            'clientSecret': 'asdfghjkl',
            'url': 'https://accounts.google.com',
            'styleIcon': 'fab fa-google',
            'name': 'Google',
            'styleBackground': '#900',
            'styleColor': '#FFF',
        })
        
        cy.getCy('settings_authentication_service_parameters')
            .find(dataCy('form-group_list_add-button'))
            .click()
        cy.getCy('settings_authentication_service_parameter-name').type('hd')
        cy.getCy('settings_authentication_service_parameter-value').type('fit.cvut.cz')

        // check callback url
        // cy.getCy('form-group_text_callback-url').contains('http://localhost:8080/wizard/auth/google/callback')

        // Save and log out
        cy.submitForm()
        cy.logout()

        // Check the button is there
        cy.getCy('login_external_separator').should('exist')
        cy.get('.btn-external-login')
            .should('contain', 'Google')
            .should('have.css', 'color', 'rgb(255, 255, 255)')
            .should('have.css', 'backgroundColor', 'rgb(153, 0, 0)')
            .find('.fa-google').should('exist')

        // Log in again and remove the OpenID service
        cy.loginAs('admin')
        cy.visitApp('/settings/open-id')
        cy.get('.card .link-danger').click()
        cy.clickModalAction()
        cy.get('.card').should('not.exist')
        cy.logout()

        // Check that the button is gone
        cy.getCy('login_external_separator').should('not.exist')
        cy.getCy('login_external_google').should('not.exist')
    })
})