// Public / forgotten password - request a reset for a throwaway user, open the
// recovery link the email would carry (read from user_email_link), set a new
// password and log in with it.
import { logInThroughForm } from './publicHelpers'

export function recoverForgottenPassword() {
  const now = Date.now()
  const newPassword = `Passw0rd-${now}-recovered`

  cy.createUser({
    email: `e2e-forgotten-password-${now}@example.com`,
    password: `Passw0rd-${now}-initial`,
    firstName: `Forgotten${now}`,
    lastName: 'Password'
  }).then((user) => {
    // So the only link left afterwards is the one this request creates.
    cy.task('db:delete', { table: 'user_email_link', where: { identity: user.uuid } })

    cy.intercept('POST', /\/api\/user-email-links$/).as('requestReset')
    cy.visitApp('/forgotten-password')
    cy.getField('email').type(user.email)
    cy.getCy('form-submit').click()
    cy.wait('@requestReset').its('response.statusCode').should('be.within', 200, 299)
    cy.getField('email').should('not.exist')

    cy.task('db:get', { table: 'user_email_link', where: { identity: user.uuid } }).then(({ rows }) => {
      expect(rows, 'one recovery link for the user').to.have.length(1)

      cy.intercept('PUT', new RegExp(`/api/users/${user.uuid}/password\\?hash=`)).as('setPassword')
      cy.visitApp(`/forgotten-password/${user.uuid}/${rows[0].hash}`)
      cy.getField('password').type(newPassword, { log: false })
      cy.getField('passwordConfirmation').type(newPassword, { log: false })
      cy.getCy('form-submit').click()
      cy.wait('@setPassword').its('response.statusCode').should('be.within', 200, 299)
      cy.getField('password').should('not.exist')
    })

    logInThroughForm(user.email, newPassword)
    cy.url().should('match', /\/dashboard$/)
    cy.contains(`Welcome, ${user.firstName}!`).should('exist')

    cy.apiToken().then((token) => {
      cy.request({
        method: 'DELETE',
        url: `${Cypress.expose('apiUrl')}/users/${user.uuid}`,
        headers: { Authorization: `Bearer ${token}` }
      })
    })
  })
}
