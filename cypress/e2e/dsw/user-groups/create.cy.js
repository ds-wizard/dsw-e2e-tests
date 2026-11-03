import { createUserGroup } from '../../shared/user-groups/userGroupsCreate'

// Researcher - needs the "userGroups.create" permission.
describe('User Groups / create', () => {
  beforeEach(() => {
    cy.loginAs('researcher')
  })

  it('creates a user group and lists it', () => {
    createUserGroup()
  })
})
