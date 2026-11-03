// Projects / share - the owner-only Share modal. The user picker is a raw, unprefixed
// id ("projectShareUsers"), not cy.getField - but each share row's permission level IS
// a real form field ("permissions.<index>.perms", a plain <select>, options "Viewer"/
// "Commenter"/"Editor"/"Owner" - ShareModal.elm's MemberPerms.formOptions), defaulting
// to "Viewer" for a newly added row. Found by `.find('select')` within the row's own
// `share-members_item_<uuid>` instead of addressing permissions.<index>.perms directly,
// since the project's own owner already occupies index 0 in that same list.
//
// One level, one it() each (SHARE_LEVELS.forEach in the wrapper specs) - a failure
// names the exact level that broke, rather than being buried in one long test covering
// all four. The project and the share itself are created once in a before()/deleted
// once in an after(), shared by every level's own it(); each it() still sets its own
// target level before checking (never assuming a previous it() left it at the right
// one), so these run correctly in any order. Server-side state (the project, the
// share row) survives Cypress's test-isolation reset between its, which wipes
// browser-side state (the login session) only - so each level still does its own
// cy.loginAs for both the owner side (setting the level) and Permission Probe's side
// (checking it).
//
// Shares with Permission Probe, not Data Steward/Researcher: both of those already
// hold an org-wide projects.* permission (Data Steward has projects.edit, Researcher
// projects.create - see dsw/scripts/create-users.js), and Common.Data.ProjectUtils.hasPerm
// unions a user's org-wide role permission with whatever a specific share grants them
// - so Data Steward would show "editable"/"can comment" on ANY project regardless of
// what this share actually sets, defeating the point of checking the share's own
// effect in isolation. Permission Probe starts with none of those (reset to [] in
// before() and left that way in after(), same as navByPerm/projectPermissions.js), so
// every feature it gains on this one project comes from the share alone.
//
// Each of the four levels is checked against the things Projects/permissions.js also
// uses for the equivalent org-wide grants (editable answer, comment action, editor
// notes, Settings nav - ProjectUtils.isEditor/canComment/isOwner), plus the listing's
// own Delete and Migrate actions (ProjectActions.elm/CreateMigration.elm,
// Feature.projectDelete/projectCreateMigration, both ProjectUtils.isOwner), which
// only "Owner" (the one level that sets the admin perm) turns on:
//   Viewer:    view only  - disabled, no comment, (no notes - no panel to open), no Settings, no Delete, no Migrate
//   Commenter: + comment  - disabled, comment,    no editor notes,                no Settings, no Delete, no Migrate
//   Editor:    + edit     - enabled,  comment,    editor notes,                   no Settings, no Delete, no Migrate
//   Owner:     + admin    - enabled,  comment,    editor notes,                   Settings,    Delete,    Migrate
// Editor notes (Common.Components.Questionnaire.Panel.Comments) are a second kind of
// thread only an editor can see or start, next to ordinary comments as a tab over the
// same panel (Feature.projectCommentPrivate = ProjectUtils.isEditor) - gated one level
// higher than the comment action itself, so Commenter opens the panel fine but never
// gets that second tab. #questionnaire-comments-tab-private is a plain id (Ui.Tabs.
// tabElementId), not a data-cy; clicking it and checking its own aria-selected proves
// it actually switches the panel, not just that a same-shaped button exists. Only
// checked once the comment action exists at all - Viewer has no button to open the
// panel with in the first place.
// Migrate is checked both ways it's reached: the listing's own dropdown action, and
// the create-migration route opened directly by its own URL, which the same
// permission guards server-round-trip-independently of the dropdown ever rendering
// (CreateMigration.elm's own GotProject handler, UpdateConfig.notAllowed when
// Feature.projectCreateMigration is false).
import { waitForSave } from '../km-editor/editor/kmEditorAddEntities'

const questionPath = 'fa34a580-6485-4b0d-8167-927c921c461b.2a98fa12-a2dd-4f7b-9546-c0065bbbfa95'

export const SHARE_LEVELS = [
  { perm: 'Viewer', disabled: true, comment: false, editorNotes: false, settings: false, canDelete: false, canMigrate: false },
  { perm: 'Commenter', disabled: true, comment: true, editorNotes: false, settings: false, canDelete: false, canMigrate: false },
  { perm: 'Editor', disabled: false, comment: true, editorNotes: true, settings: false, canDelete: false, canMigrate: false },
  { perm: 'Owner', disabled: false, comment: true, editorNotes: true, settings: true, canDelete: true, canMigrate: true }
]

