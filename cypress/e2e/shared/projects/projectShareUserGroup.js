// Projects / share with a user group - the Share modal's group picker
// ("projectShareUserGroups", distinct from projectShare.js's individual-user
// "projectShareUsers") and its own listing, "share-user-groups_item_<uuid>" rather than
// "share-members_item_<uuid>". A permission granted to the group applies to every one
// of its members (Common.Data.ProjectUtils.hasPerm checks a member's own
// userGroupUuids against each permission row), in effect the next time a member loads
// the project - no separate propagation step to wait on.
//
// One level, one it() each (SHARE_LEVELS.forEach in the wrapper specs) - see
// projectShare.js's header for the full reasoning (a failure names the exact level
// that broke; the project/group/share are set up once in before()/torn down once in
// after(), but each level's own it() still sets its own target level and does its own
// cy.loginAs, since Cypress's test-isolation reset between its wipes the login session
// but not this server-side state).
//
// The group's one member is Permission Probe, not Data Steward - see projectShare.js's
// header for why: Data Steward's own org-wide projects.edit would make every level
// here look like "editable" regardless of what the group's own share actually grants.
// Permission Probe's permissions are reset to [] in before() and left that way in
// after(), same as projectShare.js/navByPerm.
//
// Checks the same four levels against the same things as projectShare.js (editable
// answer, comment action, editor notes, Settings nav, the listing's own Delete and
// Migrate actions, Migrate also checked by its own URL) - see that file's header for
// the full matrix.
//
// The group is provisioned directly via the API (POST /user-groups, PUT /user-groups/
// :uuid/memberships) rather than through the User Groups UI - userGroups.create is a
// permission Data Steward/Researcher both already have (see cypress.*.config.js), but
// driving that UI isn't this test's concern. The PUT fully replaces the membership
// list, which drops admin's own auto-added owner membership (Shared.Service.User.
// Group.UserGroupService.createDefaultOwnerMembership) - harmless, since the group is
// deleted by admin in after() regardless of its own membership in it.
import { waitForSave } from '../km-editor/editor/kmEditorAddEntities'

const questionPath = 'fa34a580-6485-4b0d-8167-927c921c461b.2a98fa12-a2dd-4f7b-9546-c0065bbbfa95'

export const SHARE_LEVELS = [
  { perm: 'Viewer', disabled: true, comment: false, editorNotes: false, settings: false, canDelete: false, canMigrate: false },
  { perm: 'Commenter', disabled: true, comment: true, editorNotes: false, settings: false, canDelete: false, canMigrate: false },
  { perm: 'Editor', disabled: false, comment: true, editorNotes: true, settings: false, canDelete: false, canMigrate: false },
  { perm: 'Owner', disabled: false, comment: true, editorNotes: true, settings: true, canDelete: true, canMigrate: true }
]

// Resolves to { projectUuid, groupUuid }. The row added here defaults to Viewer -
// each level's own it() still sets it explicitly through checkShareLevel, so this
// doesn't need to.
export function setUpSharedProject() {
  const groupName = `Test Share Group ${Date.now()}`

  cy.setPermissionProbePermissions([])
  cy.fixture('shared/basic-km.json').then((fixture) => cy.cleanupKnowledgeModelPackage(fixture.id))

  cy.loginAs('researcher')
  return cy.importKM('shared/basic-km.json').then((kmPackage) => {
    const projectName = `Test Group Share Project ${Date.now()}`

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

              return cy.request({
                method: 'POST',
                url: `${Cypress.expose('apiUrl')}/user-groups`,
                headers: { Authorization: `Bearer ${token}` },
                body: { name: groupName, description: null, private: false }
              }).then(({ body: group }) => {
                return cy.request({
                  method: 'PUT',
                  url: `${Cypress.expose('apiUrl')}/user-groups/${group.uuid}/memberships`,
                  headers: { Authorization: `Bearer ${token}` },
                  body: [{ userUuid: permissionProbe.uuid, mType: 'MemberUserGroupMembershipType' }]
                }).then(() => {
                  cy.getCy('project_detail_share-button').click()
                  cy.get('#projectShareUserGroups').click()
                  cy.focused().type(groupName)
                  cy.getCy(`projectShareUserGroups_option_${group.uuid}`).click()
                  cy.getCy(`share-user-groups_item_${group.uuid}`).should('exist')
                  cy.getCy('project-share').within(() => cy.getCy('form-submit').click())
                  // Not not.exist - ShareModal's own "ui-dialog" (Ui.Modal.
                  // withTestId "project-share") is always in the DOM, open or not -
                  // and chaining the final value off this .then(), not a bare
                  // return below it, since Cypress commands are async and a plain
                  // object returned straight after queuing them would resolve
                  // before they actually run.
                  return cy.getCy('project-share').should('not.have.attr', 'open')
                    .then(() => ({ projectUuid, groupUuid: group.uuid }))
                })
              })
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
export function checkShareLevel(projectUuid, groupUuid, level) {
  cy.loginAs('researcher')
  cy.visitApp(`/projects/${projectUuid}`)
  cy.getCy('project_detail_share-button').click()
  cy.getCy(`share-user-groups_item_${groupUuid}`).find('select').select(level.perm)
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

export function tearDownSharedProject(projectUuid, groupUuid) {
  // Left as it started (empty) - Permission Probe is shared by both this spec's own
  // reruns and anything else that might use the persona later.
  cy.setPermissionProbePermissions([])

  // after() still runs even when before() itself failed before resolving these - skip
  // whichever is missing rather than DELETE /.../undefined, which would only mask
  // whatever before() actually failed on with an unrelated 400.
  if (!projectUuid && !groupUuid) {
    return
  }

  cy.apiToken().then((token) => {
    if (projectUuid) {
      cy.request({
        method: 'DELETE',
        url: `${Cypress.expose('apiUrl')}/projects/${projectUuid}`,
        headers: { Authorization: `Bearer ${token}` }
      })
    }
    if (groupUuid) {
      cy.request({
        method: 'DELETE',
        url: `${Cypress.expose('apiUrl')}/user-groups/${groupUuid}`,
        headers: { Authorization: `Bearer ${token}` }
      })
    }
  })
}
