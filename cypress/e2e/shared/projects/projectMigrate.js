// Projects / migrate - moving a project onto a newer version of its own knowledge
// model package, via the kebab menu's "Create migration". Migrating a project it owns
// is permission-free, but building the newer KM version to migrate onto needs
// knowledgeModels.useEditor/manage - the wrapper spec logs in as Data Steward, not
// Researcher, for that reason alone.
//
// The newer version is built by continuing the SAME package through the KM listing's
// own "Create KM editor" action (not a hand-rolled bundle import) - adding a new
// chapter/question this way, then publishing as 2.0.0, is the same safe path
// questionTypeKms.js uses, and sidesteps basic-km.json's own event-sourced bundle
// JSON entirely (see that file's header comment for why hand-authoring bundle events
// isn't safe to do by hand). "Create KM editor" with "edit=true" prefills name/id from
// the source package - the version fields aren't prefilled though, only offered as
// suggestion chips next to them (see knowledgeModelsActions.js's own "Create KM
// editor" comment), so they're typed directly here same as everywhere else.
//
// Migrating a project happens in place - Common.Pages.Projects.CreateMigration
// navigates back to the SAME project uuid on success, not a new one (confirmed by its
// own source: `Routes.navigate appState (Routes.projectsDetail project.uuid)`). What
// actually changed is checked by answering the new chapter's question, present only in
// 2.0.0 - a project-uuid-equality assertion alone doesn't prove anything migrated.
//
// Deletes the project, the km-editor and the whole KM package family (both versions)
// at the end - the earlier test run that created the family is still responsible for
// cy.cleanupKnowledgeModelPackage at its own start, so this one only has to handle
// what it itself has an open handle to.
import { addChild, deleteKmEditor, getKnowledgeModelUuid, waitForSave } from '../km-editor/editor/kmEditorAddEntities'

export function migrateProject() {
  const newChapterTitle = `Migration Chapter ${Date.now()}`
  const newQuestionTitle = `Migration Question ${Date.now()}`
  const migrationAnswer = `Migration answer ${Date.now()}`

  cy.fixture('shared/basic-km.json').then((fixture) => {
    cy.cleanupKnowledgeModelPackage(fixture.id)

    cy.importKM('shared/basic-km.json').then((kmPackage) => {
      const projectName = `Test Migration Project ${Date.now()}`

      cy.visitApp('/projects/create')
      cy.getField('name').type(projectName)
      cy.getField('knowledgeModelPackageUuid').click()
      cy.focused().type('Basic KM')
      cy.getCy(`form-knowledgeModelPackageUuid_option_${kmPackage.uuid}`).click()
      cy.getCy('form-submit').click()

      cy.url()
        .should('match', /\/projects\/[0-9a-f-]{36}/).waitForPageFocus()
        .then((url) => {
          const projectUuid = url.match(/\/projects\/([0-9a-f-]{36})/)[1]

          cy.visitApp('/knowledge-models')
          cy.openListingItemActions(kmPackage.uuid, 'listing-item_action_create-km-editor').click()

          cy.getField('versionMajor').clear().type('2')
          cy.getField('versionMinor').clear().type('0')
          cy.getField('versionPatch').clear().type('0')
          cy.getCy('form-submit').click()

          cy.url()
            .should('match', /\/knowledge-models\/editors\/[0-9a-f-]{36}$/)
            .then((editorUrl) => {
              const kmEditorUuid = editorUrl.split('/').pop()

              // The root "knowledgeModel" entity's own uuid (not the editor's own
              // uuid, which keys entities instead) - generated per editor, so it has
              // to come from the backend rather than be assumed (kmEditorAddEntities.js's
              // own getKnowledgeModelUuid comment).
              getKnowledgeModelUuid(kmEditorUuid).then((rootKmUuid) => {
                cy.apiToken().then((token) => {
                  addChild(`km-editor-${rootKmUuid}-chapters-add`).then((newChapterUuid) => {
                    cy.get(`#km-editor-${newChapterUuid}-title`).type(newChapterTitle)
                    // Waited for here, not just once at the end - addChild below
                    // navigates to the new question's own edit route, unmounting this
                    // title field before its 1s debounce necessarily flushes (a
                    // same-page route change still drops it, not just a full
                    // cy.visitApp reload).
                    waitForSave()

                    addChild(`km-editor-${newChapterUuid}-questions-add`).then((newQuestionUuid) => {
                      // A fresh question defaults to Options, not Value (see
                      // kmEditorAddEntities.js's addOptionsQuestionToKmEditor) - needs
                      // picking explicitly for cy.getQuestionnaireField's plain
                      // "#value_<path>" input to exist at all.
                      cy.get(`#km-editor-${newQuestionUuid}-type`).select('Value')
                      cy.get(`#km-editor-${newQuestionUuid}-title`).type(newQuestionTitle)
                      waitForSave()

                      cy.visitApp(`/knowledge-models/editors/${kmEditorUuid}`)
                      cy.getCy('km-editor_publish').click()
                      cy.getCy('km-editor_publish-modal_confirm').click()

                      cy.url()
                        .should('match', /\/knowledge-models\/[0-9a-f-]{36}$/)
                        .then(() => {
                          cy.visitApp(`/projects/create-migration/${projectUuid}`)

                          // The version <select> below reuses the
                          // "knowledgeModelPackageUuid" field name from Create's KM
                          // picker, despite being a different field (pre-filled to the
                          // project's current version) - picking "2.0.0" here is the
                          // actual migration.
                          cy.get('#project-migration-knowledge-model').should('contain.text', 'Basic KM')
                          cy.getField('knowledgeModelPackageUuid').select('2.0.0')
                          cy.getCy('form-submit').click()

                          // Still the same project - not a new one.
                          cy.url().should('match', new RegExp(`/projects/${projectUuid}$`))

                          const newQuestionPath = `${newChapterUuid}.${newQuestionUuid}`
                          cy.getCy(`questionnaire_chapter-nav_${newChapterUuid}`).click()
                          cy.getQuestionnaireField(newQuestionPath).type(migrationAnswer)
                          cy.getQuestionnaireField(newQuestionPath).blur()
                          waitForSave()

                          cy.reload()
                          cy.getCy(`questionnaire_chapter-nav_${newChapterUuid}`).click()
                          cy.getQuestionnaireField(newQuestionPath).should('have.value', migrationAnswer)

                          cy.request({
                            method: 'DELETE',
                            url: `${Cypress.expose('apiUrl')}/projects/${projectUuid}`,
                            headers: { Authorization: `Bearer ${token}` }
                          })
                          deleteKmEditor(kmEditorUuid)
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
