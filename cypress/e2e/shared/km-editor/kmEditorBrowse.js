// KM Editor listing / browse (route /knowledge-models/editors) - search and sort.
// Separate from kmEditorCreate.js, which only ever has one editor in the listing.
//
// Wipes every KM editor in the workspace first, not just a fixed id/name of its own -
// cy.cleanupKmMigrationTestData()'s own comment already documents why: editors from
// every other KM-editor-touching spec in the suite (there are many) pile up in this
// same listing across runs with nothing prefix- or id-scoped about them, and assertOrder
// below needs the row count to be exactly three. Safe to run before any spec in this
// suite starts, like that command's own callers do - nothing else is still relying on
// a previously-created editor by the time a later spec's before() runs (Cypress runs
// specs sequentially, never two at once). Fixed ids/names (not Date.now()-uniqued,
// unlike most of this suite's other fixtures) only remain for readability now, not
// because anything still depends on them being stable across runs.
//
// Created in reverse alphabetical order (Gamma, then Beta, then Alpha), so name order
// and creation order differ - no fixture/API shortcut exists for KM editors in this
// suite (unlike Knowledge Models/Document Templates' own importKM/importTemplate), so
// this goes through the same create form kmEditorCreate.js uses.
//
// "Beta" is also the one edited afterwards (its Settings tab's description, saved and
// confirmed persisted via "form-unsaved" going hidden - the same save race fixed
// elsewhere this session) so its own "updatedAt" becomes the most recent of the
// three, distinct from both the name and createdAt orders - proving the sort actually
// switched fields rather than happening to agree with "createdAt" by coincidence.
//
// Set up once (before()) and shared by both the search and sort tests below - cleanup
// is API-direct by uuid (DELETE /knowledge-model-editors/:uuid), safe to call
// repeatedly.
const alphaEditorId = 'test.alpha-km-editor'
const betaEditorId = 'test.beta-km-editor'
const gammaEditorId = 'test.gamma-km-editor'

function clearLeftoverEditors() {
  return cy.getWorkspaceUuid().then((workspaceUuid) => {
    return cy.task('db:delete', { table: 'knowledge_model_editor', where: { workspace_uuid: workspaceUuid } })
  })
}

function createKmEditor(name, id) {
  cy.visitApp('/knowledge-models/editors/create')
  cy.getField('name').type(name)
  cy.getField('id').clear().type(id)
  cy.getField('versionMajor').clear().type('1')
  cy.getField('versionMinor').clear().type('0')
  cy.getField('versionPatch').clear().type('0')
  cy.getCy('form-submit').click()

  return cy.url()
    .should('match', /\/knowledge-models\/editors\/[0-9a-f-]{36}$/)
    .then((url) => ({ uuid: url.split('/').pop() }))
}

// Returns its own last cy command - callers must chain off it (not fire-and-forget),
// or whatever they return afterward races this save, the exact "mixing async and
// sync code" shape already fixed elsewhere this session.
function editKmEditorDescription(uuid, description) {
  cy.visitApp(`/knowledge-models/editors/${uuid}/settings`)
  cy.getField('description').clear().type(description)
  // license and readme are required to save the settings form at all (not just to
  // publish) - never set by the create form, so a freshly-created editor's Settings
  // tab won't save without filling them in here too.
  cy.getField('license').type('MIT')
  cy.getCy('markdown-editor_mode-markdown').click()
  cy.getField('readme').type('# Readme')
  cy.getCy('form-submit').click()
  // Same race as projectSettings.js's own Settings-tab saves - wait for the save to
  // actually land before anything that depends on this editor's updatedAt having
  // moved.
  return cy.getCy('form-unsaved').should('have.attr', 'hidden')
}

