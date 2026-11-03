// Administration / users / editing another user - profile, role, password and the
// active flag, as admin. Each scenario creates its own user (and role) and deletes
// them at the end.

function apiRequest(token, method, path, body) {
  return cy.request({
    method,
    url: `${Cypress.expose('apiUrl')}${path}`,
    headers: { Authorization: `Bearer ${token}` },
    body
  })
}

function logOutThroughMenu() {
  cy.get('#c-user-menu-trigger').click()
  cy.getCy('user-menu_logout').click()
  cy.url().should('match', /\/logout-successful$/)
}

function logInThroughForm(email, password) {
  cy.visitApp('/')
  cy.get('#login-email').type(email)
  cy.get('#login-password').type(password, { log: false })
  cy.getCy('form-submit').click()
}

function createTestUser(prefix) {
  const now = Date.now()
  return cy.createUser({
    email: `e2e-${prefix}-${now}@example.com`,
    password: `Passw0rd-${now}-initial`,
    firstName: 'Edited',
    lastName: 'User'
  })
}

export function editUserProfileRoleAndPassword() {
  const now = Date.now()
  const roleName = `E2E Edit User Role ${now}`
  const firstName = `First${now}`
  const lastName = `Last${now}`
  const affiliation = `Affiliation ${now}`
  const newPassword = `Passw0rd-${now}-new`

  createTestUser('edit-user').then((user) => {
    cy.apiToken().then((token) => {
      apiRequest(token, 'POST', '/roles', { name: roleName, permissions: [] }).then(({ body: role }) => {
        cy.visitApp(`/users/edit/${user.uuid}`)
        cy.getField('firstName').should('have.value', user.firstName)
        cy.getField('firstName').clear().type(firstName)
        cy.getField('lastName').clear().type(lastName)
        cy.getField('affiliation').clear().type(affiliation)
        cy.getField('role').select(role.uuid)
        cy.getCy('form-submit').click()
        cy.getCy('form-unsaved').should('have.attr', 'hidden')

        apiRequest(token, 'GET', `/users/${user.uuid}`).then(({ body }) => {
          expect(body.firstName).to.equal(firstName)
          expect(body.lastName).to.equal(lastName)
          expect(body.affiliation).to.equal(affiliation)
          expect(body.role.uuid).to.equal(role.uuid)
          expect(body.active).to.equal(true)
        })

        cy.getCy('user_nav_password').click()
        cy.url().should('match', new RegExp(`/users/edit/${user.uuid}/password$`))
        cy.getField('password').type(newPassword)
        cy.getField('passwordConfirmation').type(newPassword)
        cy.getCy('form-submit').click()
        cy.getCy('form-unsaved').should('have.attr', 'hidden')

        logOutThroughMenu()
        logInThroughForm(user.email, newPassword)
        cy.url().should('match', /\/dashboard$/)
        cy.contains(`Welcome, ${firstName}!`).should('exist')

        apiRequest(token, 'DELETE', `/users/${user.uuid}`)
        apiRequest(token, 'DELETE', `/roles/${role.uuid}`)
      })
    })
  })
}

export function deactivateUser() {
  createTestUser('deactivate-user').then((user) => {
    cy.visitApp(`/users/edit/${user.uuid}`)
    cy.getField('firstName').should('have.value', user.firstName)
    cy.getField('active').should('be.checked').click()
    cy.getCy('form-submit').click()
    cy.getCy('form-unsaved').should('have.attr', 'hidden')

    cy.apiToken().then((token) => {
      apiRequest(token, 'GET', `/users/${user.uuid}`).its('body.active').should('equal', false)

      cy.request({
        method: 'POST',
        url: `${Cypress.expose('apiUrl')}/tokens`,
        body: { email: user.email, password: user.password },
        failOnStatusCode: false
      }).then((response) => {
        const gotToken = response.status < 300 && response.body.type === 'UserToken'
        expect(gotToken, 'an inactive user gets no token').to.equal(false)
      })

      logOutThroughMenu()
      logInThroughForm(user.email, user.password)
      cy.get('#c-api-error').should('exist')
      cy.url().should('not.match', /\/dashboard$/)

      apiRequest(token, 'DELETE', `/users/${user.uuid}`)
    })
  })
}
