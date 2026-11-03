// Migration mechanics that don't depend on any particular entity kind - see
// kmEditorMigrationEntities.js for the per-entity conflict scenarios, and
// kmEditorMigrate.js for the plain end-to-end apply-all flow this builds on.
// The KM root's own uuid is generated per editor, not the editor's own uuid, so it
// has to be read back rather than assumed - true of a from-scratch editor as much as
// a forked one.
function getKnowledgeModelUuid(editorUuid) {
  return cy.apiToken().then((token) =>
    cy.request({
      method: 'GET',
      url: `${Cypress.expose('apiUrl')}/knowledge-model-editors/${editorUuid}`,
      headers: { Authorization: `Bearer ${token}` }
    }).then((response) => response.body.knowledgeModel.uuid)
  )
}

// Date.now() alone can collide between calls microseconds apart, and a KM id
// collision would merge two unrelated knowledge models into one "outdated" family.
function uniqueId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function createKmEditor() {
  const kmId = uniqueId('km')
  const kmName = `Test KM ${Date.now()}`

  cy.visitApp('/knowledge-models/editors/create')
  cy.getField('name').type(kmName)
  cy.getField('id').clear().type(kmId)
  cy.getField('versionMajor').clear().type('1')
  cy.getField('versionMinor').clear().type('0')
  cy.getField('versionPatch').clear().type('0')
  cy.getCy('form-submit').click()

  return cy.url()
    .should('match', /\/knowledge-models\/editors\/[0-9a-f-]{36}$/)
    .then((url) => url.split('/').pop())
}

function addChild(triggerId) {
  cy.get(`#${triggerId}`).click()
  return cy.url()
    .should('match', /\/edit\/[0-9a-f-]{36}$/)
    .then((url) => url.split('/').pop())
}

// Waits for the debounced autosave - a navigation right after typing can race it.
function type(uuid, field, value) {
  cy.get(`#km-editor-${uuid}-${field}`).type(value)
  waitForSave()
}

function waitForSave() {
  cy.wait(1200)
  cy.getCy('saving-indicator').should('not.have.attr', 'data-state', 'saving')
}

// Publishes from within the editor (settings tab, then its own Publish button/modal).
// "form-unsaved" only hides once the settings save actually lands,
// so wait on it before navigating away or the save can be aborted mid-flight.
function publish(editorUuid, [major, minor, patch]) {
  waitForSave()

  cy.visitApp(`/knowledge-models/editors/${editorUuid}/settings`)
  cy.getField('versionMajor').clear().type(String(major))
  cy.getField('versionMinor').clear().type(String(minor))
  cy.getField('versionPatch').clear().type(String(patch))
  cy.getField('license').type('MIT')
  cy.getField('description').type('Published by the KM Editor / migration mechanics E2E spec.')
  cy.getCy('markdown-editor_mode-markdown').click()
  cy.getField('readme').type('# Readme')
  cy.getCy('form-submit').click()
  cy.getCy('form-unsaved').should('have.attr', 'hidden')

  cy.visitApp(`/knowledge-models/editors/${editorUuid}`)
  cy.getCy('km-editor_publish').click()
  cy.getCy('km-editor_publish-modal_confirm').click()

  return cy.url()
    .should('match', /\/knowledge-models\/[0-9a-f-]{36}$/)
    .then((publishedUrl) => publishedUrl.split('/').pop())
}

// "Migration complete" links to a separate standalone "/publish" page, not the
// in-editor settings-tab flow `publish` above uses. Checking the migrated-in result
// should happen only after this publish, so it's verified against the editor's
// actual published data rather than just its live, unpublished state.
function publishAfterMigration(editorUuid, [major, minor, patch]) {
  cy.getCy('km-migration_publish').click()
  cy.url().should('match', new RegExp(`/knowledge-models/editors/${editorUuid}/publish$`))

  cy.getField('major').clear().type(String(major))
  cy.getField('minor').clear().type(String(minor))
  cy.getField('patch').clear().type(String(patch))
  cy.getField('description').type('Published after migration by the KM Editor / migration mechanics E2E spec.')
  cy.getCy('markdown-editor_mode-markdown').click()
  cy.getField('readme').type('# Readme')
  cy.getCy('km-publish_publish-button').click()

  return cy.url()
    .should('match', /\/knowledge-models\/[0-9a-f-]{36}$/)
    .then((publishedUrl) => publishedUrl.split('/').pop())
}

