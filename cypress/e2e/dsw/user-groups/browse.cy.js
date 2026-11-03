import {
  setUpUserGroupsBrowse,
  tearDownUserGroupsBrowse,
  searchUserGroupsListing,
  sortUserGroupsListing
} from '../../shared/user-groups/userGroupsBrowse'

// Researcher - user groups need no permission beyond userGroups.create.
// Set up once (before()) and shared by both tests below, like shareUserGroup.cy.js's
// own before()/after() - re-logging-in every test (beforeEach) since Cypress's
// test-isolation reset wipes the login session between tests but not this
// server-side data.
describe('User Groups / browse', () => {
  let groups

  before(() => {
    setUpUserGroupsBrowse().then((result) => {
      groups = result
    })
  })

  beforeEach(() => {
    cy.loginAs('researcher')
  })

  after(() => {
    tearDownUserGroupsBrowse(groups)
  })

  it('searches user groups', () => {
    searchUserGroupsListing(groups)
  })

  it('sorts user groups by every option, in both directions', () => {
    sortUserGroupsListing(groups)
  })
})
