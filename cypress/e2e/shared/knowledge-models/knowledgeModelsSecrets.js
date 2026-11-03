// Knowledge Models / secrets (Common.Pages.KnowledgeModelSecrets) - create, set a new
// value, delete. The server never returns a secret's value, so setting one is only
// checked by the PUT succeeding.
//
// The create and edit dialogs are both always in the DOM, so their fields carry a
// prefix: "create-secret-modal-form-name", "edit-secret-modal-form-value".
const secretPrefix = 'e2e-secret-'

// Deletes secrets an earlier failed run left behind.
function cleanupSecrets() {
  cy.apiToken().then((token) => {
    cy.request({
      method: 'GET',
      url: `${Cypress.expose('apiUrl')}/knowledge-model-secrets`,
      headers: { Authorization: `Bearer ${token}` }
    }).then(({ body }) => {
      body.filter((secret) => secret.name.startsWith(secretPrefix)).forEach((secret) => {
        cy.request({
          method: 'DELETE',
          url: `${Cypress.expose('apiUrl')}/knowledge-model-secrets/${secret.uuid}`,
          headers: { Authorization: `Bearer ${token}` }
        })
      })
    })
  })
}

export function manageKnowledgeModelSecret() {
  const secretName = `${secretPrefix}${Date.now()}`

  cleanupSecrets()

  cy.intercept('GET', '**/knowledge-model-secrets*').as('listSecrets')
  cy.visitApp('/knowledge-models/secrets')
  cy.wait('@listSecrets')
  cy.getCy('km-secrets_create').click()
  cy.get('#create-secret-modal-form-name').type(secretName)
  cy.get('#create-secret-modal-form-value').type('initial-value')
  cy.getCy('create-secret-modal').within(() => cy.getCy('form-submit').click())

  cy.wait('@listSecrets').its('response.body').then((secrets) => {
    const { uuid } = secrets.find((secret) => secret.name === secretName)
    cy.getCy(`km-secrets_row_${uuid}`).should('contain.text', secretName)

    cy.getCy(`km-secrets_row_${uuid}`).within(() => cy.getCy('km-secrets_set-value').click())
    cy.get('#edit-secret-modal-form-value').type('updated-value')
    cy.intercept('PUT', `**/knowledge-model-secrets/${uuid}`).as('updateSecret')
    cy.getCy('edit-secret-modal').within(() => cy.getCy('form-submit').click())
    cy.wait('@updateSecret').its('response.statusCode').should('be.lessThan', 300)
    cy.getCy(`km-secrets_row_${uuid}`).should('exist')

    cy.getCy(`km-secrets_row_${uuid}`).within(() => cy.getCy('km-secrets_delete').click())
    cy.getCy('delete-secret-modal_confirm').click()
    cy.getCy(`km-secrets_row_${uuid}`).should('not.exist')
  })
}
