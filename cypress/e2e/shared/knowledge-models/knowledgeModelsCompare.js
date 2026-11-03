// Knowledge Models / compare (Common.Pages.KnowledgeModels.Compare). Publishes 1.0.0
// with one chapter, then 1.1.0 continuing it with that chapter renamed and a second
// one added, and compares the two versions.
//
// The header has no data-cy - matched by its class.
import { addChild, waitForSave } from '../km-editor/editor/kmEditorAddEntities'
import { continueKmEditor, createKmEditor, deleteKnowledgeModelPackage, publishKmEditor } from './knowledgeModelsBuild'

export function compareKnowledgeModelVersions() {
  const chapterTitle = `Compare Chapter ${Date.now()}`
  const renamedChapterTitle = `Compare Chapter Renamed ${Date.now()}`
  const addedChapterTitle = `Compare Chapter Added ${Date.now()}`

  createKmEditor().then(({ kmName, kmEditorUuid, knowledgeModelUuid }) => {
    addChild(`km-editor-${knowledgeModelUuid}-chapters-add`).then((chapterUuid) => {
      cy.get(`#km-editor-${chapterUuid}-title`).type(chapterTitle)

      publishKmEditor(kmEditorUuid, [1, 0, 0]).then((v1Uuid) => {
        continueKmEditor(v1Uuid).then((next) => {
          cy.visitApp(`/knowledge-models/editors/${next.kmEditorUuid}/edit/${chapterUuid}`)
          cy.get(`#km-editor-${chapterUuid}-title`).clear().type(renamedChapterTitle)
          waitForSave()

          cy.visitApp(`/knowledge-models/editors/${next.kmEditorUuid}`)
          addChild(`km-editor-${next.knowledgeModelUuid}-chapters-add`).then((addedChapterUuid) => {
            cy.get(`#km-editor-${addedChapterUuid}-title`).type(addedChapterTitle)

            publishKmEditor(next.kmEditorUuid, [1, 1, 0]).then((v2Uuid) => {
              cy.visitApp(`/knowledge-models/compare?leftKnowledgeModelPackageId=${v1Uuid}`)

              cy.getCy('km-comparison_select-modal').within(() => {
                cy.get('#km-comparison-left-version').should('have.value', v1Uuid)

                cy.get('#km-comparison-right-trigger').click()
                cy.get('#km-comparison-right-search').type(kmName)
                // The option is keyed by the suggestion's own package uuid, which may be
                // either version's - the version is picked explicitly below instead.
                cy.get('[data-cy^="km-comparison-right_option_"]').should('have.length', 1).click()
                cy.get('#km-comparison-right-version').select(v2Uuid)

                cy.getCy('km-comparison_compare').should('not.be.disabled').click()
              })

              cy.get('.c-km-comparison__header')
                .should('contain.text', kmName)
                .and('contain.text', '1.0.0')
                .and('contain.text', '1.1.0')
              cy.getCy(`km-comparison_row_${chapterUuid}`)
                .should('have.attr', 'data-state', 'changed')
                .and('contain.text', chapterTitle)
                .and('contain.text', renamedChapterTitle)
              cy.getCy(`km-comparison_row_${addedChapterUuid}`)
                .should('have.attr', 'data-state', 'added')
                .and('contain.text', addedChapterTitle)

              deleteKnowledgeModelPackage(v1Uuid)
            })
          })
        })
      })
    })
  })
}
