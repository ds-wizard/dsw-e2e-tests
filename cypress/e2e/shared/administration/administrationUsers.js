// Administration / users - create, list, log in as, and delete a user. Admin only:
// users are a tenant-wide concept with no lesser persona able to manage them.
//
// A user created by an admin (data-cy "users_create-button") is active immediately,
// with the password the admin set. Logging in afterwards through the real login form
// (not cy.loginAs, which bypasses it) is what actually proves it works end to end.
export function createListAndDeleteUser() {
  const email = `e2e-user-${Date.now()}@example.com`
  const password = `Passw0rd-${Date.now()}`

  cy.visitApp('/users')
  cy.getCy('users_create-button').click()
  cy.getField('email').type(email)
  cy.getField('firstName').type('E2E')
  cy.getField('lastName').type('User')
  cy.getField('password').type(password)
  cy.getCy('form-submit').click()

  cy.url().should('match', /\/users$/)

  cy.apiToken().then((token) => {
    cy.request({
      method: 'GET',
      url: `${Cypress.expose('apiUrl')}/users?q=${encodeURIComponent(email)}`,
      headers: { Authorization: `Bearer ${token}` }
    }).then(({ body }) => {
      const user = body._embedded.users.find((candidate) => candidate.email === email)
      expect(user, 'the just-created user is found by its own email').to.exist

      cy.getCy(`listing-item_${user.uuid}`).should('exist')

      cy.get('#c-user-menu-trigger').click()
      cy.getCy('user-menu_logout').click()
      cy.url().should('match', /\/logout-successful$/)

      cy.visitApp('/')
      cy.get('#login-email').type(email)
      cy.get('#login-password').type(password)
      cy.getCy('form-submit').click()

      cy.url().should('match', /\/dashboard$/)
      cy.contains('Welcome, E2E!').should('exist')

      // Back to admin to finish the listing/delete steps below.
      cy.loginAs('admin')
      cy.visitApp('/users')

      cy.getCy(`listing-item_${user.uuid}`).should('exist')
      cy.openListingItemActions(user.uuid)
      cy.getCy('listing-item_action_delete').click()
      cy.getCy('users-delete_confirm').click()
      cy.getCy(`listing-item_${user.uuid}`).should('not.exist')
    })
  })
}
