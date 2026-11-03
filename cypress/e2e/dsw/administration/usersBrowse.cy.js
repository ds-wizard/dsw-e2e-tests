import {
  setUpAdministrationUsersBrowse,
  tearDownAdministrationUsersBrowse,
  searchAdministrationUsersListing,
  sortAdministrationUsersListing
} from '../../shared/administration/administrationUsersBrowse'

// Admin only - users are tenant-wide, with no lesser persona able to manage them.
// Set up once (before()) and shared by both tests below - re-logging-in every test
// (beforeEach) since Cypress's test-isolation reset wipes the login session between
// tests but not this server-side data.
describe('Administration / users / browse', () => {
  let users

  before(() => {
    setUpAdministrationUsersBrowse().then((result) => {
      users = result
    })
  })

  beforeEach(() => {
    cy.loginAs('admin')
  })

  after(() => {
    tearDownAdministrationUsersBrowse(users)
  })

  it('searches users', () => {
    searchAdministrationUsersListing(users)
  })

  it('sorts users by every option, in both directions', () => {
    sortAdministrationUsersListing(users)
  })
})
