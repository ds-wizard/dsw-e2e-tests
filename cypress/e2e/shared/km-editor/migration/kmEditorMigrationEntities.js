// Migration is server-driven and shows exactly ONE conflict at a time - no event-uuid
// selectors or diff tree exist any more (Common.Pages.KMEditor.Editor.Migration).
// Each conflict's own wrapper carries "km-migration_conflict_<event-type>" (e.g.
// "edit-chapter"), and each of its fields "km-migration_field_<key>" on the value
// (Migration.elm's conflictTestId/DescriptionList.withTestId) - Follow-up and Item
// questions use the exact same event constructors as a top-level question, so they get
// no scenario of their own. Five entity kinds (question, answer, choice, reference,
// expert) also get a dedicated "move-<kind>" conflict - covered once here, on a
// question.
//
// Each per-kind scenario: build a KM editor with two pre-existing instances of the
// kind under test (one to edit, one to delete), publish it as 1.0.0, fork a second,
// never-published draft editor from that package (the one that migrates - same
// editorB role as kmEditorMigrate.js's own) and a third "continuation" editor
// (?edit=true, so it shares the parent's own id and can publish a newer version of the
// SAME package family, like kmEditorMigrate.js's editorC) - edit the continuation to
// make all three changes (edit one instance, delete the other, add a third), publish
// it as 2.0.0, then point the migrating editor's "Update" action at that new version
// and resolve the conflicts that come back. Their order isn't guaranteed (the server
// decides what to hand back next), so they're matched by their own conflict test id
// rather than an assumed sequence.
// The KM root entity's own uuid - used to build data-cy/id selectors for its direct
// children (e.g. "chapters-add") - is generated per editor, not the editor's own
// uuid, so it has to be read back from the editor's own GET response rather than
// assumed. editorA (createKmEditor's own return) fetches it once up front; a forked
// editor (continuation or independent) fetches its own separately below, since
// forking doesn't carry it in any URL or form field either.
function getKnowledgeModelUuid(editorUuid) {
  return cy.apiToken().then((token) =>
    cy.request({
      method: 'GET',
      url: `${Cypress.expose('apiUrl')}/knowledge-model-editors/${editorUuid}`,
      headers: { Authorization: `Bearer ${token}` }
    }).then((response) => response.body.knowledgeModel.uuid)
  )
}

// Date.now() alone can return the identical millisecond for calls microseconds apart
// (confirmed elsewhere in this suite's own migration diff checks), so a KM id built
// from it alone can collide with another spec's - and the "outdated" check that drives
// KM migration matches editors by this exact id string across their whole package
// family, so a collision silently merges two unrelated knowledge models into one
// "family" for that lookup. The random suffix makes collisions effectively impossible.
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
    .then((kmEditorUuid) => getKnowledgeModelUuid(kmEditorUuid).then((knowledgeModelUuid) => ({ kmEditorUuid, knowledgeModelUuid })))
}

function addChild(triggerId) {
  cy.get(`#${triggerId}`).click()
  return cy.url()
    .should('match', /\/edit\/[0-9a-f-]{36}$/)
    .then((url) => url.split('/').pop())
}

// Waits for the debounced autosave before returning - not every call site chains
// straight into publish() (which already waits on its own first step), and a hard
// navigation right after typing can race the save, corrupting or losing the value
// (confirmed: a title typed without this wait landed saved as a single leftover
// character, and a retyped one landed saved as empty).
function type(uuid, field, value) {
  cy.get(`#km-editor-${uuid}-${field}`).type(value)
  waitForSave()
}

function retype(uuid, field, value) {
  cy.get(`#km-editor-${uuid}-${field}`).clear()
  cy.get(`#km-editor-${uuid}-${field}`).type(value)
  waitForSave()
}

function deleteActiveEntity() {
  cy.getCy('km-editor_delete').click()
  cy.getCy('km-editor_delete-modal_confirm').click()
}

function waitForSave() {
  cy.wait(1200)
  cy.getCy('saving-indicator').should('not.have.attr', 'data-state', 'saving')
}

