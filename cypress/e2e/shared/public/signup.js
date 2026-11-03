// Public / sign up - with registration turned on in the authentication settings,
// sign up through the form, confirm the account through the link the activation
// email would carry (read from user_email_link), then log in.
import { deleteUserByEmail, logInThroughForm } from './publicHelpers'

function authenticationSettingsRequest(method, body) {
  return cy.apiToken().then((token) => {
    return cy.request({
      method,
      url: `${Cypress.expose('apiUrl')}/settings/authentication`,
      headers: { Authorization: `Bearer ${token}` },
      body
    })
  })
}

// Tenant-wide - call from a describe-level before(), paired with
// restoreAuthenticationSettings in after().
export function captureAuthenticationSettings() {
  return authenticationSettingsRequest('GET').then(({ body }) => body)
}

export function enableRegistration(originalSettings) {
  authenticationSettingsRequest('PUT', {
    ...originalSettings,
    value: { ...originalSettings.value, registrationEnabled: true }
  })
}

export function restoreAuthenticationSettings(originalSettings) {
  if (!originalSettings) {
    return
  }
  authenticationSettingsRequest('PUT', originalSettings)
}

export function signUpConfirmAndLogIn() {
  const now = Date.now()
  const email = `e2e-signup-${now}@example.com`
  const firstName = `Signup${now}`
  const password = `Passw0rd-${now}`

  cy.intercept('POST', /\/api\/users$/).as('signUp')
  cy.visitApp('/signup')
  cy.getField('email').type(email)
  cy.getField('firstName').type(firstName)
  cy.getField('lastName').type('User')
  cy.getField('password').type(password, { log: false })
  cy.getField('passwordConfirmation').type(password, { log: false })
  // Only there when the tenant links a privacy policy or terms of service.
  cy.get('body').then(($body) => {
    if ($body.find('#form-accept').length > 0) {
      cy.getField('accept').check()
    }
  })
  cy.getCy('form-submit').click()
  cy.wait('@signUp').its('response.statusCode').should('be.within', 200, 299)
  cy.getField('email').should('not.exist')

  cy.task('db:query', {
    qs: `SELECT u.uuid, u.active, uel.hash FROM user_entity u JOIN user_email_link uel ON uel.identity = u.uuid WHERE u.email = '${email}'`
  }).then(({ rows }) => {
    expect(rows, 'one activation link for the new user').to.have.length(1)
    expect(rows[0].active, 'inactive until confirmed').to.equal(false)
    const { uuid, hash } = rows[0]

    cy.intercept('PUT', new RegExp(`/api/users/${uuid}/state\\?hash=`)).as('activate')
    cy.visitApp(`/signup/${uuid}/${hash}`)
    cy.wait('@activate').its('response.statusCode').should('be.within', 200, 299)
  })

  logInThroughForm(email, password)
  cy.url().should('match', /\/dashboard$/)
  cy.contains(`Welcome, ${firstName}!`).should('exist')

  deleteUserByEmail(email)
}
