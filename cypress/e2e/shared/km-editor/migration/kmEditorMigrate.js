// Migrates a forked editor onto a newer version of the knowledge model it forked
// from. Needs three editors: editorA (published 1.0.0, the common ancestor), editorB
// (forked from editorA's package, independent id - the one that gets migrated), and
// editorC (forked from the same package with edit=true, so it shares editorA's id,
// gets a new chapter added, then published 2.0.0 - the newer version editorB migrates
// onto). The "target version" select only offers newer versions of the SAME package,
// which is why editorC has to share editorA's id rather than being a separate
// knowledge model. editorC's new chapter is what gives the migration an actual
// conflict to apply - a version bump alone would produce an identical package.
//
// After the migration applies, editorB itself gets published too, to confirm the
// migrated-in chapter survives that round-trip and not just the live editor state -
// through the standalone "/publish" page the "Migration complete" screen links to,
// not the in-editor settings-tab + modal flow the other two editors use.
//
// Publish always generates a fresh package uuid, so every uuid below is read back off
// the redirect URL rather than assumed.
//
// Cleanup: packageA/packageC are the same package family (kmId), so one DELETE
// /knowledge-model-packages/:uuid?allVersions=true removes both - and cascades (DB-level,
// on its previous_package_uuid FK) to editorB too, since it was forked from that family,
// so there's nothing left for a separate editor delete to do. packageB is its own family
// (forkId), published only after the migration, so it needs its own separate cleanup.
// Date.now() alone can return the identical millisecond for calls microseconds apart
// (confirmed elsewhere in this suite's own migration diff checks), so a KM id built
// from it alone can collide with another spec's - and the "outdated" check that drives
// KM migration matches editors by this exact id string across their whole package
// family, so a collision silently merges two unrelated knowledge models into one
// "family" for that lookup. The random suffix makes collisions effectively impossible.
function uniqueId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function migrateForkedEditor() {
  const kmId = uniqueId('km')
  const kmName = `Test KM ${Date.now()}`
  const forkName = `Test KM Fork ${Date.now()}`
  const forkId = uniqueId('km-fork')
  const newChapterTitle = `New Chapter ${Date.now()}`
  let newChapterUuid

  // The KM root entity's own uuid - used to build data-cy/id selectors for its direct
  // children (e.g. "chapters-add") - is nil only for an editor created from scratch.
  // A forked editor (continuation or independent) inherits a real, non-nil uuid from
  // its parent package's own event chain, so it has to be read back from the editor's
  // own GET response rather than assumed.
  const getKnowledgeModelUuid = (editorUuid) =>
    cy.apiToken().then((token) =>
      cy.request({
        method: 'GET',
        url: `${Cypress.expose('apiUrl')}/knowledge-model-editors/${editorUuid}`,
        headers: { Authorization: `Bearer ${token}` }
      }).then((response) => response.body.knowledgeModel.uuid)
    )

  // For an editor that hasn't just migrated, publishing happens from within the editor
  // itself: version/license/description/readme are set on its own settings tab, then
  // its "Publish" button opens a read-only confirm recapping them. (An editor that just
  // finished a migration uses the different standalone "/publish" page instead - see
  // `publishAfterMigration` below.)
  //
  // Clicking "form-submit" on the settings tab does not itself block navigation while
  // its save PUT is in flight, so navigating away immediately can abort it - the
  // version bump (or license/description/readme) would simply never get saved.
  // The "form-unsaved" bar stays visible until the save actually succeeds, so that's the
  // signal to wait on before leaving the page.
  const publish = (editorUuid, major, minor, patch) => {
    cy.visitApp(`/knowledge-models/editors/${editorUuid}/settings`)
    cy.getField('versionMajor').clear().type(String(major))
    cy.getField('versionMinor').clear().type(String(minor))
    cy.getField('versionPatch').clear().type(String(patch))
    cy.getField('license').type('MIT')
    cy.getField('description').type('Published by the KM Editor / migrate E2E spec.')
    // "readme" is a markdown editor - needs the mode switch before it's typeable.
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
  // ("km-migration_publish") to a DIFFERENT, standalone "/publish" page - not the in-editor
  // settings-tab + modal flow `publish` above uses. That page's own version fields are
  // "major"/"minor"/"patch" (not "versionMajor" etc.), and its submit button is
  // "km-publish_publish-button". It redirects to the published package on success, same
  // as the in-editor flow, so no extra wait is needed around its own submit.
  const publishAfterMigration = (editorUuid, major, minor, patch) => {
    cy.getCy('km-migration_publish').click()
    cy.url().should('match', new RegExp(`/knowledge-models/editors/${editorUuid}/publish$`))

    cy.getField('major').clear().type(String(major))
    cy.getField('minor').clear().type(String(minor))
    cy.getField('patch').clear().type(String(patch))
    cy.getField('description').type('Published after migration by the KM Editor / migrate E2E spec.')
    cy.getCy('markdown-editor_mode-markdown').click()
    cy.getField('readme').type('# Readme')
    cy.getCy('km-publish_publish-button').click()

    return cy.url()
      .should('match', /\/knowledge-models\/[0-9a-f-]{36}$/)
      .then((publishedUrl) => publishedUrl.split('/').pop())
  }

  // editorA, published as 1.0.0.
  cy.visitApp('/knowledge-models/editors/create')
  cy.getField('name').type(kmName)
  cy.getField('id').clear().type(kmId)
  cy.getField('versionMajor').clear().type('1')
  cy.getField('versionMinor').clear().type('0')
  cy.getField('versionPatch').clear().type('0')
  cy.getCy('form-submit').click()

  cy.url()
    .should('match', /\/knowledge-models\/editors\/[0-9a-f-]{36}$/)
    .then((editorAUrl) => {
      const editorAUuid = editorAUrl.split('/').pop()

      publish(editorAUuid, 1, 0, 0).then((packageAUuid) => {
        // editorB, forked (no "edit") - independent identity, based on packageA.
        cy.visitApp(`/knowledge-models/editors/create?selected=${packageAUuid}`)
        cy.getField('name').type(forkName)
        cy.getField('id').clear().type(forkId)
        cy.getField('versionMajor').clear().type('1')
        cy.getField('versionMinor').clear().type('0')
        cy.getField('versionPatch').clear().type('0')
        cy.getCy('form-submit').click()

        cy.url()
          .should('match', /\/knowledge-models\/editors\/[0-9a-f-]{36}$/)
          .then((editorBUrl) => {
            const editorBUuid = editorBUrl.split('/').pop()

            // editorC, "edit=true" - same id/name as editorA's package, continuing
            // its own version line. "edit=true" pre-fills name/id/language from the
            // parent package, but NOT version - that starts empty here too and is
            // required, so it still has to be typed.
            cy.visitApp(`/knowledge-models/editors/create?selected=${packageAUuid}&edit=true`)
            cy.getField('versionMajor').type('1')
            cy.getField('versionMinor').type('0')
            cy.getField('versionPatch').type('0')
            cy.getCy('form-submit').click()

            cy.url()
              .should('match', /\/knowledge-models\/editors\/[0-9a-f-]{36}$/)
              .then((editorCUrl) => {
                const editorCUuid = editorCUrl.split('/').pop()

                // A version bump alone produces an identical package - migration needs
                // an actual content change to generate a conflict for apply-all to resolve.
                getKnowledgeModelUuid(editorCUuid).then((editorCKnowledgeModelUuid) => {
                  cy.get(`#km-editor-${editorCKnowledgeModelUuid}-chapters-add`).click()
                  cy.url()
                    .should('match', /\/edit\/[0-9a-f-]{36}$/)
                    .then((editUrl) => {
                      newChapterUuid = editUrl.split('/').pop()
                      cy.get(`#km-editor-${newChapterUuid}-title`).type(newChapterTitle)
                    })
                  cy.wait(1200)
                  cy.getCy('saving-indicator').should('not.have.attr', 'data-state', 'saving')
                })

                publish(editorCUuid, 2, 0, 0).then((packageCUuid) => {
                  // editorB is now outdated: packageA has a newer version (packageC).
                  // Opens the update modal via the row's own "update available" badge
                  // rather than the kebab's "Update" action - both open the exact same
                  // modal (confirmed by containsUpdateOptionAndBadge in
                  // kmEditorMigrationMechanics.js, which tests the kebab path
                  // directly), but the kebab's menu reliably closes itself right after
                  // opening whenever this badge is also on the row.
                  cy.visitApp('/knowledge-models/editors')
                  cy.getCy(`listing-item_${editorBUuid}`).find('[data-cy="listing-item_badge_update-available"]').click()

                  cy.getCy('km-editor-update').within(() => {
                    cy.getField('targetPackageUuid').select(packageCUuid)
                    cy.getCy('form-submit').click()
                  })

                  cy.url().should('match', new RegExp(`/knowledge-models/editors/${editorBUuid}/migration$`))
                  cy.getCy('km-migration_apply-all').click()
                  cy.getCy('km-migration_publish').should('exist')

                  // The migrated-in chapter should survive not just the migration itself,
                  // but a subsequent publish of editorB too.
                  publishAfterMigration(editorBUuid, 1, 1, 0).then((packageBUuid) => {
                    cy.visitApp(`/knowledge-models/editors/${editorBUuid}`)
                    cy.getCy(`km-editor_tree_entity_${newChapterUuid}`).should('contain.text', newChapterTitle)

                    // packageB is its own KM id family (forkId), separate from packageA/C's
                    // (kmId) - packageA's cascade delete doesn't reach it.
                    cy.apiToken().then((token) => {
                      cy.request({
                        method: 'DELETE',
                        url: `${Cypress.expose('apiUrl')}/knowledge-model-packages/${packageBUuid}?allVersions=true`,
                        headers: { Authorization: `Bearer ${token}` }
                      })
                      cy.request({
                        method: 'DELETE',
                        url: `${Cypress.expose('apiUrl')}/knowledge-model-packages/${packageAUuid}?allVersions=true`,
                        headers: { Authorization: `Bearer ${token}` }
                      })
                    })
                  })
                })
              })
          })
      })
    })
}
