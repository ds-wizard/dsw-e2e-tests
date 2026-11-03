// Account / language (Common.Pages.Users.Edit.Language). Runs as a throwaway user so
// the shared personas' language is never touched.
//
// The tenants have no UI translation of their own (built-in English isn't one), so
// admin first uploads and enables a test translation to choose. Saving reloads the
// whole app (~1s later).
import { createEnabledLocale } from '../administration/administrationSettingsLocales'

export function changeLanguage() {
  cy.loginAs('admin')
  createEnabledLocale().then((locale) => chooseLanguage(locale))
}

function chooseLanguage(locale) {
  cy.createUser({
    email: `e2e-language-${Date.now()}@example.com`,
    password: `Passw0rd-${Date.now()}`,
    firstName: 'Change',
    lastName: 'Language'
  }).then((user) => {
    cy.loginAs(user)

    cy.apiToken(user).then((token) => {
      const expectUserLocale = (expected) => cy.request({
        method: 'GET',
        url: `${Cypress.expose('apiUrl')}/users/current/locale`,
        headers: { Authorization: `Bearer ${token}` }
      }).then(({ body }) => expect(body.uuid).to.equal(expected))

      cy.request({
        method: 'GET',
        url: `${Cypress.expose('apiUrl')}/locales/suggestions`,
        headers: { Authorization: `Bearer ${token}` }
      }).then(({ body: locales }) => {
        expect(locales.map((candidate) => candidate.uuid), 'enabled UI locales').to.include(locale.uuid)

        expectUserLocale(null)

        cy.visitApp('/users/edit/current/language')
        cy.getCy('user-language_').should('have.class', 'is-selected')
        cy.getCy(`user-language_${locale.uuid}`).click()

        cy.intercept('PUT', '**/users/current/locale').as('saveLocale')
        cy.getCy('form-unsaved').within(() => cy.getCy('form-submit').click())
        cy.wait('@saveLocale')
        expectUserLocale(locale.uuid)

        cy.visitApp('/users/edit/current/language')
        cy.getCy(`user-language_${locale.uuid}`).should('have.class', 'is-selected')

        cy.getCy('user-language_').click()
        cy.getCy('form-unsaved').within(() => cy.getCy('form-submit').click())
        cy.wait('@saveLocale')
        expectUserLocale(null)
      })
    })

    cy.apiToken().then((adminToken) => {
      cy.request({
        method: 'DELETE',
        url: `${Cypress.expose('apiUrl')}/users/${user.uuid}`,
        headers: { Authorization: `Bearer ${adminToken}` }
      })
    })
  })
}
