// Administration / settings / authentication - flip the "Registration" toggle, check
// it persisted and that the logged-out login page's "Sign Up" link follows it.
// Admin only (settings.manage).

const sectionUrl = () => `${Cypress.expose('apiUrl')}/settings/authentication`

export function captureAuthenticationSettings() {
  return cy.apiToken().then((token) => {
    return cy.request({
      method: 'GET',
      url: sectionUrl(),
      headers: { Authorization: `Bearer ${token}` }
    }).then(({ body }) => body)
  })
}

export function restoreAuthenticationSettings(originalSettings) {
  if (!originalSettings) {
    return
  }

  cy.apiToken().then((token) => {
    cy.request({
      method: 'PUT',
      url: sectionUrl(),
      headers: { Authorization: `Bearer ${token}` },
      body: originalSettings
    })
  })
}

// The Sign Up link has no data-cy (Ui.Page.Public's header links), so it's found by
// its href instead.
export function toggleRegistration(originalSettings) {
  const registrationEnabled = !originalSettings.value.registrationEnabled

  cy.visitApp('/settings/authentication')
  cy.get('#form-registrationEnabled').should(originalSettings.value.registrationEnabled ? 'be.checked' : 'not.be.checked')
  cy.get('#form-registrationEnabled').click()
  cy.getPageFormTestId('form-submit').click()
  cy.getCy('form-unsaved').should('have.attr', 'hidden')

  cy.reload()
  cy.get('#form-registrationEnabled').should(registrationEnabled ? 'be.checked' : 'not.be.checked')

  captureAuthenticationSettings().then((settings) => {
    expect(settings.value.registrationEnabled).to.equal(registrationEnabled)
    expect(settings.value.nonAdminLoginEnabled, 'nothing else on the form changed').to.equal(originalSettings.value.nonAdminLoginEnabled)
  })

  cy.logout()
  cy.visitApp('/')
  cy.get('#login-email').should('exist')
  cy.get('a[href$="/signup"]').should(registrationEnabled ? 'exist' : 'not.exist')
}
