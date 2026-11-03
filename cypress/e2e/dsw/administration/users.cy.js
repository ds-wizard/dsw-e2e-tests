import { createListAndDeleteUser } from '../../shared/administration/administrationUsers'

// Admin only - users are tenant-wide, with no lesser persona able to manage them.
describe('Administration / users', () => {
  beforeEach(() => {
    cy.loginAs('admin')
  })

  it('invites a user, logs in as them, then lists and deletes the account', () => {
    createListAndDeleteUser()
  })
})
