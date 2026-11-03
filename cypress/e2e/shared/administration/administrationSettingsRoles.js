// Administration / settings / roles - create a role with one permission, then delete
// it through the real UI. Admin only.
//
// Only CRUD, not an exercise of what each permission actually gates - that's already
// covered by the "Permission Probe" role (cy.setPermissionProbePermissions, navByPerm
// specs). "projects.create" is just one representative permission.
export function createAndDeleteRole() {
  const roleName = `E2E Role ${Date.now()}`

  cy.visitApp('/settings/roles/create')
  cy.getField('name').type(roleName)
  cy.get('#permission-projects-create').click()
  cy.getCy('form-submit').click()

  cy.url().should('match', /\/settings\/roles$/)

  cy.apiToken().then((token) => {
    cy.request({
      method: 'GET',
      url: `${Cypress.expose('apiUrl')}/roles?q=${encodeURIComponent(roleName)}`,
      headers: { Authorization: `Bearer ${token}` }
    }).then(({ body }) => {
      const role = body._embedded.roles.find((candidate) => candidate.name === roleName)
      expect(role, 'the just-created role is found by its own name').to.exist
      expect(role.permissions).to.deep.equal(['projects.create'])

      cy.getCy(`roles_row_${role.uuid}`).should('exist')

      cy.getCy(`roles_row_${role.uuid}`).within(() => {
        cy.getCy('roles_delete').click()
      })
      cy.getCy('roles-delete_confirm').click()
      cy.getCy(`roles_row_${role.uuid}`).should('not.exist')
    })
  })
}

// Checked at both layers: in the UI, the per-row Delete button gets no onClick at
// all once it has a disabled reason (not just visually disabled), so this clicks it
// anyway and checks nothing changed; and directly against the API, in case anything
// ever bypasses the UI.
export function ensureAdminRoleCannotBeDeleted() {
  cy.apiToken().then((token) => {
    cy.request({
      method: 'GET',
      url: `${Cypress.expose('apiUrl')}/roles?size=100`,
      headers: { Authorization: `Bearer ${token}` }
    }).then(({ body }) => {
      const adminRole = body._embedded.roles.find((candidate) => candidate.isAdmin)
      expect(adminRole, 'an admin role exists').to.exist

      cy.visitApp('/settings/roles')
      cy.getCy(`roles_row_${adminRole.uuid}`).within(() => {
        cy.getCy('roles_delete')
          .should('have.attr', 'aria-disabled', 'true')
          .invoke('attr', 'aria-describedby')
          .then((describedById) => {
            cy.get(`#${describedById}`).should('contain.text', 'Admin role cannot be deleted')
          })

        cy.getCy('roles_delete').click()
      })
      cy.getCy(`roles_row_${adminRole.uuid}`).should('exist')

      cy.request({
        method: 'DELETE',
        url: `${Cypress.expose('apiUrl')}/roles/${adminRole.uuid}`,
        headers: { Authorization: `Bearer ${token}` },
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status, 'the API itself refuses to delete the admin role').to.equal(400)
        expect(response.body.error.code).to.equal('error.validation.role_admin_cannot_be_deleted')
      })
    })
  })
}

// Captures the tenant's current default role before makeNewRoleDefaultForNewUsers
// changes it, and restores it afterwards. Changing the tenant-wide default role is
// global state every other user-creating test here relies on - a describe-level
// before()/after() pair, not inline cleanup, so a failed assertion midway through
// still leaves the tenant as it found it.
export function captureDefaultRole() {
  return cy.apiToken().then((token) => {
    return cy.request({
      method: 'GET',
      url: `${Cypress.expose('apiUrl')}/settings/roles`,
      headers: { Authorization: `Bearer ${token}` }
    }).then(({ body }) => body)
  })
}

// Skip rather than crash on undefined - after() still runs even when before()
// itself failed before resolving this.
export function restoreDefaultRole(originalSettings) {
  if (!originalSettings) {
    return
  }

  cy.apiToken().then((token) => {
    cy.request({
      method: 'PUT',
      url: `${Cypress.expose('apiUrl')}/settings/roles`,
      headers: { Authorization: `Bearer ${token}` },
      body: originalSettings
    })
  })
}

// Makes a new role the tenant's default through the real "Set as default" button,
// then creates a new user and confirms their role is the new default, not whatever
// was default before.
//
// Cleans up the user and role here too - restoreDefaultRole must run first, since a
// role still assigned as default or still in use can't be deleted. The describe's
// own after() calling restoreDefaultRole again is then a harmless no-op, except when
// something above fails before getting here at all.
export function makeNewRoleDefaultForNewUsers(originalSettings) {
  const roleName = `E2E Default Role ${Date.now()}`
  const userEmail = `e2e-default-role-${Date.now()}@example.com`

  cy.visitApp('/settings/roles/create')
  cy.getField('name').type(roleName)
  cy.getCy('form-submit').click()

  cy.url().should('match', /\/settings\/roles$/)

  cy.apiToken().then((token) => {
    cy.request({
      method: 'GET',
      url: `${Cypress.expose('apiUrl')}/roles?q=${encodeURIComponent(roleName)}`,
      headers: { Authorization: `Bearer ${token}` }
    }).then(({ body }) => {
      const role = body._embedded.roles.find((candidate) => candidate.name === roleName)
      expect(role, 'the just-created role is found by its own name').to.exist

      cy.getCy(`roles_row_${role.uuid}`).within(() => {
        cy.getCy('roles_set-default').click()
      })
      cy.getCy(`roles_row_${role.uuid}`).should('contain.text', 'Default')

      cy.visitApp('/users')
      cy.getCy('users_create-button').click()
      cy.getField('email').type(userEmail)
      cy.getField('firstName').type('E2E')
      cy.getField('lastName').type('Default Role')
      cy.getField('password').type(`Passw0rd-${Date.now()}`)
      cy.getCy('form-submit').click()

      cy.url().should('match', /\/users$/)

      cy.request({
        method: 'GET',
        url: `${Cypress.expose('apiUrl')}/users?q=${encodeURIComponent(userEmail)}`,
        headers: { Authorization: `Bearer ${token}` }
      }).then(({ body }) => {
        const user = body._embedded.users.find((candidate) => candidate.email === userEmail)
        expect(user, 'the just-created user is found by its own email').to.exist
        expect(user.role.uuid, "the new user's role is the new default, not whatever was default before").to.equal(role.uuid)

        cy.request({
          method: 'DELETE',
          url: `${Cypress.expose('apiUrl')}/users/${user.uuid}`,
          headers: { Authorization: `Bearer ${token}` }
        })

        restoreDefaultRole(originalSettings)

        cy.request({
          method: 'DELETE',
          url: `${Cypress.expose('apiUrl')}/roles/${role.uuid}`,
          headers: { Authorization: `Bearer ${token}` }
        })
      })
    })
  })
}
