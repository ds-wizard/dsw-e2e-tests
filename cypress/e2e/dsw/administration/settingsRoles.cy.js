import {
  createAndDeleteRole,
  ensureAdminRoleCannotBeDeleted,
  captureDefaultRole,
  restoreDefaultRole,
  makeNewRoleDefaultForNewUsers
} from '../../shared/administration/administrationSettingsRoles'

// Admin only - the permission catalogue is tenant-wide, with no lesser persona able to
// manage it.
describe('Administration / settings / roles', () => {
  beforeEach(() => {
    cy.loginAs('admin')
  })

  it('creates a role with one permission, and deletes it', () => {
    createAndDeleteRole()
  })

  it('ensures the admin role cannot be deleted', () => {
    ensureAdminRoleCannotBeDeleted()
  })

  // Its own before()/after(), not inline cleanup - changing the tenant's default
  // role is global state every other invite-based spec here relies on.
  describe('default role', () => {
    let originalSettings

    before(() => {
      captureDefaultRole().then((settings) => {
        originalSettings = settings
      })
    })

    after(() => {
      restoreDefaultRole(originalSettings)
    })

    it('makes a new role the default, and checks a newly invited user gets it', () => {
      makeNewRoleDefaultForNewUsers(originalSettings)
    })
  })
})
