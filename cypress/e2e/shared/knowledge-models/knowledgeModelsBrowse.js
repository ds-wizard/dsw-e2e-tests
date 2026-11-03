// Knowledge Models library / browse (route /knowledge-models) - search and sort,
// separate from knowledgeModelsPreview.js's own test, which checks something else
// entirely (that Preview actually renders a published KM's real content) with only
// one KM, not three rows to sort.
//
// Imports three minimal fixtures (cypress/fixtures/shared/{alpha,beta,gamma}-km.json -
// the same shape as shared/basic-km.json, just a different id/name/createdAt; nothing
// here checks their content) via cy.importKM, same fast API-direct path
// documentTemplatesBrowse.js uses for templates. Their "createdAt" is deliberately out
// of name order (Beta oldest, Gamma middle, Alpha newest - the bundle's own
// "createdAt" is stored verbatim, not server-generated, same as for document
// templates) so sorting by "Created" produces a different, checkable order than the
// default name sort.
//
// Wipes every KM package in the workspace first (cy.cleanupAllKnowledgeModelPackages,
// its own doc comment already covers exactly this: "a leftover package from an
// earlier failed run... can push this spec's own fresh row off the listing" - same
// problem as kmEditorBrowse.js's own cy.task('db:delete', ...) wipe, just reusing the
// command this one already had for it rather than cleaning by the three fixed ids
// alone, which does nothing about e.g. basic-km.json's package or any other test's
// own leftovers in this workspace).
//
// Set up once (before()) and shared by both the search and sort tests below.
export const alphaKmId = 'test.alpha-km'
export const betaKmId = 'test.beta-km'
export const gammaKmId = 'test.gamma-km'

export function setUpKnowledgeModelsBrowse() {
  return cy.cleanupAllKnowledgeModelPackages().then(() => {
    return cy.importKM('shared/alpha-km.json').then((alpha) => {
      return cy.importKM('shared/beta-km.json').then((beta) => {
        return cy.importKM('shared/gamma-km.json').then((gamma) => ({ alpha, beta, gamma }))
      })
    })
  })
}

export function tearDownKnowledgeModelsBrowse() {
  cy.cleanupKnowledgeModelPackage(alphaKmId)
  cy.cleanupKnowledgeModelPackage(betaKmId)
  cy.cleanupKnowledgeModelPackage(gammaKmId)
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

// Knowledge Models / browse / search - the one search box, a raw id (not
// cy.getField - it's a bare Ui.Field.input, no "form-" prefix). Narrows the listing to
// the one matching row, and clearing it restores every row.
export function searchKnowledgeModelsLibrary({ alpha, beta, gamma }) {
  cy.visitApp('/knowledge-models')

  cy.get('#listing-search').type('Beta')
  cy.getCy(`listing-item_${beta.uuid}`).should('exist')
  cy.getCy(`listing-item_${alpha.uuid}`).should('not.exist')
  cy.getCy(`listing-item_${gamma.uuid}`).should('not.exist')

  cy.get('#listing-search').clear()
  cy.get('li[data-cy^="listing-item_"]').should('have.length', 3)
}

// Knowledge Models / browse / sort - every option the sort dropdown actually offers
// (Common.Pages.KnowledgeModels.Index's own sortOptions: "name"/"createdAt"), each
// direction. Explicitly selects "name" first rather than assuming it's already the
// page's own default on load (confirmed elsewhere this session that a listing's real
// default isn't always "name" ascending) - every field, including the first, is
// picked through the menu, never assumed. Each step then checks the real, live
// direction (assertSortedBy) rather than assuming it carried over from the previous
// click either, so four clicks exercise every (field, direction) combination
// regardless of what either one defaults to - same shape as
// documentTemplatesBrowse.js's own sort test.
export function sortKnowledgeModelsLibrary({ alpha, beta, gamma }) {
  const byName = [alpha.uuid, beta.uuid, gamma.uuid]
  // Beta oldest, Gamma middle, Alpha newest - see this file's own header comment.
  const byCreatedAt = [beta.uuid, gamma.uuid, alpha.uuid]

  cy.visitApp('/knowledge-models')

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
}