function forkIndependent(packageUuid) {
  cy.visitApp(`/knowledge-models/editors/create?selected=${packageUuid}`)
  cy.getField('name').type(`Test KM Fork ${Date.now()}`)
  cy.getField('id').clear().type(uniqueId('km-fork'))
  cy.getField('versionMajor').clear().type('1')
  cy.getField('versionMinor').clear().type('0')
  cy.getField('versionPatch').clear().type('0')
  cy.getCy('form-submit').click()

  return cy.url()
    .should('match', /\/knowledge-models\/editors\/[0-9a-f-]{36}$/)
    .then((url) => url.split('/').pop())
}

// "edit=true" pre-fills name/id/language from the parent package, but version is
// still required and starts empty.
function forkContinuation(packageUuid) {
  cy.visitApp(`/knowledge-models/editors/create?selected=${packageUuid}&edit=true`)
  cy.getField('versionMajor').type('1')
  cy.getField('versionMinor').type('0')
  cy.getField('versionPatch').type('0')
  cy.getCy('form-submit').click()

  return cy.url()
    .should('match', /\/knowledge-models\/editors\/[0-9a-f-]{36}$/)
    .then((url) => url.split('/').pop())
}

// Opens the update modal via the row's "update available" badge - containsUpdateOptionAndBadge
// is the one test that exercises the kebab's "Update" action instead.
function startMigration(migratingEditorUuid, targetPackageUuid) {
  cy.visitApp('/knowledge-models/editors')
  cy.getCy(`listing-item_${migratingEditorUuid}`).find('[data-cy="listing-item_badge_update-available"]').click()
  cy.getCy('km-editor-update').within(() => {
    cy.getField('targetPackageUuid').select(targetPackageUuid)
    cy.getCy('form-submit').click()
  })
  cy.url().should('match', new RegExp(`/knowledge-models/editors/${migratingEditorUuid}/migration$`))
}

function cleanupPackage(packageUuid) {
  cy.apiToken().then((token) => {
    cy.request({
      method: 'DELETE',
      url: `${Cypress.expose('apiUrl')}/knowledge-model-packages/${packageUuid}?allVersions=true`,
      headers: { Authorization: `Bearer ${token}` }
    })
  })
}

// Confirms the migrated-in chapters landed in the editor's own entity data, not just
// that "Migration complete" appeared.
function checkTopLevelChildrenExist(editorUuid, fieldName, titles) {
  cy.visitApp(`/knowledge-models/editors/${editorUuid}`)
  getKnowledgeModelUuid(editorUuid).then((rootUuid) => {
    const items = () => cy.get(`[data-cy^="km-editor-${rootUuid}-${fieldName}_item_"]`)
    titles.forEach((title) => items().contains(title).should('exist'))
  })
}

// The kebab's "update" action and the outdated badge both open the same modal.
export function containsUpdateOptionAndBadge() {
  createKmEditor().then((editorAUuid) => {
    publish(editorAUuid, [1, 0, 0]).then((packageAUuid) => {
      forkIndependent(packageAUuid).then((editorBUuid) => {
        forkContinuation(packageAUuid).then((editorCUuid) => {
          getKnowledgeModelUuid(editorCUuid).then((editorCKnowledgeModelUuid) => {
            addChild(`km-editor-${editorCKnowledgeModelUuid}-chapters-add`).then((chapterUuid) => {
              type(chapterUuid, 'title', `Chapter ${Date.now()}`)

              publish(editorCUuid, [2, 0, 0]).then((packageCUuid) => {
                cy.visitApp('/knowledge-models/editors')
                cy.openListingItemActions(editorBUuid, 'listing-item_action_update').click()
                cy.getCy('km-editor-update').should('have.attr', 'open')
                cy.getCy('km-editor-update').within(() => cy.getCy('form-cancel').click())
                cy.getCy('km-editor-update').should('not.have.attr', 'open')

                cy.getCy(`listing-item_${editorBUuid}`).find('[data-cy="listing-item_badge_update-available"]').click()
                cy.getCy('km-editor-update').within(() => {
                  cy.getField('targetPackageUuid').select(packageCUuid)
                  cy.getCy('form-submit').click()
                })
                cy.url().should('match', new RegExp(`/knowledge-models/editors/${editorBUuid}/migration$`))

                cleanupPackage(packageAUuid)
              })
            })
          })
        })
      })
    })
  })
}