// Reads back each editor's own real createdAt/updatedAt rather than trusting this
// script's guess at the wall-clock order its own UI-driven creates and the Settings
// save landed in - timestamps come from the server, not from assuming how long each
// step took. GET /knowledge-model-editors (list, not detail) already carries both
// fields per row, so one request covers all three.
function fetchEditorTimestamps(token, workspaceUuid, editors) {
  return cy.request({
    method: 'GET',
    url: `${Cypress.expose('apiUrl')}/knowledge-model-editors?w=${workspaceUuid}&size=100`,
    headers: { Authorization: `Bearer ${token}` }
  }).then(({ body }) => {
    const byUuid = {}
    body._embedded.knowledgeModelEditors.forEach((editor) => {
      byUuid[editor.uuid] = editor
    })
    const withTimestamps = {}
    Object.entries(editors).forEach(([key, editor]) => {
      const fetched = byUuid[editor.uuid]
      withTimestamps[key] = { ...editor, name: fetched.name, createdAt: fetched.createdAt, updatedAt: fetched.updatedAt }
    })
    return withTimestamps
  })
}

export function setUpKmEditorBrowse() {
  return clearLeftoverEditors().then(() => {
    return createKmEditor('Gamma Editor', gammaEditorId).then((gamma) => {
      return createKmEditor('Beta Editor', betaEditorId).then((beta) => {
        return createKmEditor('Alpha Editor', alphaEditorId).then((alpha) => {
          return editKmEditorDescription(beta.uuid, 'Edited after all three editors were created.').then(() => {
            return cy.apiToken().then((token) => {
              return cy.getWorkspaceUuid().then((workspaceUuid) => {
                return fetchEditorTimestamps(token, workspaceUuid, { alpha, beta, gamma })
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
export function tearDownKmEditorBrowse(editors) {
  if (!editors) {
    return
  }

  const { alpha, beta, gamma } = editors

  cy.apiToken().then((token) => {
    const toDelete = [alpha, beta, gamma]
    toDelete.forEach(({ uuid }) => {
      cy.request({
        method: 'DELETE',
        url: `${Cypress.expose('apiUrl')}/knowledge-model-editors/${uuid}`,
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
// click/field switch. That assumption (reasonable from reading Internal.setSortBy,
// which only ever touches sortBy) turned out not to hold in practice - this reads the
// real state instead of predicting it.
function assertSortedBy(ascendingUuids) {
  cy.getCy('listing_toolbar_sort-direction').invoke('attr', 'aria-label').then((label) => {
    assertOrder(label.startsWith('Sorted ascending') ? ascendingUuids : [...ascendingUuids].reverse())
  })
}

// KM Editor / browse / search - the one search box, a raw id (not cy.getField - it's
// a bare Ui.Field.input, no "form-" prefix). Narrows the listing to the one matching
// row, and clearing it restores every row.
export function searchKmEditorListing({ alpha, beta, gamma }) {
  cy.visitApp('/knowledge-models/editors')

  cy.get('#listing-search').type('Beta')
  cy.getCy(`listing-item_${beta.uuid}`).should('exist')
  cy.getCy(`listing-item_${alpha.uuid}`).should('not.exist')
  cy.getCy(`listing-item_${gamma.uuid}`).should('not.exist')

  cy.get('#listing-search').clear()
  cy.get('li[data-cy^="listing-item_"]').should('have.length', 3)
}

// Ascending order by the given field, read from each editor's own real value (see
// fetchEditorTimestamps) rather than assumed from wall-clock guesses.
function byField(editors, field) {
  return [...editors].sort((a, b) => (a[field] < b[field] ? -1 : a[field] > b[field] ? 1 : 0)).map((editor) => editor.uuid)
}

// KM Editor / browse / sort - every option the sort dropdown actually offers
// (Common.Pages.KMEditor.Index's own sortOptions: "name"/"createdAt"/"updatedAt"),
// each direction. Explicitly selects "name" first rather than assuming it's already
// the page's own default on load (it turned out not to be - confirmed the hard way)
// - every field, including the first, is picked through the menu, never assumed.
// Each step then checks the real, live direction (assertSortedBy) rather than
// assuming it carried over from the previous click either, so six clicks exercise
// every (field, direction) combination regardless of what either one defaults to.
export function sortKmEditorListing({ alpha, beta, gamma }) {
  const editors = [alpha, beta, gamma]
  const byName = byField(editors, 'name')
  const byCreatedAt = byField(editors, 'createdAt')
  const byUpdatedAt = byField(editors, 'updatedAt')

  cy.visitApp('/knowledge-models/editors')

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

  // Switch to "Updated". Beta was edited after all three editors were created, so
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
