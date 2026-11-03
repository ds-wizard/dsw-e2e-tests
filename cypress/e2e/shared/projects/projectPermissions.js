// Projects / permission matrix - the org-wide (workspace-scoped) projects.view/
// comment/edit/manage permissions, each checked against a project owned by somebody
// else, with no individual/group share of its own - see projectShare.js for the
// per-project share-level permissions instead. Mirrors legacy's roles.spec.js "View/
// Comment/Edit/Manage ALL Projects".
//
// One permission set, one it() each (PERMISSION_LEVELS.forEach in the wrapper specs) -
// a failure names the exact permission set that broke, rather than being buried in one
// long test covering all of them. The project itself is created once in a before()/
// deleted once in an after(), shared by every level's own it() - server-side state
// (the project, its owner) survives Cypress's test-isolation reset between its, which
// wipes browser-side state (the login session) only, so each level still does its own
// cy.loginAs.
//
// Permission Probe, same as navByPerm specs - cy.setPermissionProbePermissions fully
// replaces the role's permissions each time, so reusing it here is safe as long as
// every level resets it to [] first (never relying on a previous level's own grant, so
// these run correctly in any order) and the last one leaves it that way for whoever
// else uses the persona next.
//
// Data Steward creates and owns the project; basic-km.json's single question doubles
// as both the answer-editability check and the comment-action check.
//
// Also checks editor notes (the Comments panel's "private" tab, Common.Components.
// Questionnaire.Panel.Comments) - a second kind of thread only an editor can see or
// start, gated by projects.edit rather than projects.comment, same as answer
// editability. #questionnaire-comments-tab-private is a plain id (Ui.Tabs.
// tabElementId), not a data-cy; clicking it and checking its own aria-selected proves
// it actually switches the panel, not just that a same-shaped button exists.
//
// Settings and Migrate are both owner-only now (Feature.projectDelete/
// projectCreateMigration, both ProjectUtils.isOwner - projects.manage makes every
// project's owner-equivalent org-wide). Migrate is checked both ways it's reached: the
// listing's own dropdown action, and the create-migration route opened directly by its
// URL, which the same permission guards server-round-trip-independently of the
// dropdown ever rendering (Common.Pages.Projects.CreateMigration's own GotProject
// handler, UpdateConfig.notAllowed when Feature.projectCreateMigration is false).
import { waitForSave } from '../km-editor/editor/kmEditorAddEntities'

const questionPath = 'fa34a580-6485-4b0d-8167-927c921c461b.2a98fa12-a2dd-4f7b-9546-c0065bbbfa95'

export const PERMISSION_LEVELS = [
  { name: 'no permissions', permissions: [], visible: false },
  { name: 'projects.view', permissions: ['projects.view'], visible: true, disabled: true, comment: false, editorNotes: false, settings: false, canMigrate: false },
  { name: 'projects.view + projects.comment', permissions: ['projects.view', 'projects.comment'], visible: true, disabled: true, comment: true, editorNotes: false, settings: false, canMigrate: false },
  { name: 'projects.view + projects.comment + projects.edit', permissions: ['projects.view', 'projects.comment', 'projects.edit'], visible: true, disabled: false, comment: true, editorNotes: true, settings: false, canMigrate: false },
  { name: 'projects.view + projects.comment + projects.edit + projects.manage', permissions: ['projects.view', 'projects.comment', 'projects.edit', 'projects.manage'], visible: true, disabled: false, comment: true, editorNotes: true, settings: true, canMigrate: true }
]

// Resolves to the project's uuid.
export function setUpPermissionMatrixProject() {
  cy.fixture('shared/basic-km.json').then((fixture) => cy.cleanupKnowledgeModelPackage(fixture.id))

  cy.loginAs('dataSteward')
  return cy.importKM('shared/basic-km.json').then((kmPackage) => {
    const projectName = `Test Permissions Project ${Date.now()}`

    cy.visitApp('/projects/create')
    cy.getField('name').type(projectName)
    cy.getField('knowledgeModelPackageUuid').click()
    cy.focused().type('Basic KM')
    cy.getCy(`form-knowledgeModelPackageUuid_option_${kmPackage.uuid}`).click()
    cy.getCy('form-submit').click()

    return cy.url()
      .should('match', /\/projects\/[0-9a-f-]{36}/).waitForPageFocus()
      .then((url) => url.match(/\/projects\/([0-9a-f-]{36})/)[1])
  })
}

