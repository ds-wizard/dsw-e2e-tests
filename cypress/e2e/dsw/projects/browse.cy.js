import {
  setUpProjectsBrowse,
  tearDownProjectsBrowse,
  searchProjectsListing,
  sortProjectsListing
} from '../../shared/projects/projectsBrowse'

// Data Steward, same persona as settings.cy.js. Set up once (before()) and shared by
// both tests below, like shareUserGroup.cy.js's own before()/after() - re-logging-in
// every test (beforeEach) since Cypress's test-isolation reset wipes the login session
// between tests but not this server-side data.
describe('Projects / browse', () => {
  let projects

  before(() => {
    cy.loginAs('dataSteward')
    setUpProjectsBrowse().then((result) => {
      projects = result
    })
  })

  beforeEach(() => {
    cy.loginAs('dataSteward')
  })

  after(() => {
    tearDownProjectsBrowse(projects)
  })

  it('searches projects', () => {
    searchProjectsListing(projects)
  })

  it('sorts projects by every option, in both directions', () => {
    sortProjectsListing(projects)
  })
})
