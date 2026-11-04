// Administration / Users / browse (route /users, tenant-wide, admin only) - search
// and sort across every sort option the page offers: firstName, lastName, email,
// createdAt, updatedAt, lastVisitedAt.
//
// Three users created directly via POST /users.
//
// Unlike every other browse test in this suite, Users is tenant-wide and always
// has real accounts in it already (the login personas) - no "fresh empty
// workspace" to assume, so this can't wipe the table or assert an exact total row
// count. Instead each of the three gets "Browsetest" baked into its own lastName
// (the search matches name-or-email) so that one search term narrows the listing
// to exactly these three, letting the sort assertions still check an exact length.
// Cleanup only removes leftovers from an aborted previous run of this test, by its
// own three fixed emails - never a broader wipe.
//
// Each field below gets its own distinct order (not simply each other's reverse)
// so switching fields really proves a different one took effect:
//   firstName     asc: Alpha, Beta, Gamma
//   lastName      asc: Gamma, Beta, Alpha
//   email         asc: Beta, Gamma, Alpha
//   createdAt     asc: Beta, Alpha, Gamma   (actual creation order)
//   updatedAt     asc: Alpha, Gamma, Beta   (Beta's affiliation is edited last)
//   lastVisitedAt asc: Gamma, Alpha, Beta   (set directly via a DB update - no
//                                            UI/API path to it short of a real
//                                            login)
const alphaEmail = '3-browsetest@example.com'
const betaEmail = '1-browsetest@example.com'
const gammaEmail = '2-browsetest@example.com'

// Any role works here - this test only sorts/searches by name/email/date fields,
// never by role, so it uses the tenant's default one (same as cy.createUser).
function getDefaultRoleUuid(token) {
  return cy.request({
    method: 'GET',
    url: `${Cypress.expose('apiUrl')}/settings/roles`,
    headers: { Authorization: `Bearer ${token}` }
  }).then(({ body }) => body.value.defaultRoleUuid)
}

function createUser(token, roleUuid, firstName, lastName, email) {
  return cy.request({
    method: 'POST',
    url: `${Cypress.expose('apiUrl')}/users`,
    headers: { Authorization: `Bearer ${token}` },
    body: { firstName, lastName, email, affiliation: null, roleUuid, password: `Passw0rd-${Date.now()}` }
  }).then(({ body }) => body)
}

function clearLeftoverUsers() {
  return cy.task('db:delete', { table: 'user_entity', where: { email: [alphaEmail, betaEmail, gammaEmail] } })
}

export function setUpAdministrationUsersBrowse() {
  return cy.apiToken().then((token) => {
    return clearLeftoverUsers().then(() => {
      return getDefaultRoleUuid(token).then((roleUuid) => {
        return createUser(token, roleUuid, 'Beta', 'Mid-Browsetest', betaEmail).then((beta) => {
          return createUser(token, roleUuid, 'Alpha', 'Omega-Browsetest', alphaEmail).then((alpha) => {
            return createUser(token, roleUuid, 'Gamma', 'Echo-Browsetest', gammaEmail).then((gamma) => {
              // Beta's own affiliation, edited last, bumps only its updatedAt.
              return cy.request({
                method: 'PUT',
                url: `${Cypress.expose('apiUrl')}/users/${beta.uuid}`,
                headers: { Authorization: `Bearer ${token}` },
                body: {
                  firstName: beta.firstName,
                  lastName: beta.lastName,
                  email: beta.email,
                  affiliation: 'Edited after all three users were created.',
                  roleUuid: beta.role.uuid,
                  active: beta.active
                }
              }).then(({ body: updatedBeta }) => {
                return cy.task('db:update', {
                  table: 'user_entity',
                  where: { uuid: gamma.uuid },
                  values: { last_visited_at: '2024-01-01T00:00:00Z' }
                }).then(() => cy.task('db:update', {
                  table: 'user_entity',
                  where: { uuid: alpha.uuid },
                  values: { last_visited_at: '2024-01-02T00:00:00Z' }
                })).then(() => cy.task('db:update', {
                  table: 'user_entity',
                  where: { uuid: updatedBeta.uuid },
                  values: { last_visited_at: '2024-01-03T00:00:00Z' }
                })).then(() => ({ alpha, beta: updatedBeta, gamma }))
              })
            })
          })
        })
      })
    })
  })
}