// Beyond showing/hiding, this does the thing each one actually unlocks - typing a
// real answer, posting a real comment/editor note, saving a real settings change -
// and confirms it stuck after a reload, not just that the control was clickable a
// moment before the server could have rejected it.
export function checkPermissionLevel(projectUuid, level) {
  cy.setPermissionProbePermissions(level.permissions)
  cy.logout()
  cy.loginAs('permissionProbe')
  cy.visitApp('/projects')
  cy.getCy(`listing-item_${projectUuid}`).should(level.visible ? 'exist' : 'not.exist')

  if (!level.visible) {
    return
  }

  cy.visitApp(`/projects/${projectUuid}`)
  cy.getQuestionnaireField(questionPath).should(level.disabled ? 'be.disabled' : 'not.be.disabled')
  if (!level.disabled) {
    const answer = `Edited as ${level.name} ${Date.now()}`
    cy.getQuestionnaireField(questionPath).clear().type(answer).blur()
    waitForSave()
    cy.reload()
    cy.getQuestionnaireField(questionPath).should('have.value', answer)
  }

  cy.getCy('questionnaire_question-action_comment').should(level.comment ? 'exist' : 'not.exist')
  if (level.comment) {
    cy.getCy('questionnaire_question-action_comment').click()

    const commentText = `Comment as ${level.name} ${Date.now()}`
    cy.get(`[id="comment-${questionPath}-new"]`).clear().type(commentText)
    cy.getCy('comments_new-thread_submit').click()
    cy.get('#questionnaire-comments-panel').should('contain.text', commentText)

    cy.get('#questionnaire-comments-tab-private').should(level.editorNotes ? 'exist' : 'not.exist')
    if (level.editorNotes) {
      cy.get('#questionnaire-comments-tab-private').click().should('have.attr', 'aria-selected', 'true')

      const noteText = `Editor note as ${level.name} ${Date.now()}`
      cy.get(`[id="comment-${questionPath}-new"]`).clear().type(noteText)
      cy.getCy('comments_new-thread_submit').click()
      cy.get('#questionnaire-comments-panel').should('contain.text', noteText)
    }
  }

  cy.getCy('project_nav_settings').should(level.settings ? 'exist' : 'not.exist')
  if (level.settings) {
    cy.visitApp(`/projects/${projectUuid}/settings`)
    const description = `Updated as ${level.name} ${Date.now()}`
    cy.getField('description').clear().type(description)
    // getPageFormTestId, not getCy - ShareModal's own always-mounted "form-submit"
    // (see cypress/support/commands.js) would otherwise also match.
    cy.getPageFormTestId('form-submit').click()
    // cy.reload() right after can race the save PUT still in flight (same as
    // projectSettings.js's own editProjectSettings) - wait for the save to actually
    // land first, or the reload can read back the description from before this edit.
    cy.getCy('form-unsaved').should('have.attr', 'hidden')
    cy.reload()
    cy.getField('description').should('have.value', description)
  }

  cy.visitApp('/projects')
  if (level.canMigrate) {
    cy.openListingItemActions(projectUuid, 'listing-item_action_create-migration')
  } else {
    cy.openListingItemActions(projectUuid)
  }
  cy.getCy('listing-item_action_create-migration').should(level.canMigrate ? 'exist' : 'not.exist')

  cy.visitApp(`/projects/create-migration/${projectUuid}`)
  if (level.canMigrate) {
    cy.contains('Migrate Project').should('exist')
  } else {
    cy.contains("You don't have permission to view this page.").should('exist')
  }
}

export function tearDownPermissionMatrixProject(projectUuid) {
  // Left as it started (empty) - Permission Probe is shared by both this spec's own
  // reruns and anything else that might use the persona later.
  cy.setPermissionProbePermissions([])

  // after() still runs even when before() itself failed before resolving this - skip
  // rather than DELETE /projects/undefined, which would only mask whatever before()
  // actually failed on with an unrelated 400.
  if (!projectUuid) {
    return
  }

  cy.apiToken().then((token) => {
    cy.request({
      method: 'DELETE',
      url: `${Cypress.expose('apiUrl')}/projects/${projectUuid}`,
      headers: { Authorization: `Bearer ${token}` }
    })
  })
}
