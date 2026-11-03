// Projects listing / browse (route /projects) - search and sort. Separate from every
// other Projects spec, which only ever needs one or two projects in the listing.
//
// Three projects created in reverse alphabetical order (Gamma, then Beta, then Alpha)
// through the same create form projectSettings.js's own createProject helper uses -
// no faster API-direct path exists for Projects in this suite - so name order and
// creation order differ.
//
// "Beta" is also the one edited afterwards (its Settings tab's description, saved and
// confirmed persisted via "form-unsaved" going hidden - the same save race fixed
// elsewhere this session) so its own "updatedAt" becomes the most recent of the
// three, distinct from both the name and createdAt orders - proving the sort actually
// switched fields rather than happening to agree with "createdAt" by coincidence.
//
// Set up once (before()) and shared by both the search and sort tests below - cleanup
// is API-direct by uuid (DELETE /projects/:uuid), safe to call repeatedly.
function createProject(kmPackage, name) {
  cy.visitApp('/projects/create')
  cy.getField('name').type(name)
  cy.getField('knowledgeModelPackageUuid').click()
  cy.focused().type('Basic KM')
  cy.getCy(`form-knowledgeModelPackageUuid_option_${kmPackage.uuid}`).click()
  cy.getCy('form-submit').click()

  return cy.url()
    .should('match', /\/projects\/[0-9a-f-]{36}/).waitForPageFocus()
    .then((url) => ({ projectUuid: url.match(/\/projects\/([0-9a-f-]{36})/)[1] }))
}

// Reads back each project's own real createdAt/updatedAt rather than trusting this
// script's guess at the wall-clock order its own UI-driven creates and the Settings
// save landed in - timestamps come from the server, not from assuming how long each
// step took. GET /projects already carries both fields per row, so one request
// covers all three.
function fetchProjectTimestamps(token, projects) {
  return cy.request({
    method: 'GET',
    url: `${Cypress.expose('apiUrl')}/projects?size=100`,
    headers: { Authorization: `Bearer ${token}` }
  }).then(({ body }) => {
    const byUuid = {}
    body._embedded.projects.forEach((project) => {
      byUuid[project.uuid] = project
    })
    const withTimestamps = {}
    Object.entries(projects).forEach(([key, project]) => {
      const fetched = byUuid[project.projectUuid]
      withTimestamps[key] = { ...project, name: fetched.name, createdAt: fetched.createdAt, updatedAt: fetched.updatedAt }
    })
    return withTimestamps
  })
}

export function setUpProjectsBrowse() {
  const suffix = Date.now()

  return cy.fixture('shared/basic-km.json').then((fixture) => {
    return cy.cleanupKnowledgeModelPackage(fixture.id).then(() => {
      return cy.importKM('shared/basic-km.json').then((kmPackage) => {
        return createProject(kmPackage, `Gamma Project ${suffix}`).then((gamma) => {
          return createProject(kmPackage, `Beta Project ${suffix}`).then((beta) => {
            return createProject(kmPackage, `Alpha Project ${suffix}`).then((alpha) => {
              cy.visitApp(`/projects/${beta.projectUuid}/settings`)
              cy.getField('description').clear().type('Edited after all three projects were created.')
              cy.getPageFormTestId('form-submit').click()
              // Same race as projectSettings.js's own Settings-tab saves - wait for
              // the save to actually land before returning (chained, not
              // fire-and-forget - the exact "mixing async and sync code" shape
              // already fixed elsewhere this session) - otherwise whatever runs
              // next can race ahead of this project's updatedAt having moved.
              return cy.getCy('form-unsaved').should('have.attr', 'hidden').then(() => {
                return cy.apiToken().then((token) => {
                  return fetchProjectTimestamps(token, { alpha, beta, gamma }).then((withTimestamps) => ({
                    ...withTimestamps,
                    kmPackageId: fixture.id
                  }))
                })
              })
            })
          })
        })
      })
    })
  })
}

// after() still runs even when before() itself failed before resolving this - skip
// rather than crash on undefined, which would only mask whatever before() actually
// failed on (same reasoning as projectShareUserGroup.js's tearDownSharedProject).
export function tearDownProjectsBrowse(projectsResult) {
  if (!projectsResult) {
    return
  }

  const { alpha, beta, gamma, kmPackageId } = projectsResult

  cy.apiToken().then((token) => {
    const projects = [alpha, beta, gamma]
    projects.forEach(({ projectUuid }) => {
      cy.request({
        method: 'DELETE',
        url: `${Cypress.expose('apiUrl')}/projects/${projectUuid}`,
        headers: { Authorization: `Bearer ${token}` }
      })
    })
  })
  cy.cleanupKnowledgeModelPackage(kmPackageId)
}