// Skip rather than crash on undefined - after() still runs even when before()
// itself failed before resolving this.
export function tearDownAdministrationUsersBrowse(usersResult) {
  if (!usersResult) {
    return
  }

  const { alpha, beta, gamma } = usersResult

  cy.apiToken().then((token) => {
    ;[alpha, beta, gamma].forEach(({ uuid }) => {
      cy.request({
        method: 'DELETE',
        url: `${Cypress.expose('apiUrl')}/users/${uuid}`,
        headers: { Authorization: `Bearer ${token}` }
      })
    })
  })
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

// Reads the sort-direction button's own accessible name to know which direction
// is actually active, rather than assuming it carried over from the previous
// click/field switch.
function assertSortedBy(ascendingUuids) {
  cy.getCy('listing_toolbar_sort-direction').invoke('attr', 'aria-label').then((label) => {
    assertOrder(label.startsWith('Sorted ascending') ? ascendingUuids : [...ascendingUuids].reverse())
  })
}

// The search box is a raw id (not cy.getField - no "form-" prefix). Checked by
// presence/absence of the three known uuids rather than an exact total length,
// since the tenant's own real accounts are always in this listing too.
export function searchAdministrationUsersListing({ alpha, beta, gamma }) {
  cy.visitApp('/users')

  cy.searchListing('Beta')
  cy.getCy(`listing-item_${beta.uuid}`).should('exist')
  cy.getCy(`listing-item_${alpha.uuid}`).should('not.exist')
  cy.getCy(`listing-item_${gamma.uuid}`).should('not.exist')

  cy.get('#listing-search').clear()
  cy.getCy(`listing-item_${alpha.uuid}`).should('exist')
  cy.getCy(`listing-item_${beta.uuid}`).should('exist')
  cy.getCy(`listing-item_${gamma.uuid}`).should('exist')
}

// Filters by the shared "Browsetest" marker throughout so the listing's real
// accounts don't throw off assertOrder's exact length check. Every field is
// picked through the menu, never assumed to be the default.
export function sortAdministrationUsersListing({ alpha, beta, gamma }) {
  const byFirstName = [alpha.uuid, beta.uuid, gamma.uuid]
  const byLastName = [gamma.uuid, beta.uuid, alpha.uuid]
  const byEmail = [beta.uuid, gamma.uuid, alpha.uuid]
  const byCreatedAt = [beta.uuid, alpha.uuid, gamma.uuid]
  const byUpdatedAt = [alpha.uuid, gamma.uuid, beta.uuid]
  const byLastVisitedAt = [gamma.uuid, alpha.uuid, beta.uuid]

  cy.visitApp('/users')
  cy.searchListing('Browsetest')

  cy.openSortMenu()
  cy.getCy('listing_toolbar_sort_firstName').click()
  assertSortedBy(byFirstName)

  cy.getCy('listing_toolbar_sort-direction').click()
  assertSortedBy(byFirstName)

  cy.openSortMenu()
  cy.getCy('listing_toolbar_sort_lastName').click()
  assertSortedBy(byLastName)

  cy.getCy('listing_toolbar_sort-direction').click()
  assertSortedBy(byLastName)

  cy.openSortMenu()
  cy.getCy('listing_toolbar_sort_email').click()
  assertSortedBy(byEmail)

  cy.getCy('listing_toolbar_sort-direction').click()
  assertSortedBy(byEmail)

  cy.openSortMenu()
  cy.getCy('listing_toolbar_sort_createdAt').click()
  assertSortedBy(byCreatedAt)

  cy.getCy('listing_toolbar_sort-direction').click()
  assertSortedBy(byCreatedAt)

  cy.openSortMenu()
  cy.getCy('listing_toolbar_sort_updatedAt').click()
  assertSortedBy(byUpdatedAt)

  cy.getCy('listing_toolbar_sort-direction').click()
  assertSortedBy(byUpdatedAt)

  cy.openSortMenu()
  cy.getCy('listing_toolbar_sort_lastVisitedAt').click()
  assertSortedBy(byLastVisitedAt)

  cy.getCy('listing_toolbar_sort-direction').click()
  assertSortedBy(byLastVisitedAt)
}
