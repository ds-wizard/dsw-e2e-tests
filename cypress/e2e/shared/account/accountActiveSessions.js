// Account / active sessions (Common.Pages.Users.Edit.ActiveSessions). Runs as a
// throwaway user so revoking sessions can't touch a shared persona's tokens. The
// extra sessions are plain POST /tokens logins (cy.apiToken).

function withThrowawayUser(prefix, body) {
  cy.createUser({
    email: `e2e-${prefix}-${Date.now()}@example.com`,
    password: `Passw0rd-${Date.now()}`,
    firstName: 'Active',
    lastName: 'Sessions'
  }).then((user) => {
    cy.loginAs(user)
    body(user)
    cy.apiToken().then((adminToken) => {
      cy.request({
        method: 'DELETE',
        url: `${Cypress.expose('apiUrl')}/users/${user.uuid}`,
        headers: { Authorization: `Bearer ${adminToken}` }
      })
    })
  })
}

// GET /tokens doesn't return the raw token, only its uuid - the session's own entry
// is the one flagged currentSession when listed with that same token.
function openSession(user) {
  return cy.apiToken(user).then((token) => {
    return cy.request({
      method: 'GET',
      url: `${Cypress.expose('apiUrl')}/tokens`,
      headers: { Authorization: `Bearer ${token}` }
    }).then(({ body }) => ({ token, uuid: body.find((session) => session.currentSession).uuid }))
  })
}

function expectTokenStatus(token, status) {
  cy.request({
    method: 'GET',
    url: `${Cypress.expose('apiUrl')}/users/current`,
    headers: { Authorization: `Bearer ${token}` },
    failOnStatusCode: false
  }).its('status').should('equal', status)
}

export function revokeActiveSession() {
  withThrowawayUser('revoke-session', (user) => {
    openSession(user).then((session) => {
      expectTokenStatus(session.token, 200)

      cy.visitApp('/users/edit/current/active-sessions')
      cy.getCy(`active-sessions_row_${session.uuid}`).within(() => cy.getCy('active-session_revoke-button').click())
      cy.getCy('active-session_revoke_confirm').click()
      cy.getCy(`active-sessions_row_${session.uuid}`).should('not.exist')

      expectTokenStatus(session.token, 401)
    })
  })
}

export function revokeAllActiveSessions() {
  withThrowawayUser('revoke-all-sessions', (user) => {
    openSession(user).then((first) => {
      openSession(user).then((second) => {
        cy.visitApp('/users/edit/current/active-sessions')
        cy.getCy(`active-sessions_row_${first.uuid}`).should('exist')
        cy.getCy(`active-sessions_row_${second.uuid}`).should('exist')

        cy.getCy('active-session_revoke-all-button').click()
        cy.getCy('active-session_revoke-all_confirm').click()

        cy.getCy(`active-sessions_row_${first.uuid}`).should('not.exist')
        cy.getCy(`active-sessions_row_${second.uuid}`).should('not.exist')
        // Only the browser's own session is left, so there's nothing for "Revoke all" to do.
        cy.get('[data-cy^="active-sessions_row_"]').should('have.length', 1)
        cy.getCy('active-session_revoke-all-button').should('not.exist')

        expectTokenStatus(first.token, 401)
        expectTokenStatus(second.token, 401)
      })
    })
  })
}
