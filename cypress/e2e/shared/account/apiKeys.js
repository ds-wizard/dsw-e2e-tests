// Account / API keys (Common.Pages.Users.Edit.ApiKeys). Needs no special permission -
// run as researcher, same as editProfile.js.
//
// POST /api-keys only returns the raw token itself (Shared.Api.Resource.UserToken.
// UserTokenDTO), not the key's own uuid - so the row to assert/delete against is found
// afterwards from the GET /api-keys refetch that follows closing the "created" modal,
// matched by the name just typed.
//
// The point of this test is the token actually works as a bearer token for a real API
// call (GET /users/current) - not just that the UI shows it - and that deleting it
// revokes that same token immediately (WizardServer/FairWizard auth checks the token's
// row still exists on every request, not just the JWT signature/expiry).
export function createApiKeyAndUseIt() {
  const keyName = `E2E API Key ${Date.now()}`
  const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

  cy.visitApp('/users/edit/current/api-keys')
  cy.getCy('api-keys_create').click()
  cy.getField('name').type(keyName)
  // expiresAt is Ui.Field.date, a <ui-date-picker> (flatpickr, allowInput) rather than a
  // plain input - typing alone leaves it uncommitted, still reading as empty to the
  // form. blur() is flatpickr's own commit trigger for allowInput; {enter} would too,
  // but it also submits the enclosing <form> (Ui.Button.submit has no key handler of
  // its own to stop that).
  cy.getField('expiresAt').type(expiresAt).blur()

  cy.intercept('POST', '**/api-keys').as('createApiKey')
  // Modal.chrome's own submit button, Ui.Button.submit - "form-submit" unless
  // withTestId overrides it, which neither Create nor Done does here.
  cy.getCy('api-keys_create-modal').within(() => cy.getCy('form-submit').click())

  cy.wait('@createApiKey').its('response.body.token').then((apiKeyToken) => {
    cy.intercept('GET', '**/api-keys').as('listApiKeys')
    cy.getCy('api-keys_create-modal').within(() => cy.getCy('form-submit').click())

    cy.wait('@listApiKeys').its('response.body').then((apiKeys) => {
      const { uuid } = apiKeys.find((apiKey) => apiKey.name === keyName)
      cy.getCy(`api-keys_row_${uuid}`).should('contain.text', keyName)

      cy.env(['users']).then(({ users }) => {
        cy.request({
          method: 'GET',
          url: `${Cypress.expose('apiUrl')}/users/current`,
          headers: { Authorization: `Bearer ${apiKeyToken}` }
        }).then(({ status, body }) => {
          expect(status).to.equal(200)
          expect(body.email).to.equal(users.researcher.email)
        })
      })

      // api-keys_delete-button isn't scoped by uuid - it's the same testId on every
      // row - so it has to be targeted from within this row, not cy.getCy directly.
      cy.getCy(`api-keys_row_${uuid}`).within(() => cy.getCy('api-keys_delete-button').click())
      cy.getCy('api-keys_delete_confirm').click()
      cy.getCy(`api-keys_row_${uuid}`).should('not.exist')

      cy.request({
        method: 'GET',
        url: `${Cypress.expose('apiUrl')}/users/current`,
        headers: { Authorization: `Bearer ${apiKeyToken}` },
        failOnStatusCode: false
      }).its('status').should('equal', 401)
    })
  })
}
