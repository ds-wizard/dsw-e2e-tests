// Administration / settings / OpenID - create, rename and delete an OpenID provider
// config, checking its button on the logged-out login page in between. Config CRUD
// only: nothing here signs in through the provider. Admin only (settings.manage).

const namePrefix = 'E2E OpenID'

// Every config this module created, whatever state a failed test left it in.
export function cleanupOpenIdClients() {
  cy.apiToken().then((token) => {
    cy.request({
      method: 'GET',
      url: `${Cypress.expose('apiUrl')}/open-id-clients`,
      headers: { Authorization: `Bearer ${token}` }
    }).then(({ body }) => {
      body
        .filter((client) => client.name.startsWith(namePrefix))
        .forEach((client) => {
          cy.request({
            method: 'DELETE',
            url: `${Cypress.expose('apiUrl')}/open-id-clients/${client.uuid}`,
            headers: { Authorization: `Bearer ${token}` },
            failOnStatusCode: false
          })
        })
    })
  })
}

// The form opens on the Microsoft provider tab, whose client and directory ids must
// be UUIDs.
export function createEditAndDeleteOpenIdClient() {
  const name = `${namePrefix} ${Date.now()}`
  const renamed = `${name} renamed`

  cy.visitApp('/settings/open-id/create')
  cy.getField('name').type(name)
  cy.getField('clientId').type('7d1c3c1e-6a8f-4f4e-9d5b-3f0a1b2c3d4e')
  cy.getField('clientSecret').type('e2e-client-secret')
  cy.getField('directoryId').type('0b6f2a9e-1c3d-4e5f-8a7b-9c0d1e2f3a4b')
  cy.getCy('form-submit').click()

  cy.url().should('match', /\/settings\/open-id\/[0-9a-f-]{36}$/)
  cy.url().then((url) => {
    const uuid = url.split('/').pop()

    cy.getField('name').should('have.value', name)
    cy.getField('name').clear().type(renamed)
    cy.getPageFormTestId('form-submit').click()
    cy.getCy('form-unsaved').should('have.attr', 'hidden')

    cy.reload()
    cy.getField('name').should('have.value', renamed)
    cy.getField('directoryId').should('have.value', '0b6f2a9e-1c3d-4e5f-8a7b-9c0d1e2f3a4b')

    cy.logout()
    cy.visitApp('/')
    cy.getCy(`login_external_${uuid}`).should('contain.text', renamed)

    cy.loginAs('admin')
    cy.visitApp('/settings/open-id')
    cy.getCy(`openid_row_${uuid}`).should('contain.text', renamed)
    cy.getCy(`openid_row_${uuid}`).within(() => cy.getCy('openid_delete').click())
    cy.getCy('openid-delete_confirm').click()
    cy.getCy(`openid_row_${uuid}`).should('not.exist')

    cy.logout()
    cy.visitApp('/')
    cy.get('#login-email').should('exist')
    cy.getCy(`login_external_${uuid}`).should('not.exist')
  })
}
