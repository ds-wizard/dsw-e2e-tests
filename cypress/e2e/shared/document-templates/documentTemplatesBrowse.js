// Document Templates library / browse (route /document-templates). Logs in as Data
// Steward, not Researcher: Researcher can list templates too, but never reaches this
// page from the menu (it's used for picking a template while generating a project's
// documents, not a destination of its own).
//
// Imports three metadata-only fixtures (no formats/files/assets - nothing here tests
// rendering) to give the listing rows to sort and search. Their "createdAt" is
// deliberately out of name order (Beta oldest, Gamma middle, Alpha newest - the
// bundle's own "createdAt" is stored verbatim, not server-generated) so sorting by
// "Created" produces a different, checkable order than the default name sort.
//
// Wipes every document template in the workspace first (cy.cleanupAllDocumentTemplates
// - same reasoning as knowledgeModelsBrowse.js's own cy.cleanupAllKnowledgeModelPackages:
// cleaning only these three fixed ids does nothing about any other spec's own
// leftover templates in this workspace, which can push assertOrder's exact row count
// off).
//
// Set up once (before()) and shared by both the search and sort tests below - the
// three fixed ids below are still used for the imports themselves and the wrapper
// spec's own after(), just not relied on alone for the pre-run cleanup anymore.
export const alphaTemplateId = 'test.alpha-template'
export const betaTemplateId = 'test.beta-template'
export const gammaTemplateId = 'test.gamma-template'

export function setUpDocumentTemplatesBrowse() {
  return cy.cleanupAllDocumentTemplates().then(() => {
    return cy.importTemplate('templates/alpha-template.zip').then((alpha) => {
      return cy.importTemplate('templates/beta-template.zip').then((beta) => {
        return cy.importTemplate('templates/gamma-template.zip').then((gamma) => ({ alpha, beta, gamma }))
      })
    })
  })
}

export function tearDownDocumentTemplatesBrowse() {
  cy.cleanupDocumentTemplate(alphaTemplateId)
  cy.cleanupDocumentTemplate(betaTemplateId)
  cy.cleanupDocumentTemplate(gammaTemplateId)
}

// li, not just [data-cy^="listing-item_"]: a row's own badges (e.g.
// listing-item_badge_version) share that same prefix and would otherwise count as
// extra rows - only the row itself is an <li> (Ui.ListItem.toHtml).
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

// Document Templates / browse / search - the one search box, a raw id (not
// cy.getField - it's a bare Ui.Field.input, no "form-" prefix). Narrows the listing to
// the one matching row, and clearing it restores every row.
export function searchDocumentTemplatesLibrary({ alpha, beta, gamma }) {
  cy.visitApp('/document-templates')

  cy.searchListing('Beta')
  cy.getCy(`listing-item_${beta.uuid}`).should('exist')
  cy.getCy(`listing-item_${alpha.uuid}`).should('not.exist')
  cy.getCy(`listing-item_${gamma.uuid}`).should('not.exist')

  cy.get('#listing-search').clear()
  cy.get('li[data-cy^="listing-item_"]').should('have.length', 3)
}

// Document Templates / browse / sort - every option the sort dropdown actually offers
// (Common.Pages.DocumentTemplates.Index's own sortOptions: "name"/"createdAt"), each
// direction. Explicitly selects "name" first rather than assuming it's already the
// page's own default on load (confirmed elsewhere this session that a listing's real
// default isn't always "name" ascending) - every field, including the first, is
// picked through the menu, never assumed. Each step then checks the real, live
// direction (assertSortedBy) rather than assuming it carried over from the previous
// click either, so four clicks exercise every (field, direction) combination
// regardless of what either one defaults to.
export function sortDocumentTemplatesLibrary({ alpha, beta, gamma }) {
  const byName = [alpha.uuid, beta.uuid, gamma.uuid]
  // Beta oldest, Gamma middle, Alpha newest - see this file's own header comment.
  const byCreatedAt = [beta.uuid, gamma.uuid, alpha.uuid]

  cy.visitApp('/document-templates')

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
