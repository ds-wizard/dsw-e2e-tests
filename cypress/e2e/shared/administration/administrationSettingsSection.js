// Helpers shared by the administrationSettings<Page>.js modules: read/restore one
// tenant-wide settings section through the API, and save a settings page through its
// unsaved bar.

export function captureSettings(section) {
  return cy.apiToken().then((token) => {
    return cy.request({
      method: 'GET',
      url: `${Cypress.expose('apiUrl')}/settings/${section}`,
      headers: { Authorization: `Bearer ${token}` }
    }).then(({ body }) => body)
  })
}

// Skips rather than crashes on undefined - after hooks still run when before() failed
// before resolving the capture.
export function restoreSettings(section, originalSettings) {
  if (!originalSettings) {
    return
  }

  cy.apiToken().then((token) => {
    cy.request({
      method: 'PUT',
      url: `${Cypress.expose('apiUrl')}/settings/${section}`,
      headers: { Authorization: `Bearer ${token}` },
      body: originalSettings
    })
  })
}

// A successful save reloads the app on its own after a second
// (Common.Components.Form.reloadWhenSaved) - reloading explicitly here makes the
// "did it stick" check deterministic rather than racing that timer.
export function saveSettingsPage(section) {
  cy.intercept('PUT', new RegExp(`/settings/${section}(\\?|$)`)).as('saveSettings')
  cy.getPageFormTestId('form-submit').click()
  cy.wait('@saveSettings').its('response.statusCode').should('be.lessThan', 300)
  cy.getCy('form-unsaved').should('have.attr', 'hidden')
  cy.reload()
}

export function getSettings(section) {
  return cy.apiToken().then((token) => {
    return cy.request({
      method: 'GET',
      url: `${Cypress.expose('apiUrl')}/settings/${section}`,
      headers: { Authorization: `Bearer ${token}` }
    }).then(({ body }) => body)
  })
}