// Two new chapters give two conflicts, so resolving one and navigating away leaves
// something to confirm resuming didn't lose or restart.
export function pauseResumeAndCancelMigration() {
  createKmEditor().then((editorAUuid) => {
    publish(editorAUuid, [1, 0, 0]).then((packageAUuid) => {
      forkContinuation(packageAUuid).then((editorCUuid) => {
        getKnowledgeModelUuid(editorCUuid).then((editorCKnowledgeModelUuid) => {
          const firstChapterTitle = `First New Chapter ${Date.now()}`
          const secondChapterTitle = `Second New Chapter ${Date.now()}`

          addChild(`km-editor-${editorCKnowledgeModelUuid}-chapters-add`).then((firstChapterUuid) => {
            type(firstChapterUuid, 'title', firstChapterTitle)

            cy.visitApp(`/knowledge-models/editors/${editorCUuid}`)
            addChild(`km-editor-${editorCKnowledgeModelUuid}-chapters-add`).then((secondChapterUuid) => {
              type(secondChapterUuid, 'title', secondChapterTitle)

              publish(editorCUuid, [2, 0, 0]).then((packageCUuid) => {
                forkIndependent(packageAUuid).then((resumeEditorUuid) => {
                  startMigration(resumeEditorUuid, packageCUuid)
                  cy.getCy('km-migration_apply').click()
                  cy.getCy('km-migration_publish').should('not.exist')

                  cy.visitApp('/knowledge-models/editors')
                  cy.openListingItemActions(resumeEditorUuid, 'listing-item_action_continue-migration').click()
                  cy.url().should('match', new RegExp(`/knowledge-models/editors/${resumeEditorUuid}/migration$`))
                  cy.getCy('km-migration_publish').should('not.exist')

                  cy.getCy('km-migration_apply-all').click()
                  cy.getCy('km-migration_publish').should('exist')

                  cy.visitApp('/knowledge-models/editors')
                  cy.openListingItemActions(resumeEditorUuid)
                  cy.getCy('listing-item_action_update').should('not.exist')
                  cy.getCy('listing-item_action_continue-migration').should('not.exist')

                  cy.visitApp(`/knowledge-models/editors/${resumeEditorUuid}/migration`)
                  publishAfterMigration(resumeEditorUuid, [1, 1, 0]).then((packageBUuid) => {
                    checkTopLevelChildrenExist(resumeEditorUuid, 'chapters', [firstChapterTitle, secondChapterTitle])

                    forkIndependent(packageAUuid).then((cancelEditorUuid) => {
                      startMigration(cancelEditorUuid, packageCUuid)

                      cy.visitApp('/knowledge-models/editors')
                      cy.openListingItemActions(cancelEditorUuid, 'listing-item_action_cancel-migration').click()

                      cy.openListingItemActions(cancelEditorUuid, 'listing-item_action_update').should('exist')
                      cy.getCy('listing-item_action_continue-migration').should('not.exist')

                      cleanupPackage(packageBUuid)
                      cleanupPackage(packageAUuid)
                    })
                  })
                })
              })
            })
          })
        })
      })
    })
  })
}

// Reject must discard the parent's proposed change and keep the migrating editor's
// own value, confirmed by reopening the entity afterwards.
export function rejectDiscardsTheChange() {
  const originalTitle = `Original Title ${Date.now()}`
  const parentsNewTitle = `Parent's New Title ${Date.now()}`

  createKmEditor().then((editorAUuid) => {
    getKnowledgeModelUuid(editorAUuid).then((rootUuid) => {
      addChild(`km-editor-${rootUuid}-chapters-add`).then((chapterUuid) => {
        type(chapterUuid, 'title', originalTitle)

        publish(editorAUuid, [1, 0, 0]).then((packageAUuid) => {
          forkIndependent(packageAUuid).then((editorBUuid) => {
            forkContinuation(packageAUuid).then((editorCUuid) => {
              cy.visitApp(`/knowledge-models/editors/${editorCUuid}/edit/${chapterUuid}`)
              cy.get(`#km-editor-${chapterUuid}-title`).clear()
              cy.get(`#km-editor-${chapterUuid}-title`).type(parentsNewTitle)

              publish(editorCUuid, [2, 0, 0]).then((packageCUuid) => {
                startMigration(editorBUuid, packageCUuid)
                cy.getCy('km-migration_conflict').should('contain.text', 'Chapter changed')
                cy.getCy('km-migration_reject').click()
                cy.getCy('km-migration_publish').should('exist')

                publishAfterMigration(editorBUuid, [1, 1, 0]).then((packageBUuid) => {
                  cy.visitApp(`/knowledge-models/editors/${editorBUuid}/edit/${chapterUuid}`)
                  cy.get(`#km-editor-${chapterUuid}-title`).should('have.value', originalTitle)

                  cleanupPackage(packageBUuid)
                  cleanupPackage(packageAUuid)
                })
              })
            })
          })
        })
      })
    })
  })
}