// li, not just [data-cy^="listing-item_"] - see documentTemplatesBrowse.js's own
// assertOrder for why (a row's own badges share that data-cy prefix).
function assertOrder(uuids) {
  const rowOrder = uuids.map((uuid) => `listing-item_${uuid}`)
  cy.get('li[data-cy^="listing-item_"]')
    .should('have.length', uuids.length)
    .then(($rows) => {
      expect([...$rows].map((row) => row.getAttribute('data-cy'))).to.deep.equal(rowOrder)
    })
}

// Reads the sort-direction button's own accessible name - Ui.Button.iconOnly sets
// aria-label to its label, and Common.Components.Listing.viewSort's own
// directionLabel is "Sorted ascending. Sort descending" or "Sorted descending. Sort
// ascending" depending on the live sortDirection - to know which direction is
// actually active right now, rather than assuming it carried over from the previous
// click/field switch. That assumption (reasonable from reading Internal.setSortBy,
// which only ever touches sortBy) turned out not to hold in practice - this reads the
// real state instead of predicting it.
function assertSortedBy(ascendingUuids) {
  cy.getCy('listing_toolbar_sort-direction').invoke('attr', 'aria-label').then((label) => {
    assertOrder(label.startsWith('Sorted ascending') ? ascendingUuids : [...ascendingUuids].reverse())
  })
}

// Projects / browse / search - the one search box, a raw id (not cy.getField - it's
// a bare Ui.Field.input, no "form-" prefix). Narrows the listing to the one matching
// row, and clearing it restores every row.
export function searchProjectsListing({ alpha, beta, gamma }) {
  cy.visitApp('/projects')

  cy.get('#listing-search').type('Beta')
  cy.getCy(`listing-item_${beta.projectUuid}`).should('exist')
  cy.getCy(`listing-item_${alpha.projectUuid}`).should('not.exist')
  cy.getCy(`listing-item_${gamma.projectUuid}`).should('not.exist')

  cy.get('#listing-search').clear()
  cy.get('li[data-cy^="listing-item_"]').should('have.length', 3)
}

// Ascending order by the given field, read from each project's own real value (see
// fetchProjectTimestamps) rather than assumed from wall-clock guesses.
function byField(projects, field) {
  return [...projects].sort((a, b) => (a[field] < b[field] ? -1 : a[field] > b[field] ? 1 : 0)).map((project) => project.projectUuid)
}

// Projects / browse / sort - every option the sort dropdown actually offers
// (Common.Pages.Projects.Index's own sortOptions: "name"/"createdAt"/"updatedAt"),
// each direction. Explicitly selects "name" first rather than assuming it's already
// the page's own default on load (confirmed elsewhere this session that a listing's
// real default isn't always "name" ascending) - every field, including the first, is
// picked through the menu, never assumed. Each step then checks the real, live
// direction (assertSortedBy) rather than assuming it carried over from the previous
// click either, so six clicks exercise every (field, direction) combination
// regardless of what either one defaults to.
export function sortProjectsListing({ alpha, beta, gamma }) {
  const projects = [alpha, beta, gamma]
  const byName = byField(projects, 'name')
  const byCreatedAt = byField(projects, 'createdAt')
  const byUpdatedAt = byField(projects, 'updatedAt')

  cy.visitApp('/projects')

  // Select "name" explicitly.
  cy.openSortMenu()
  cy.getCy('listing_toolbar_sort_name').click()
  assertSortedBy(byName)

  // Flip direction.
  cy.getCy('listing_toolbar_sort-direction').click()
  assertSortedBy(byName)

  // Switch to "Created".
  cy.openSortMenu()
  cy.getCy('listing_toolbar_sort_createdAt').click()
  assertSortedBy(byCreatedAt)

  // Flip direction.
  cy.getCy('listing_toolbar_sort-direction').click()
  assertSortedBy(byCreatedAt)

  // Switch to "Updated". Beta was edited after all three projects were created, so
  // its own updatedAt is no longer tied to its creation order the way Alpha's and
  // Gamma's still are - proving the sort actually switched fields rather than
  // happening to agree with "createdAt" by coincidence.
  cy.openSortMenu()
  cy.getCy('listing_toolbar_sort_updatedAt').click()
  assertSortedBy(byUpdatedAt)

  // Flip direction.
  cy.getCy('listing_toolbar_sort-direction').click()
  assertSortedBy(byUpdatedAt)
}
