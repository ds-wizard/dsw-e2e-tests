import { editUserProfileRoleAndPassword, deactivateUser } from '../../shared/administration/administrationUsersEdit'

// Admin only - editing another user's profile, role and password needs users.manage.
describe('Administration / users / edit', () => {
  beforeEach(() => {
    cy.loginAs('admin')
  })

  it('edits another user\'s profile, role and password, then logs in as them', () => {
    editUserProfileRoleAndPassword()
  })

  it('deactivates a user, who can then no longer log in', () => {
    deactivateUser()
  })
})