// Publishes from within the editor itself (settings tab, then the editor's own
// Publish button/modal) - see kmEditorPublish.js for why not the standalone
// "/publish" form page.
//
// Clicking "form-submit" on the settings tab does not itself block navigation while
// its save PUT is in flight, so navigating away immediately can abort it.
// The "form-unsaved" bar stays visible until the save actually succeeds, so that's the
// signal to wait on before leaving the page.
function publish(editorUuid, [major, minor, patch]) {
  waitForSave()

  cy.visitApp(`/knowledge-models/editors/${editorUuid}/settings`)
  cy.getField('versionMajor').clear().type(String(major))
  cy.getField('versionMinor').clear().type(String(minor))
  cy.getField('versionPatch').clear().type(String(patch))
  cy.getField('license').type('MIT')
  cy.getField('description').type('Published by the KM Editor / migration E2E spec.')
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

// Once a migration completes, "Migration complete" shows a "Publish" link
// ("km-migration_publish") to a different, standalone "/publish" page - not the in-editor
// settings-tab + modal flow `publish` above uses. That page's own version fields are
// "major"/"minor"/"patch" (not "versionMajor" etc.), and its submit button is
// "km-publish_publish-button". It redirects to the published package on success, same
// as the in-editor flow, so no extra wait is needed around its own submit.
function publishAfterMigration(editorUuid, [major, minor, patch]) {
  cy.getCy('km-migration_publish').click()
  cy.url().should('match', new RegExp(`/knowledge-models/editors/${editorUuid}/publish$`))

  cy.getField('major').clear().type(String(major))
  cy.getField('minor').clear().type(String(minor))
  cy.getField('patch').clear().type(String(patch))
  cy.getField('description').type('Published after migration by the KM Editor / migration entities E2E spec.')
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

// "edit=true" pre-fills name/id/language from the parent package, but NOT version -
// that starts empty in every create-from-package flow (fork or continuation alike)
// and is required, so it still has to be typed here.
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

// Opens the update modal via the row's own "update available" badge rather than the
// kebab's "Update" action - both open the exact same modal (confirmed by
// containsUpdateOptionAndBadge in kmEditorMigrationMechanics.js, which tests the kebab
// path directly), but the kebab's menu reliably closes itself right after opening
// whenever this badge is also on the row, so setup code that doesn't care which path
// opens the modal takes this one.
function startMigration(migratingEditorUuid, targetPackageUuid) {
  cy.visitApp('/knowledge-models/editors')
  cy.getCy(`listing-item_${migratingEditorUuid}`).find('[data-cy="listing-item_badge_update-available"]').click()
  cy.getCy('km-editor-update').within(() => {
    cy.getField('targetPackageUuid').select(targetPackageUuid)
    cy.getCy('form-submit').click()
  })
  cy.url().should('match', new RegExp(`/knowledge-models/editors/${migratingEditorUuid}/migration$`))
}

// An added/deleted field's diff collapses to a single clean run (one side is empty),
// so the field's own value is the whole of its data-cy'd dd's text content.
function fieldEquals(fieldKey, value) {
  cy.getCy(`km-migration_field_${fieldKey}`).should('contain.text', value)
}

// A changed field's diff (DiffText.words) interleaves the old and new text around any
// words they still share, so the new value doesn't necessarily appear as a contiguous
// substring of the whole field - only the <ins> runs hold what's new. Diffing is by
// word, not character: a trailing Date.now() timestamp is NOT a safe anchor here,
// since the edit's own "before" and "after" titles are built microseconds apart and
// often land on the exact same millisecond, which then diffs as unchanged, shared text
// rather than part of the insert. Scenarios below anchor on the one word that's always
// genuinely new instead (e.g. "Edited", replacing "To"/"Edit").
function fieldChangedTo(fieldKey, value) {
  cy.getCy(`km-migration_field_${fieldKey}`).find('ins').should('contain.text', value)
}

// Matches the current conflict purely by its own "km-migration_conflict_<event type>"
// test id - enough when at most one conflict of that kind can be pending at a time.
function conflictOfKind(conflictTestId) {
  return ($body) => $body.find(`[data-cy="km-migration_conflict_${conflictTestId}"]`).length > 0
}

// Matches an edit conflict by kind AND a word that's only ever on one side of it -
// needed when more than one conflict of the same kind is pending at once. In
// particular, adding an entity through the editor is really two events: the add
// itself, with blank/default field values, then a separate edit that sets what was
// typed - so a scenario's own "New X" conflict has no content of its own to check, and
// the value shows up instead in a second, otherwise-identical-looking "X changed"
// conflict for that same newly-added entity, alongside whatever other "X changed"
// conflict a separately-edited pre-existing entity produces.
function editConflictWithWord(conflictTestId, fieldKey, word) {
  return ($body) => {
    const conflict = $body.find(`[data-cy="km-migration_conflict_${conflictTestId}"]`)
    return conflict.length > 0 && conflict.find(`[data-cy="km-migration_field_${fieldKey}"]`).text().includes(word)
  }
}

// Resolves every pending conflict, matched by each scenario's own "matches" predicate
// rather than an assumed order. Each scenario's optional "check" runs against the
// current conflict before applying it. A scenario may give "conflictTestId" instead
// of "matches" as sugar for conflictOfKind(conflictTestId), for a kind that's never
// pending more than once at a time.
function resolveMigration(scenarios) {
  const remaining = scenarios.map((scenario) =>
    scenario.matches ? scenario : { ...scenario, matches: conflictOfKind(scenario.conflictTestId) })

  function step() {
    // The previous apply/reject click only guarantees the request fired, not that the
    // server round-trip (next conflict, or "Migration complete") has landed yet - a bare
    // cy.get('body').then() snapshots whatever's there the instant the click resolves,
    // which can be a transitional state matching neither. This should() retries (Cypress's
    // normal polling) until the DOM actually reflects one of those two outcomes, so the
    // synchronous snapshot below sees a settled state instead of racing the fetch.
    cy.get('body').should(($body) => {
      const settled = $body.find('[data-cy="km-migration_publish"]').length > 0 || remaining.some((scenario) => scenario.matches($body))
      expect(settled, 'reached Migration complete or a conflict matching one of the expected kinds').to.be.true
    })

    cy.get('body').then(($body) => {
      if ($body.find('[data-cy="km-migration_publish"]').length > 0) {
        expect(remaining, 'every expected conflict was resolved').to.have.length(0)
        return
      }

      const index = remaining.findIndex((scenario) => scenario.matches($body))
      expect(index, 'current conflict matches one of the expected kinds').to.be.greaterThan(-1)

      const [scenario] = remaining.splice(index, 1)
      if (scenario.check) {
        scenario.check()
      }

      cy.getCy('km-migration_apply').click()
      step()
    })
  }

  step()
}

// Confirms the migration's actual result landed in the migrating editor's own entity
// data, not just that the conflict screen showed the right diff before applying -
// scoped to the parent's own children list by its data-cy prefix (the same per-parent
// children-list convention kmEditorMoveEntities.js's own childItem() checks use, chosen
// there to avoid relying on the sidebar tree, which can be collapsed) rather than the
// added entity's own post-migration uuid, which migration may or may not preserve.
function checkChildrenList(parentUuid, fieldName, { added, edited, deleted }) {
  const items = () => cy.get(`[data-cy^="km-editor-${parentUuid}-${fieldName}_item_"]`)
  items().contains(added).should('exist')
  items().contains(edited).should('exist')
  items().contains(deleted).should('not.exist')
}

// Top-level kinds (chapters, metrics, phases, tags, resource collections,
// integrations) list under the KM root entity, whose own uuid is generated per
// editor - editorA's was already fetched by createKmEditor, but editorB (the forked,
// migrating editor checked here) needs its own, separately.
function checkTopLevelMigratedChildren(editorUuid, fieldName, titles) {
  cy.visitApp(`/knowledge-models/editors/${editorUuid}`)
  getKnowledgeModelUuid(editorUuid).then((rootUuid) => checkChildrenList(rootUuid, fieldName, titles))
}

// Nested kinds list under a parent entity (chapter, question, resource collection)
// shared/common between editorB and editorC - both forked from the same editorA
// package - so its uuid needs no re-fetching.
function checkNestedMigratedChildren(editorUuid, parentUuid, fieldName, titles) {
  cy.visitApp(`/knowledge-models/editors/${editorUuid}/edit/${parentUuid}`)
  checkChildrenList(parentUuid, fieldName, titles)
}

// Deleting the package cascades (DB-level, on its previous_package_uuid FK) to every
// editor forked from it - editorB (independent fork) and editorC (continuation) both
// go with it, so there's nothing left for a separate editor delete to do.
function cleanupPackage(packageUuid) {
  cy.apiToken().then((token) => {
    cy.request({
      method: 'DELETE',
      url: `${Cypress.expose('apiUrl')}/knowledge-model-packages/${packageUuid}?allVersions=true`,
      headers: { Authorization: `Bearer ${token}` }
    })
  })
}

export function chapterMigration() {
  const editTitle = `Chapter To Edit ${Date.now()}`
  const deleteTitle = `Chapter To Delete ${Date.now()}`
  const editedTitle = `Chapter Edited ${Date.now()}`
  const addedTitle = `Chapter Added ${Date.now()}`

  createKmEditor().then(({ kmEditorUuid: editorAUuid, knowledgeModelUuid }) => {
    addChild(`km-editor-${knowledgeModelUuid}-chapters-add`).then((editUuid) => {
      type(editUuid, 'title', editTitle)

      cy.visitApp(`/knowledge-models/editors/${editorAUuid}`)
      addChild(`km-editor-${knowledgeModelUuid}-chapters-add`).then((deleteUuid) => {
        type(deleteUuid, 'title', deleteTitle)

        publish(editorAUuid, [1, 0, 0]).then((packageAUuid) => {
          forkIndependent(packageAUuid).then((editorBUuid) => {
            forkContinuation(packageAUuid).then((editorCUuid) => {
              cy.visitApp(`/knowledge-models/editors/${editorCUuid}/edit/${editUuid}`)
              retype(editUuid, 'title', editedTitle)

              cy.visitApp(`/knowledge-models/editors/${editorCUuid}/edit/${deleteUuid}`)
              deleteActiveEntity()

              cy.visitApp(`/knowledge-models/editors/${editorCUuid}`)
              getKnowledgeModelUuid(editorCUuid).then((editorCKnowledgeModelUuid) => {
                addChild(`km-editor-${editorCKnowledgeModelUuid}-chapters-add`).then((addedUuid) => {
                  type(addedUuid, 'title', addedTitle)

                  publish(editorCUuid, [2, 0, 0]).then((packageCUuid) => {
                    startMigration(editorBUuid, packageCUuid)
                    resolveMigration([
                      // The add itself carries no content (the editor creates it
                      // blank, then a separate edit sets the title just typed) - that
                      // edit is what actually carries addedTitle.
                      { matches: conflictOfKind('add-chapter') },
                      { matches: editConflictWithWord('edit-chapter', 'title', 'Added'), check: () => fieldEquals('title', addedTitle) },
                      { matches: editConflictWithWord('edit-chapter', 'title', 'Edited'), check: () => fieldChangedTo('title', 'Edited') },
                      { matches: conflictOfKind('delete-chapter'), check: () => fieldEquals('title', deleteTitle) }
                    ])

                    publishAfterMigration(editorBUuid, [1, 1, 0]).then((packageBUuid) => {
                      checkTopLevelMigratedChildren(editorBUuid, 'chapters', { added: addedTitle, edited: editedTitle, deleted: deleteTitle })
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

export function metricMigration() {
  const editTitle = `Metric To Edit ${Date.now()}`
  const deleteTitle = `Metric To Delete ${Date.now()}`
  const editedTitle = `Metric Edited ${Date.now()}`
  const addedTitle = `Metric Added ${Date.now()}`

  createKmEditor().then(({ kmEditorUuid: editorAUuid, knowledgeModelUuid }) => {
    addChild(`km-editor-${knowledgeModelUuid}-metrics-add`).then((editUuid) => {
      type(editUuid, 'title', editTitle)

      cy.visitApp(`/knowledge-models/editors/${editorAUuid}`)
      addChild(`km-editor-${knowledgeModelUuid}-metrics-add`).then((deleteUuid) => {
        type(deleteUuid, 'title', deleteTitle)

        publish(editorAUuid, [1, 0, 0]).then((packageAUuid) => {
          forkIndependent(packageAUuid).then((editorBUuid) => {
            forkContinuation(packageAUuid).then((editorCUuid) => {
              cy.visitApp(`/knowledge-models/editors/${editorCUuid}/edit/${editUuid}`)
              retype(editUuid, 'title', editedTitle)

              cy.visitApp(`/knowledge-models/editors/${editorCUuid}/edit/${deleteUuid}`)
              deleteActiveEntity()

              cy.visitApp(`/knowledge-models/editors/${editorCUuid}`)
              getKnowledgeModelUuid(editorCUuid).then((editorCKnowledgeModelUuid) => {
                addChild(`km-editor-${editorCKnowledgeModelUuid}-metrics-add`).then((addedUuid) => {
                  type(addedUuid, 'title', addedTitle)

                  publish(editorCUuid, [2, 0, 0]).then((packageCUuid) => {
                    startMigration(editorBUuid, packageCUuid)
                    resolveMigration([
                      { matches: conflictOfKind('add-metric') },
                      { matches: editConflictWithWord('edit-metric', 'title', 'Added'), check: () => fieldEquals('title', addedTitle) },
                      { matches: editConflictWithWord('edit-metric', 'title', 'Edited'), check: () => fieldChangedTo('title', 'Edited') },
                      { matches: conflictOfKind('delete-metric'), check: () => fieldEquals('title', deleteTitle) }
                    ])

                    publishAfterMigration(editorBUuid, [1, 1, 0]).then((packageBUuid) => {
                      checkTopLevelMigratedChildren(editorBUuid, 'metrics', { added: addedTitle, edited: editedTitle, deleted: deleteTitle })
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

export function phaseMigration() {
  const editTitle = `Phase To Edit ${Date.now()}`
  const deleteTitle = `Phase To Delete ${Date.now()}`
  const editedTitle = `Phase Edited ${Date.now()}`
  const addedTitle = `Phase Added ${Date.now()}`

  createKmEditor().then(({ kmEditorUuid: editorAUuid, knowledgeModelUuid }) => {
    addChild(`km-editor-${knowledgeModelUuid}-phases-add`).then((editUuid) => {
      type(editUuid, 'title', editTitle)

      cy.visitApp(`/knowledge-models/editors/${editorAUuid}`)
      addChild(`km-editor-${knowledgeModelUuid}-phases-add`).then((deleteUuid) => {
        type(deleteUuid, 'title', deleteTitle)

        publish(editorAUuid, [1, 0, 0]).then((packageAUuid) => {
          forkIndependent(packageAUuid).then((editorBUuid) => {
            forkContinuation(packageAUuid).then((editorCUuid) => {
              cy.visitApp(`/knowledge-models/editors/${editorCUuid}/edit/${editUuid}`)
              retype(editUuid, 'title', editedTitle)

              cy.visitApp(`/knowledge-models/editors/${editorCUuid}/edit/${deleteUuid}`)
              deleteActiveEntity()

              cy.visitApp(`/knowledge-models/editors/${editorCUuid}`)
              getKnowledgeModelUuid(editorCUuid).then((editorCKnowledgeModelUuid) => {
                addChild(`km-editor-${editorCKnowledgeModelUuid}-phases-add`).then((addedUuid) => {
                  type(addedUuid, 'title', addedTitle)

                  publish(editorCUuid, [2, 0, 0]).then((packageCUuid) => {
                    startMigration(editorBUuid, packageCUuid)
                    resolveMigration([
                      { matches: conflictOfKind('add-phase') },
                      { matches: editConflictWithWord('edit-phase', 'title', 'Added'), check: () => fieldEquals('title', addedTitle) },
                      { matches: editConflictWithWord('edit-phase', 'title', 'Edited'), check: () => fieldChangedTo('title', 'Edited') },
                      { matches: conflictOfKind('delete-phase'), check: () => fieldEquals('title', deleteTitle) }
                    ])

                    publishAfterMigration(editorBUuid, [1, 1, 0]).then((packageBUuid) => {
                      checkTopLevelMigratedChildren(editorBUuid, 'phases', { added: addedTitle, edited: editedTitle, deleted: deleteTitle })
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

export function tagMigration() {
  const editName = `Tag To Edit ${Date.now()}`
  const deleteName = `Tag To Delete ${Date.now()}`
  const editedName = `Tag Edited ${Date.now()}`
  const addedName = `Tag Added ${Date.now()}`

  createKmEditor().then(({ kmEditorUuid: editorAUuid, knowledgeModelUuid }) => {
    addChild(`km-editor-${knowledgeModelUuid}-tags-add`).then((editUuid) => {
      type(editUuid, 'name', editName)

      cy.visitApp(`/knowledge-models/editors/${editorAUuid}`)
      addChild(`km-editor-${knowledgeModelUuid}-tags-add`).then((deleteUuid) => {
        type(deleteUuid, 'name', deleteName)

        publish(editorAUuid, [1, 0, 0]).then((packageAUuid) => {
          forkIndependent(packageAUuid).then((editorBUuid) => {
            forkContinuation(packageAUuid).then((editorCUuid) => {
              cy.visitApp(`/knowledge-models/editors/${editorCUuid}/edit/${editUuid}`)
              retype(editUuid, 'name', editedName)

              cy.visitApp(`/knowledge-models/editors/${editorCUuid}/edit/${deleteUuid}`)
              deleteActiveEntity()

              cy.visitApp(`/knowledge-models/editors/${editorCUuid}`)
              getKnowledgeModelUuid(editorCUuid).then((editorCKnowledgeModelUuid) => {
                addChild(`km-editor-${editorCKnowledgeModelUuid}-tags-add`).then((addedUuid) => {
                  type(addedUuid, 'name', addedName)

                  publish(editorCUuid, [2, 0, 0]).then((packageCUuid) => {
                    startMigration(editorBUuid, packageCUuid)
                    resolveMigration([
                      { matches: conflictOfKind('add-tag') },
                      { matches: editConflictWithWord('edit-tag', 'name', 'Added'), check: () => fieldEquals('name', addedName) },
                      { matches: editConflictWithWord('edit-tag', 'name', 'Edited'), check: () => fieldChangedTo('name', 'Edited') },
                      { matches: conflictOfKind('delete-tag'), check: () => fieldEquals('name', deleteName) }
                    ])

                    publishAfterMigration(editorBUuid, [1, 1, 0]).then((packageBUuid) => {
                      checkTopLevelMigratedChildren(editorBUuid, 'tags', { added: addedName, edited: editedName, deleted: deleteName })
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

export function resourceCollectionMigration() {
  const editTitle = `Resource Collection To Edit ${Date.now()}`
  const deleteTitle = `Resource Collection To Delete ${Date.now()}`
  const editedTitle = `Resource Collection Edited ${Date.now()}`
  const addedTitle = `Resource Collection Added ${Date.now()}`

  createKmEditor().then(({ kmEditorUuid: editorAUuid, knowledgeModelUuid }) => {
    addChild(`km-editor-${knowledgeModelUuid}-resourceCollections-add`).then((editUuid) => {
      type(editUuid, 'title', editTitle)

      cy.visitApp(`/knowledge-models/editors/${editorAUuid}`)
      addChild(`km-editor-${knowledgeModelUuid}-resourceCollections-add`).then((deleteUuid) => {
        type(deleteUuid, 'title', deleteTitle)

        publish(editorAUuid, [1, 0, 0]).then((packageAUuid) => {
          forkIndependent(packageAUuid).then((editorBUuid) => {
            forkContinuation(packageAUuid).then((editorCUuid) => {
              cy.visitApp(`/knowledge-models/editors/${editorCUuid}/edit/${editUuid}`)
              retype(editUuid, 'title', editedTitle)

              cy.visitApp(`/knowledge-models/editors/${editorCUuid}/edit/${deleteUuid}`)
              deleteActiveEntity()

              cy.visitApp(`/knowledge-models/editors/${editorCUuid}`)
              getKnowledgeModelUuid(editorCUuid).then((editorCKnowledgeModelUuid) => {
                addChild(`km-editor-${editorCKnowledgeModelUuid}-resourceCollections-add`).then((addedUuid) => {
                  type(addedUuid, 'title', addedTitle)

                  publish(editorCUuid, [2, 0, 0]).then((packageCUuid) => {
                    startMigration(editorBUuid, packageCUuid)
                    resolveMigration([
                      { matches: conflictOfKind('add-resource-collection') },
                      { matches: editConflictWithWord('edit-resource-collection', 'title', 'Added'), check: () => fieldEquals('title', addedTitle) },
                      { matches: editConflictWithWord('edit-resource-collection', 'title', 'Edited'), check: () => fieldChangedTo('title', 'Edited') },
                      { matches: conflictOfKind('delete-resource-collection'), check: () => fieldEquals('title', deleteTitle) }
                    ])

                    publishAfterMigration(editorBUuid, [1, 1, 0]).then((packageBUuid) => {
                      checkTopLevelMigratedChildren(editorBUuid, 'resourceCollections', { added: addedTitle, edited: editedTitle, deleted: deleteTitle })
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

export function resourcePageMigration() {
  const editTitle = `Resource Page To Edit ${Date.now()}`
  const deleteTitle = `Resource Page To Delete ${Date.now()}`
  const editedTitle = `Resource Page Edited ${Date.now()}`
  const addedTitle = `Resource Page Added ${Date.now()}`

  createKmEditor().then(({ kmEditorUuid: editorAUuid, knowledgeModelUuid }) => {
    addChild(`km-editor-${knowledgeModelUuid}-resourceCollections-add`).then((resourceCollectionUuid) => {
      type(resourceCollectionUuid, 'title', `Resource Collection ${Date.now()}`)

      addChild(`km-editor-${resourceCollectionUuid}-resourcePages-add`).then((editUuid) => {
        type(editUuid, 'title', editTitle)

        cy.visitApp(`/knowledge-models/editors/${editorAUuid}/edit/${resourceCollectionUuid}`)
        addChild(`km-editor-${resourceCollectionUuid}-resourcePages-add`).then((deleteUuid) => {
          type(deleteUuid, 'title', deleteTitle)

          publish(editorAUuid, [1, 0, 0]).then((packageAUuid) => {
            forkIndependent(packageAUuid).then((editorBUuid) => {
              forkContinuation(packageAUuid).then((editorCUuid) => {
                cy.visitApp(`/knowledge-models/editors/${editorCUuid}/edit/${editUuid}`)
                retype(editUuid, 'title', editedTitle)

                cy.visitApp(`/knowledge-models/editors/${editorCUuid}/edit/${deleteUuid}`)
                deleteActiveEntity()

                cy.visitApp(`/knowledge-models/editors/${editorCUuid}/edit/${resourceCollectionUuid}`)
                addChild(`km-editor-${resourceCollectionUuid}-resourcePages-add`).then((addedUuid) => {
                  type(addedUuid, 'title', addedTitle)

                  publish(editorCUuid, [2, 0, 0]).then((packageCUuid) => {
                    startMigration(editorBUuid, packageCUuid)
                    resolveMigration([
                      { matches: conflictOfKind('add-resource-page') },
                      { matches: editConflictWithWord('edit-resource-page', 'title', 'Added'), check: () => fieldEquals('title', addedTitle) },
                      { matches: editConflictWithWord('edit-resource-page', 'title', 'Edited'), check: () => fieldChangedTo('title', 'Edited') },
                      { matches: conflictOfKind('delete-resource-page'), check: () => fieldEquals('title', deleteTitle) }
                    ])

                    publishAfterMigration(editorBUuid, [1, 1, 0]).then((packageBUuid) => {
                      checkNestedMigratedChildren(editorBUuid, resourceCollectionUuid, 'resourcePages', { added: addedTitle, edited: editedTitle, deleted: deleteTitle })
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

// Default question type (Options) is enough - subtype coverage lives in the
// add-entity tests.
export function questionMigration() {
  const editTitle = `Question To Edit ${Date.now()}`
  const deleteTitle = `Question To Delete ${Date.now()}`
  const editedTitle = `Question Edited ${Date.now()}`
  const addedTitle = `Question Added ${Date.now()}`

  createKmEditor().then(({ kmEditorUuid: editorAUuid, knowledgeModelUuid }) => {
    addChild(`km-editor-${knowledgeModelUuid}-chapters-add`).then((chapterUuid) => {
      addChild(`km-editor-${chapterUuid}-questions-add`).then((editUuid) => {
        type(editUuid, 'title', editTitle)

        cy.visitApp(`/knowledge-models/editors/${editorAUuid}/edit/${chapterUuid}`)
        addChild(`km-editor-${chapterUuid}-questions-add`).then((deleteUuid) => {
          type(deleteUuid, 'title', deleteTitle)

          publish(editorAUuid, [1, 0, 0]).then((packageAUuid) => {
            forkIndependent(packageAUuid).then((editorBUuid) => {
              forkContinuation(packageAUuid).then((editorCUuid) => {
                cy.visitApp(`/knowledge-models/editors/${editorCUuid}/edit/${editUuid}`)
                retype(editUuid, 'title', editedTitle)

                cy.visitApp(`/knowledge-models/editors/${editorCUuid}/edit/${deleteUuid}`)
                deleteActiveEntity()

                cy.visitApp(`/knowledge-models/editors/${editorCUuid}/edit/${chapterUuid}`)
                addChild(`km-editor-${chapterUuid}-questions-add`).then((addedUuid) => {
                  type(addedUuid, 'title', addedTitle)

                  publish(editorCUuid, [2, 0, 0]).then((packageCUuid) => {
                    startMigration(editorBUuid, packageCUuid)
                    resolveMigration([
                      { matches: conflictOfKind('add-question') },
                      { matches: editConflictWithWord('edit-question', 'title', 'Added'), check: () => fieldEquals('title', addedTitle) },
                      { matches: editConflictWithWord('edit-question', 'title', 'Edited'), check: () => fieldChangedTo('title', 'Edited') },
                      { matches: conflictOfKind('delete-question'), check: () => fieldEquals('title', deleteTitle) }
                    ])

                    publishAfterMigration(editorBUuid, [1, 1, 0]).then((packageBUuid) => {
                      checkNestedMigratedChildren(editorBUuid, chapterUuid, 'questions', { added: addedTitle, edited: editedTitle, deleted: deleteTitle })
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

export function answerMigration() {
  const editLabel = `Answer To Edit ${Date.now()}`
  const deleteLabel = `Answer To Delete ${Date.now()}`
  const editedLabel = `Answer Edited ${Date.now()}`
  const addedLabel = `Answer Added ${Date.now()}`

  createKmEditor().then(({ kmEditorUuid: editorAUuid, knowledgeModelUuid }) => {
    addChild(`km-editor-${knowledgeModelUuid}-chapters-add`).then((chapterUuid) => {
      addChild(`km-editor-${chapterUuid}-questions-add`).then((questionUuid) => {
        addChild(`km-editor-${questionUuid}-answers-add`).then((editUuid) => {
          type(editUuid, 'label', editLabel)

          cy.visitApp(`/knowledge-models/editors/${editorAUuid}/edit/${questionUuid}`)
          addChild(`km-editor-${questionUuid}-answers-add`).then((deleteUuid) => {
            type(deleteUuid, 'label', deleteLabel)

            publish(editorAUuid, [1, 0, 0]).then((packageAUuid) => {
              forkIndependent(packageAUuid).then((editorBUuid) => {
                forkContinuation(packageAUuid).then((editorCUuid) => {
                  cy.visitApp(`/knowledge-models/editors/${editorCUuid}/edit/${editUuid}`)
                  retype(editUuid, 'label', editedLabel)

                  cy.visitApp(`/knowledge-models/editors/${editorCUuid}/edit/${deleteUuid}`)
                  deleteActiveEntity()

                  cy.visitApp(`/knowledge-models/editors/${editorCUuid}/edit/${questionUuid}`)
                  addChild(`km-editor-${questionUuid}-answers-add`).then((addedUuid) => {
                    type(addedUuid, 'label', addedLabel)

                    publish(editorCUuid, [2, 0, 0]).then((packageCUuid) => {
                      startMigration(editorBUuid, packageCUuid)
                      resolveMigration([
                        { matches: conflictOfKind('add-answer') },
                        { matches: editConflictWithWord('edit-answer', 'label', 'Added'), check: () => fieldEquals('label', addedLabel) },
                        { matches: editConflictWithWord('edit-answer', 'label', 'Edited'), check: () => fieldChangedTo('label', 'Edited') },
                        { matches: conflictOfKind('delete-answer'), check: () => fieldEquals('label', deleteLabel) }
                      ])

                      publishAfterMigration(editorBUuid, [1, 1, 0]).then((packageBUuid) => {
                        checkNestedMigratedChildren(editorBUuid, questionUuid, 'answers', { added: addedLabel, edited: editedLabel, deleted: deleteLabel })
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
  })
}

export function choiceMigration() {
  const editLabel = `Choice To Edit ${Date.now()}`
  const deleteLabel = `Choice To Delete ${Date.now()}`
  const editedLabel = `Choice Edited ${Date.now()}`
  const addedLabel = `Choice Added ${Date.now()}`

  createKmEditor().then(({ kmEditorUuid: editorAUuid, knowledgeModelUuid }) => {
    addChild(`km-editor-${knowledgeModelUuid}-chapters-add`).then((chapterUuid) => {
      addChild(`km-editor-${chapterUuid}-questions-add`).then((questionUuid) => {
        cy.get(`#km-editor-${questionUuid}-type`).select('MultiChoice')

        addChild(`km-editor-${questionUuid}-choices-add`).then((editUuid) => {
          type(editUuid, 'label', editLabel)

          cy.visitApp(`/knowledge-models/editors/${editorAUuid}/edit/${questionUuid}`)
          addChild(`km-editor-${questionUuid}-choices-add`).then((deleteUuid) => {
            type(deleteUuid, 'label', deleteLabel)

            publish(editorAUuid, [1, 0, 0]).then((packageAUuid) => {
              forkIndependent(packageAUuid).then((editorBUuid) => {
                forkContinuation(packageAUuid).then((editorCUuid) => {
                  cy.visitApp(`/knowledge-models/editors/${editorCUuid}/edit/${editUuid}`)
                  retype(editUuid, 'label', editedLabel)

                  cy.visitApp(`/knowledge-models/editors/${editorCUuid}/edit/${deleteUuid}`)
                  deleteActiveEntity()

                  cy.visitApp(`/knowledge-models/editors/${editorCUuid}/edit/${questionUuid}`)
                  addChild(`km-editor-${questionUuid}-choices-add`).then((addedUuid) => {
                    type(addedUuid, 'label', addedLabel)

                    publish(editorCUuid, [2, 0, 0]).then((packageCUuid) => {
                      startMigration(editorBUuid, packageCUuid)
                      resolveMigration([
                        { matches: conflictOfKind('add-choice') },
                        { matches: editConflictWithWord('edit-choice', 'label', 'Added'), check: () => fieldEquals('label', addedLabel) },
                        { matches: editConflictWithWord('edit-choice', 'label', 'Edited'), check: () => fieldChangedTo('label', 'Edited') },
                        { matches: conflictOfKind('delete-choice'), check: () => fieldEquals('label', deleteLabel) }
                      ])

                      publishAfterMigration(editorBUuid, [1, 1, 0]).then((packageBUuid) => {
                        checkNestedMigratedChildren(editorBUuid, questionUuid, 'choices', { added: addedLabel, edited: editedLabel, deleted: deleteLabel })
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
  })
}

// Default reference type (URL) is enough - subtype coverage lives in the add-entity
// tests. Unlike every other kind, a deleted reference's conflict has no "label" field
// of its own - it's a synthetic "reference" field holding the reference's own display
// name instead (Migration.elm's entityName), so its delete scenario checks that key.
export function referenceMigration() {
  const editLabel = `Reference To Edit ${Date.now()}`
  const deleteLabel = `Reference To Delete ${Date.now()}`
  const editedLabel = `Reference Edited ${Date.now()}`
  const addedLabel = `Reference Added ${Date.now()}`

  createKmEditor().then(({ kmEditorUuid: editorAUuid, knowledgeModelUuid }) => {
    addChild(`km-editor-${knowledgeModelUuid}-chapters-add`).then((chapterUuid) => {
      addChild(`km-editor-${chapterUuid}-questions-add`).then((questionUuid) => {
        addChild(`km-editor-${questionUuid}-references-add`).then((editUuid) => {
          type(editUuid, 'label', editLabel)

          cy.visitApp(`/knowledge-models/editors/${editorAUuid}/edit/${questionUuid}`)
          addChild(`km-editor-${questionUuid}-references-add`).then((deleteUuid) => {
            type(deleteUuid, 'label', deleteLabel)

            publish(editorAUuid, [1, 0, 0]).then((packageAUuid) => {
              forkIndependent(packageAUuid).then((editorBUuid) => {
                forkContinuation(packageAUuid).then((editorCUuid) => {
                  cy.visitApp(`/knowledge-models/editors/${editorCUuid}/edit/${editUuid}`)
                  retype(editUuid, 'label', editedLabel)

                  cy.visitApp(`/knowledge-models/editors/${editorCUuid}/edit/${deleteUuid}`)
                  deleteActiveEntity()

                  cy.visitApp(`/knowledge-models/editors/${editorCUuid}/edit/${questionUuid}`)
                  addChild(`km-editor-${questionUuid}-references-add`).then((addedUuid) => {
                    type(addedUuid, 'label', addedLabel)

                    publish(editorCUuid, [2, 0, 0]).then((packageCUuid) => {
                      startMigration(editorBUuid, packageCUuid)
                      resolveMigration([
                        { matches: conflictOfKind('add-reference') },
                        { matches: editConflictWithWord('edit-reference', 'label', 'Added'), check: () => fieldEquals('label', addedLabel) },
                        { matches: editConflictWithWord('edit-reference', 'label', 'Edited'), check: () => fieldChangedTo('label', 'Edited') },
                        { matches: conflictOfKind('delete-reference'), check: () => fieldEquals('reference', deleteLabel) }
                      ])

                      publishAfterMigration(editorBUuid, [1, 1, 0]).then((packageBUuid) => {
                        checkNestedMigratedChildren(editorBUuid, questionUuid, 'references', { added: addedLabel, edited: editedLabel, deleted: deleteLabel })
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
  })
}

export function expertMigration() {
  const editName = `Expert To Edit ${Date.now()}`
  const deleteName = `Expert To Delete ${Date.now()}`
  const editedName = `Expert Edited ${Date.now()}`
  const addedName = `Expert Added ${Date.now()}`

  createKmEditor().then(({ kmEditorUuid: editorAUuid, knowledgeModelUuid }) => {
    addChild(`km-editor-${knowledgeModelUuid}-chapters-add`).then((chapterUuid) => {
      addChild(`km-editor-${chapterUuid}-questions-add`).then((questionUuid) => {
        addChild(`km-editor-${questionUuid}-experts-add`).then((editUuid) => {
          type(editUuid, 'name', editName)
          type(editUuid, 'email', 'expert-to-edit@example.com')

          cy.visitApp(`/knowledge-models/editors/${editorAUuid}/edit/${questionUuid}`)
          addChild(`km-editor-${questionUuid}-experts-add`).then((deleteUuid) => {
            type(deleteUuid, 'name', deleteName)
            type(deleteUuid, 'email', 'expert-to-delete@example.com')

            publish(editorAUuid, [1, 0, 0]).then((packageAUuid) => {
              forkIndependent(packageAUuid).then((editorBUuid) => {
                forkContinuation(packageAUuid).then((editorCUuid) => {
                  cy.visitApp(`/knowledge-models/editors/${editorCUuid}/edit/${editUuid}`)
                  retype(editUuid, 'name', editedName)

                  cy.visitApp(`/knowledge-models/editors/${editorCUuid}/edit/${deleteUuid}`)
                  deleteActiveEntity()

                  cy.visitApp(`/knowledge-models/editors/${editorCUuid}/edit/${questionUuid}`)
                  addChild(`km-editor-${questionUuid}-experts-add`).then((addedUuid) => {
                    type(addedUuid, 'name', addedName)
                    type(addedUuid, 'email', 'expert-added@example.com')

                    publish(editorCUuid, [2, 0, 0]).then((packageCUuid) => {
                      startMigration(editorBUuid, packageCUuid)
                      resolveMigration([
                        { matches: conflictOfKind('add-expert') },
                        { matches: editConflictWithWord('edit-expert', 'name', 'Added'), check: () => fieldEquals('name', addedName) },
                        { matches: editConflictWithWord('edit-expert', 'name', 'Edited'), check: () => fieldChangedTo('name', 'Edited') },
                        { matches: conflictOfKind('delete-expert'), check: () => fieldEquals('name', deleteName) }
                      ])

                      publishAfterMigration(editorBUuid, [1, 1, 0]).then((packageBUuid) => {
                        checkNestedMigratedChildren(editorBUuid, questionUuid, 'experts', { added: addedName, edited: editedName, deleted: deleteName })
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
  })
}

export function integrationMigration() {
  const editName = `Integration To Edit ${Date.now()}`
  const deleteName = `Integration To Delete ${Date.now()}`
  const editedName = `Integration Edited ${Date.now()}`
  const addedName = `Integration Added ${Date.now()}`

  createKmEditor().then(({ kmEditorUuid: editorAUuid, knowledgeModelUuid }) => {
    addChild(`km-editor-${knowledgeModelUuid}-integrations-add`).then((editUuid) => {
      type(editUuid, 'name', editName)

      cy.visitApp(`/knowledge-models/editors/${editorAUuid}`)
      addChild(`km-editor-${knowledgeModelUuid}-integrations-add`).then((deleteUuid) => {
        type(deleteUuid, 'name', deleteName)

        publish(editorAUuid, [1, 0, 0]).then((packageAUuid) => {
          forkIndependent(packageAUuid).then((editorBUuid) => {
            forkContinuation(packageAUuid).then((editorCUuid) => {
              cy.visitApp(`/knowledge-models/editors/${editorCUuid}/edit/${editUuid}`)
              retype(editUuid, 'name', editedName)

              cy.visitApp(`/knowledge-models/editors/${editorCUuid}/edit/${deleteUuid}`)
              deleteActiveEntity()

              cy.visitApp(`/knowledge-models/editors/${editorCUuid}`)
              getKnowledgeModelUuid(editorCUuid).then((editorCKnowledgeModelUuid) => {
                addChild(`km-editor-${editorCKnowledgeModelUuid}-integrations-add`).then((addedUuid) => {
                  type(addedUuid, 'name', addedName)

                  publish(editorCUuid, [2, 0, 0]).then((packageCUuid) => {
                    startMigration(editorBUuid, packageCUuid)
                    resolveMigration([
                      { matches: conflictOfKind('add-integration') },
                      { matches: editConflictWithWord('edit-integration', 'name', 'Added'), check: () => fieldEquals('name', addedName) },
                      { matches: editConflictWithWord('edit-integration', 'name', 'Edited'), check: () => fieldChangedTo('name', 'Edited') },
                      { matches: conflictOfKind('delete-integration'), check: () => fieldEquals('name', deleteName) }
                    ])

                    publishAfterMigration(editorBUuid, [1, 1, 0]).then((packageBUuid) => {
                      checkTopLevelMigratedChildren(editorBUuid, 'integrations', { added: addedName, edited: editedName, deleted: deleteName })
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

// 5 entity kinds (question, answer, choice, reference, expert) get a dedicated
// "move-<kind>" conflict (Migration.elm's changeState, not a delete+add pair) - one
// example here, on a question moved between chapters, is enough; the mechanism is
// what's being tested, not the entity kind (same reasoning kmEditorMoveEntities.js
// uses for its own single example per movable kind). Its own field, "moving-to", holds
// the destination chapter's name, not the moved question's own title - that's checked
// via the conflict's own entityName label instead, which the wrapper's test id scopes.
export function questionMovedMigration() {
  const chapterATitle = `Chapter A ${Date.now()}`
  const chapterBTitle = `Chapter B ${Date.now()}`
  const questionTitle = `Movable Question ${Date.now()}`

  createKmEditor().then(({ kmEditorUuid: editorAUuid, knowledgeModelUuid }) => {
    addChild(`km-editor-${knowledgeModelUuid}-chapters-add`).then((chapterAUuid) => {
      type(chapterAUuid, 'title', chapterATitle)

      addChild(`km-editor-${chapterAUuid}-questions-add`).then((questionUuid) => {
        type(questionUuid, 'title', questionTitle)

        cy.visitApp(`/knowledge-models/editors/${editorAUuid}`)
        addChild(`km-editor-${knowledgeModelUuid}-chapters-add`).then((chapterBUuid) => {
          type(chapterBUuid, 'title', chapterBTitle)

          publish(editorAUuid, [1, 0, 0]).then((packageAUuid) => {
            forkIndependent(packageAUuid).then((editorBUuid) => {
              forkContinuation(packageAUuid).then((editorCUuid) => {
                cy.visitApp(`/knowledge-models/editors/${editorCUuid}/edit/${questionUuid}`)
                cy.getCy('km-editor_move').click()
                cy.getCy('km-editor_move-modal').within(() => {
                  cy.get('[data-cy="km-editor_move-modal_item"]').contains(chapterBTitle).click()
                })
                cy.getCy('km-editor_move-modal_move').click()

                publish(editorCUuid, [2, 0, 0]).then((packageCUuid) => {
                  startMigration(editorBUuid, packageCUuid)
                  resolveMigration([
                    {
                      conflictTestId: 'move-question',
                      check: () => {
                        cy.getCy('km-migration_conflict_move-question').should('contain.text', questionTitle)
                        fieldEquals('moving-to', chapterBTitle)
                      }
                    }
                  ])

                  publishAfterMigration(editorBUuid, [1, 1, 0]).then((packageBUuid) => {
                    // Unlike the add/edit/delete scenarios above, nothing here has a
                    // fresh post-migration uuid to worry about - questionUuid/chapterAUuid/
                    // chapterBUuid are all shared/common ancestors, so the move's actual
                    // result can be checked directly by uuid rather than through
                    // checkChildrenList's title-based matching.
                    cy.visitApp(`/knowledge-models/editors/${editorBUuid}/edit/${chapterBUuid}`)
                    cy.get(`[data-cy="km-editor-${chapterBUuid}-questions_item_${questionUuid}"]`).should('exist')

                    cy.visitApp(`/knowledge-models/editors/${editorBUuid}/edit/${chapterAUuid}`)
                    cy.get(`[data-cy="km-editor-${chapterAUuid}-questions_item_${questionUuid}"]`).should('not.exist')

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
}
