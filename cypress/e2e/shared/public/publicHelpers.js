// Helpers shared by the public-page modules (sign up, forgotten password).

export function logInThroughForm(email, password) {
  cy.visitApp('/')
  cy.get('#login-email').type(email)
  cy.get('#login-password').type(password, { log: false })
  cy.getCy('form-submit').click()
}

export function deleteUserByEmail(email) {
  cy.apiToken().then((token) => {
    cy.request({
      method: 'GET',
      url: `${Cypress.expose('apiUrl')}/users?q=${encodeURIComponent(email)}`,
      headers: { Authorization: `Bearer ${token}` }
    }).then(({ body }) => {
      const user = body._embedded.users.find((candidate) => candidate.email === email)
      if (user) {
        cy.request({
          method: 'DELETE',
          url: `${Cypress.expose('apiUrl')}/users/${user.uuid}`,
          headers: { Authorization: `Bearer ${token}` }
        })
      }
    })
  })
}
