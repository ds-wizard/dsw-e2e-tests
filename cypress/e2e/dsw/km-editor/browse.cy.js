import {
  setUpKmEditorBrowse,
  tearDownKmEditorBrowse,
  searchKmEditorListing,
  sortKmEditorListing
} from '../../shared/km-editor/kmEditorBrowse'

// Data Steward, same persona as create.cy.js. Set up once (before()) and shared by
// both tests below, like shareUserGroup.cy.js's own before()/after() - re-logging-in
// every test (beforeEach) since Cypress's test-isolation reset wipes the login session
// between tests but not this server-side data.
describe('KM Editor / browse', () => {
  let editors

  before(() => {
    cy.loginAs('dataSteward')
    setUpKmEditorBrowse().then((result) => {
      editors = result
    })
  })

  beforeEach(() => {
    cy.loginAs('dataSteward')
  })

  after(() => {
    tearDownKmEditorBrowse(editors)
  })

  it('searches knowledge model editors', () => {
    searchKmEditorListing(editors)
  })

  it.only('sorts knowledge model editors by every option, in both directions', () => {
    sortKmEditorListing(editors)
  })
})