// Resolves to { projectUuid, memberUuid }. The row added here defaults to Viewer -
// each level's own it() still sets it explicitly through checkShareLevel, so this
// doesn't need to.
export function setUpSharedProject() {
  cy.setPermissionProbePermissions([])
  cy.fixture('shared/basic-km.json').then((fixture) => cy.cleanupKnowledgeModelPackage(fixture.id))

  cy.loginAs('researcher')
  return cy.importKM('shared/basic-km.json').then((kmPackage) => {
    const projectName = `Test Share Project ${Date.now()}`

    cy.visitApp('/projects/create')
    cy.getField('name').type(projectName)
    cy.getField('knowledgeModelPackageUuid').click()
    cy.focused().type('Basic KM')
    cy.getCy(`form-knowledgeModelPackageUuid_option_${kmPackage.uuid}`).click()
    cy.getCy('form-submit').click()

    return cy.url()
      .should('match', /\/projects\/[0-9a-f-]{36}/).waitForPageFocus()
      .then((url) => {
        const projectUuid = url.match(/\/projects\/([0-9a-f-]{36})/)[1]

        return cy.env(['users']).then(({ users }) => {
          return cy.apiToken().then((token) => {
            return cy.request({
              method: 'GET',
              url: `${Cypress.expose('apiUrl')}/users?q=${encodeURIComponent(users.permissionProbe.email)}`,
              headers: { Authorization: `Bearer ${token}` }
            }).then(({ body }) => {
              const permissionProbe = body._embedded.users.find((candidate) => candidate.email === users.permissionProbe.email)
              expect(permissionProbe, 'the Permission Probe persona is found by its own email').to.exist

              cy.getCy('project_detail_share-button').click()
              cy.get('#projectShareUsers').click()
              cy.focused().type('Permission Probe')
              cy.getCy(`projectShareUsers_option_${permissionProbe.uuid}`).click()
              cy.getCy(`share-members_item_${permissionProbe.uuid}`).should('exist')
              cy.getCy('project-share').within(() => cy.getCy('form-submit').click())
              // Not not.exist - ShareModal's own "ui-dialog" (Ui.Modal.withTestId
              // "project-share") is always in the DOM, open or not - and chaining the
              // final value off this .then(), not a bare return below it, since
              // Cypress commands are async and a plain object returned straight after
              // queuing them would resolve before they actually run.
              return cy.getCy('project-share').should('not.have.attr', 'open')
                .then(() => ({ projectUuid, memberUuid: permissionProbe.uuid }))
            })
          })
        })
      })
  })
}

// Beyond showing/hiding, this does the thing each one actually unlocks - typing a
// real answer, posting a real comment/editor note, saving a real settings change -
// and confirms it stuck after a reload, not just that the control was clickable a
// moment before the server could have rejected it. Delete is the one exception: it
// stays an existence check only, deliberately not actually run - this project is
// shared by every level's own it() (setUpSharedProject's before()), and completing a
// real delete here would remove it out from under whichever other level's it() runs
// next.
export function checkShareLevel(projectUuid, memberUuid, level) {
  cy.loginAs('researcher')
  cy.visitApp(`/projects/${projectUuid}`)
  cy.getCy('project_detail_share-button').click()
  cy.getCy(`share-members_item_${memberUuid}`).find('select').select(level.perm)
  cy.getCy('project-share').within(() => cy.getCy('form-submit').click())
  cy.getCy('project-share').should('not.have.attr', 'open')

  cy.logout()
  cy.loginAs('permissionProbe')
  cy.visitApp(`/projects/${projectUuid}`)
  cy.getQuestionnaireField(questionPath).should(level.disabled ? 'be.disabled' : 'not.be.disabled')
  if (!level.disabled) {
    const answer = `Edited as ${level.perm} ${Date.now()}`
    cy.getQuestionnaireField(questionPath).clear().type(answer).blur()
    waitForSave()
    cy.reload()
    cy.getQuestionnaireField(questionPath).should('have.value', answer)
  }

  cy.getCy('questionnaire_question-action_comment').should(level.comment ? 'exist' : 'not.exist')
  if (level.comment) {
    cy.getCy('questionnaire_question-action_comment').click()

    const commentText = `Comment as ${level.perm} ${Date.now()}`
    cy.get(`[id="comment-${questionPath}-new"]`).clear().type(commentText)
    cy.getCy('comments_new-thread_submit').click()
    cy.get('#questionnaire-comments-panel').should('contain.text', commentText)

    cy.get('#questionnaire-comments-tab-private').should(level.editorNotes ? 'exist' : 'not.exist')
    if (level.editorNotes) {
      cy.get('#questionnaire-comments-tab-private').click().should('have.attr', 'aria-selected', 'true')

      const noteText = `Editor note as ${level.perm} ${Date.now()}`
      cy.get(`[id="comment-${questionPath}-new"]`).clear().type(noteText)
      cy.getCy('comments_new-thread_submit').click()
      cy.get('#questionnaire-comments-panel').should('contain.text', noteText)
    }
  }

  cy.getCy('project_nav_settings').should(level.settings ? 'exist' : 'not.exist')
  if (level.settings) {
    cy.visitApp(`/projects/${projectUuid}/settings`)
    const description = `Updated as ${level.perm} ${Date.now()}`
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
  // The 2-arg form retries the trigger click until the action shows up, needed when
  // expecting it to exist - the 1-arg form is a single click, fine for a negative
  // check but not enough to reliably catch the dropdown opening on the first try.
  if (level.canDelete) {
    cy.openListingItemActions(projectUuid, 'listing-item_action_delete')
  } else {
    cy.openListingItemActions(projectUuid)
  }
  cy.getCy('listing-item_action_delete').should(level.canDelete ? 'exist' : 'not.exist')

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

export function tearDownSharedProject(projectUuid) {
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
