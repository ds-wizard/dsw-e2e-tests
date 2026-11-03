// Account / change password (Common.Pages.Users.Edit.Password). Runs as a throwaway
// user created and deleted here instead of the shared researcher persona, since
// actually changing a password would otherwise break researcher's login for the rest
// of the run (the tenant is seeded once, not reset between spec files).
//
// The only spec that does a real logout + login (via the user menu and login form,
// which cy.loginAs normally bypasses) - that's the only way to prove the new password
// was actually saved server-side, not just that the existing session is still valid.
export function changeOwnPassword() {
  const newPassword = `Passw0rd-${Date.now()}`

  cy.createUser({
    email: `e2e-change-password-${Date.now()}@example.com`,
    password: `Passw0rd-${Date.now()}-initial`,
    firstName: 'Change',
    lastName: 'Password'
  }).then((user) => {
    cy.loginAs(user)

    cy.visitApp('/users/edit/current/password')
    cy.getField('password').type(newPassword)
    cy.getField('passwordConfirmation').type(newPassword)
    cy.getCy('form-submit').click()
    cy.contains('Password was successfully changed.').should('exist')

    cy.get('#c-user-menu-trigger').click()
    cy.getCy('user-menu_logout').click()
    cy.url().should('match', /\/logout-successful$/)

    cy.visitApp('/')
    cy.get('#login-email').type(user.email)
    cy.get('#login-password').type(newPassword)
    cy.getCy('form-submit').click()

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
