// User Groups listing / browse (route /user-groups) - search and sort. Separate from
// userGroupsCreate.js/userGroupsMembers.js, which only ever have one or two groups in
// the listing.
//
// Fixed names (not Date.now()-uniqued, kept for readability even though the wipe
// below no longer depends on it) created directly via POST /user-groups (same
// API-direct path projectShareUserGroup.js already established), in reverse
// alphabetical order (Gamma, then Beta, then Alpha) so name order and creation order
// differ.
//
// "Beta" is also the one edited afterwards (a direct PUT /user-groups/:uuid changing
// only its description) so its own "updatedAt" becomes the most recent of the three,
// distinct from the name order - proving the sort actually switched fields.
//
// Wipes every user group in the workspace first (direct cy.task('db:delete', ...) on
// user_group.workspace_uuid, the same way kmEditorBrowse.js wipes
// knowledge_model_editor). Any other spec's own leftover group in this workspace would otherwise
// push assertOrder's exact row count off, same problem as every other browse test
// this session.
//
// Set up once (before()) and shared by both the search and sort tests below -
// cleanup is API-direct by uuid (DELETE /user-groups/:uuid), safe to call repeatedly.
const alphaGroupName = 'Browse Test Alpha Group'
const betaGroupName = 'Browse Test Beta Group'
const gammaGroupName = 'Browse Test Gamma Group'

function createUserGroup(token, name) {
  return cy.request({
    method: 'POST',
    url: `${Cypress.expose('apiUrl')}/user-groups`,
    headers: { Authorization: `Bearer ${token}` },
    body: { name, description: null, private: false }
  }).then(({ body }) => body)
}

function clearLeftoverGroups(workspaceUuid) {
  return cy.task('db:delete', { table: 'user_group', where: { workspace_uuid: workspaceUuid } })
}

export function setUpUserGroupsBrowse() {
  return cy.apiToken().then((token) => {
    return cy.getWorkspaceUuid().then((workspaceUuid) => {
      return clearLeftoverGroups(workspaceUuid).then(() => {
        return createUserGroup(token, gammaGroupName).then((gamma) => {
          return createUserGroup(token, betaGroupName).then((beta) => {
            return createUserGroup(token, alphaGroupName).then((alpha) => {
              // Captures the PUT's own response, not the stale POST one, for
              // beta's updatedAt - see sortUserGroupsListing's own byField for why
              // this matters (read the real value, don't assume it).
              return cy.request({
                method: 'PUT',
                url: `${Cypress.expose('apiUrl')}/user-groups/${beta.uuid}`,
                headers: { Authorization: `Bearer ${token}` },
                body: { name: beta.name, description: 'Edited after all three groups were created.', private: false }
              }).then(({ body: updatedBeta }) => ({ alpha, beta: updatedBeta, gamma }))
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
export function tearDownUserGroupsBrowse(groupsResult) {
  if (!groupsResult) {
    return
  }

  const { alpha, beta, gamma } = groupsResult

  cy.apiToken().then((token) => {
    const groups = [alpha, beta, gamma]
    groups.forEach(({ uuid }) => {
      cy.request({
        method: 'DELETE',
        url: `${Cypress.expose('apiUrl')}/user-groups/${uuid}`,
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

// Reads the sort-direction button's own accessible name - Ui.Button.iconOnly sets
// aria-label to its label, and Common.Components.Listing.viewSort's own
// directionLabel is "Sorted ascending. Sort descending" or "Sorted descending. Sort
// ascending" depending on the live sortDirection - to know which direction is
// actually active right now, rather than assuming it carried over from the previous
// click/field switch (confirmed elsewhere this session not to be a safe assumption).
function assertSortedBy(ascendingUuids) {
  cy.getCy('listing_toolbar_sort-direction').invoke('attr', 'aria-label').then((label) => {
    assertOrder(label.startsWith('Sorted ascending') ? ascendingUuids : [...ascendingUuids].reverse())
  })
}

// Ascending order by the given field, read from each group's own real value (POST/PUT
// response, not assumed from wall-clock guesses).
function byField(groups, field) {
  return [...groups].sort((a, b) => (a[field] < b[field] ? -1 : a[field] > b[field] ? 1 : 0)).map((group) => group.uuid)
}

// User Groups / browse / search - the one search box, a raw id (not cy.getField -
// it's a bare Ui.Field.input, no "form-" prefix). Narrows the listing to the one
// matching row, and clearing it restores every row.
export function searchUserGroupsListing({ alpha, beta, gamma }) {
  cy.visitApp('/user-groups')

  cy.get('#listing-search').type('Beta')
  cy.getCy(`listing-item_${beta.uuid}`).should('exist')
  cy.getCy(`listing-item_${alpha.uuid}`).should('not.exist')
  cy.getCy(`listing-item_${gamma.uuid}`).should('not.exist')

  cy.get('#listing-search').clear()
  cy.get('li[data-cy^="listing-item_"]').should('have.length', 3)
}

// User Groups / browse / sort - every option the sort dropdown actually offers
// (Common.Pages.UserGroups.Index's own sortOptions: "name"/"updatedAt"), each
// direction. Explicitly selects "name" first rather than assuming it's already the
// page's own default on load (confirmed elsewhere this session that a listing's real
// default isn't always "name" ascending) - every field, including the first, is
// picked through the menu, never assumed. Each step then checks the real, live
// direction (assertSortedBy) rather than assuming it carried over from the previous
// click either, so four clicks exercise every (field, direction) combination
// regardless of what either one defaults to.
export function sortUserGroupsListing({ alpha, beta, gamma }) {
  const groups = [alpha, beta, gamma]
  const byName = byField(groups, 'name')
  const byUpdatedAt = byField(groups, 'updatedAt')

  cy.visitApp('/user-groups')

  // Select "name" explicitly.
  cy.openSortMenu()
  cy.getCy('listing_toolbar_sort_name').click()
  assertSortedBy(byName)

  // Flip direction.
  cy.getCy('listing_toolbar_sort-direction').click()
  assertSortedBy(byName)

  // Switch to "Updated". Beta was edited after all three groups were created, so its
  // own updatedAt is no longer tied to its creation order the way Alpha's and
  // Gamma's still are - proving the sort actually switched fields rather than
  // happening to agree with "name" by coincidence.
  cy.openSortMenu()
  cy.getCy('listing_toolbar_sort_updatedAt').click()
  assertSortedBy(byUpdatedAt)

  // Flip direction.
  cy.getCy('listing_toolbar_sort-direction').click()
  assertSortedBy(byUpdatedAt)
}
