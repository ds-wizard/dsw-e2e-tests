// Projects / settings - name, description, the "isTemplate" toggle, and tags. Runs as
// Data Steward, not Researcher: marking a project as a template needs
// "projects.manageTemplates" on top of ownership, which only Data Steward has.
//
// The Settings tab's own Save button is this page's real "form-submit" (Common.
// Components.Form.unsavedBar's own Save, same testid as Ui.Button.submit's by design -
// see its doc comment), but Projects.Detail always mounts ShareModal alongside every
// tab (Modal.withForm, same default testid, closed but still in the DOM) - plain
// getCy('form-submit') matches both, so this uses getPageFormTestId instead.

function createProject(kmPackage, projectName) {
  cy.visitApp('/projects/create')
  cy.getField('name').type(projectName)
  cy.getField('knowledgeModelPackageUuid').click()
  cy.focused().type('Basic KM')
  cy.getCy(`form-knowledgeModelPackageUuid_option_${kmPackage.uuid}`).click()
  cy.getCy('form-submit').click()

  return cy.url()
    .should('match', /\/projects\/[0-9a-f-]{36}/).waitForPageFocus()
    .then((url) => ({ url, projectUuid: url.match(/\/projects\/([0-9a-f-]{36})/)[1] }))
}

function deleteProject(projectUuid, token) {
  cy.request({
    method: 'DELETE',
    url: `${Cypress.expose('apiUrl')}/projects/${projectUuid}`,
    headers: { Authorization: `Bearer ${token}` }
  })
}

// Deletes the project it created at the end.
export function editProjectSettings() {
  cy.fixture('shared/basic-km.json').then((fixture) => cy.cleanupKnowledgeModelPackage(fixture.id))

  cy.importKM('shared/basic-km.json').then((kmPackage) => {
    const projectName = `Test Settings Project ${Date.now()}`
    const updatedName = `${projectName} (updated)`
    const description = 'A project created to exercise the Settings tab.'

    createProject(kmPackage, projectName).then(({ url, projectUuid }) => {
      cy.visit(`${url}/settings`)

      cy.getField('name').clear().type(updatedName)
      cy.getField('description').clear().type(description)
      cy.get('#form-isTemplate').click()
      cy.getPageFormTestId('form-submit').click()
      // Clicking Save doesn't itself block navigation while the PUT is in flight -
      // cy.reload() right after can race it and lose the edit (flaky under CI's
      // slower round-trip, not locally). The "form-unsaved" bar stays visible until
      // the save actually succeeds, so that's the signal to wait on first.
      cy.getCy('form-unsaved').should('have.attr', 'hidden')

      cy.reload()
      cy.getField('name').should('have.value', updatedName)
      cy.getField('description').should('have.value', description)
      cy.get('#form-isTemplate').should('be.checked')

      cy.apiToken().then((token) => deleteProject(projectUuid, token))
    })
  })
}

function addProjectTag(url, tag) {
  cy.visit(`${url}/settings`)
  // Enter adds the tag to the form (Ui.TagInput's own onEnter) - but tags are part of
  // the same Settings form as name/description/isTemplate, not autosaved over the websocket, so
  // they're only persisted once Save is actually clicked (same getPageFormTestId
  // reason as editProjectSettings).
  cy.getField('projectTags').type(`${tag}{enter}`)
  cy.getCy(`form-projectTags_tag_${tag}`).should('exist')
  cy.getPageFormTestId('form-submit').click()
  // Same race as editProjectSettings's own cy.reload() - this function's own callers
  // immediately navigate elsewhere (the next project's settings, or the listing), so
  // the tag's save has to actually land first or the listing's tag filter below never
  // sees it.
  cy.getCy('form-unsaved').should('have.attr', 'hidden')
}

// Picking a found suggestion leaves the listing filter's menu open (it's multi-select,
// SearchToggled closes no menu) - clicks the trigger itself first, so this only works
// from closed, which clearTagFilter below leaves it in.
function selectTagFilter(tag) {
  cy.get('#listing-filter-projectTags-trigger').click()
  cy.get('#listing-filter-projectTags').within(() => {
    cy.get('#listing-filter-projectTags-search').type(tag)
    cy.getCy(`listing-filter-projectTags_option_${tag}`).click()
  })
}

// "Clear filter" is the one action in this menu that also closes it (FiltersChanged's
// own closeMenuId, unlike SearchToggled's), so the next selectTagFilter's trigger click
// reliably opens a fresh menu rather than toggling an already-open one shut.
function clearTagFilter() {
  cy.getCy('listing-filter-projectTags_clear').click()
}

// Projects / settings / tags - a tag added in Settings shows up as a listing filter
// (once it's actually saved - see addProjectTag/selectTagFilter above), and filtering
// by one tag finds the project that has it, not the other project's own different one.
//
// Creates two projects, each with its own tag, and deletes both at the end.
export function tagProjectAndFilterByTag() {
  cy.fixture('shared/basic-km.json').then((fixture) => cy.cleanupKnowledgeModelPackage(fixture.id))

  cy.importKM('shared/basic-km.json').then((kmPackage) => {
    const tagA = `e2e-tag-a-${Date.now()}`
    const tagB = `e2e-tag-b-${Date.now()}`
    const projectAName = `Tagged Settings Project A ${Date.now()}`
    const projectBName = `Tagged Settings Project B ${Date.now()}`

    createProject(kmPackage, projectAName).then((projectA) => {
      createProject(kmPackage, projectBName).then((projectB) => {
        addProjectTag(projectA.url, tagA)
        addProjectTag(projectB.url, tagB)

        // A fresh navigation, not an SPA route change - the listing's own tags filter
        // only shows itself once its first, empty-query suggestions search finds at
        // least one tag (Common.Components.Listing's own searchFilterAvailable),
        // which has to run after both tags above are actually saved, not before.
        cy.visitApp('/projects')

        selectTagFilter(tagA)
        cy.getCy(`listing-item_${projectA.projectUuid}`).should('exist')
        cy.getCy(`listing-item_${projectB.projectUuid}`).should('not.exist')

        clearTagFilter()
        selectTagFilter(tagB)
        cy.getCy(`listing-item_${projectB.projectUuid}`).should('exist')
        cy.getCy(`listing-item_${projectA.projectUuid}`).should('not.exist')

        cy.apiToken().then((token) => {
          deleteProject(projectA.projectUuid, token)
          deleteProject(projectB.projectUuid, token)
        })
      })
    })
  })
}
