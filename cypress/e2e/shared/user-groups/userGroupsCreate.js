// User Groups / create - create a group, confirm it's listed, then delete it via the
// API.
export function createUserGroup() {
  const groupName = `Test User Group ${Date.now()}`

  cy.visitApp('/user-groups/create')
  cy.getField('name').type(groupName)
  cy.getField('description').type('A user group created by the E2E suite.')
  cy.getCy('form-submit').click()

  cy.url()
    .should('match', /\/user-groups\/[0-9a-f-]{36}$/)
    .then((url) => {
      const userGroupUuid = url.split('/').pop()

      cy.visitApp('/user-groups')
      cy.getCy(`listing-item_${userGroupUuid}`).should('exist')

      cy.apiToken().then((token) => {
        cy.request({
          method: 'DELETE',
          url: `${Cypress.expose('apiUrl')}/user-groups/${userGroupUuid}`,
          headers: { Authorization: `Bearer ${token}` }
        })
      })
    })
}
