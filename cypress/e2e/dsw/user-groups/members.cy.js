import { addMemberToUserGroup } from '../../shared/user-groups/userGroupsMembers'

// Researcher, same persona as create.cy.js - the group's creator becomes its owner and
// can manage its members.
describe('User Groups / members', () => {
  beforeEach(() => {
    cy.loginAs('researcher')
  })

  it('adds a member to a user group', () => {
    addMemberToUserGroup()
  })
})
