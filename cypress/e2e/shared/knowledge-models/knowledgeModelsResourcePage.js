// Knowledge Models / resource page (Common.Pages.KnowledgeModels.ResourcePage) -
// publishes a KM with one resource collection and page, then opens the page's own
// route on the published package.
import { addChild, typeMarkdown } from '../km-editor/editor/kmEditorAddEntities'
import { createKmEditor, deleteKnowledgeModelPackage, publishKmEditor } from './knowledgeModelsBuild'

export function openResourcePage() {
  const resourceCollectionTitle = `Test Resource Collection ${Date.now()}`
  const resourcePageTitle = `Test Resource Page ${Date.now()}`
  const resourcePageContent = `Test resource page content ${Date.now()}`

  createKmEditor().then(({ kmEditorUuid, knowledgeModelUuid }) => {
    addChild(`km-editor-${knowledgeModelUuid}-resourceCollections-add`).then((resourceCollectionUuid) => {
      cy.get(`#km-editor-${resourceCollectionUuid}-title`).type(resourceCollectionTitle)

      addChild(`km-editor-${resourceCollectionUuid}-resourcePages-add`).then((resourcePageUuid) => {
        cy.get(`#km-editor-${resourcePageUuid}-title`).type(resourcePageTitle)
        typeMarkdown(`km-editor-${resourcePageUuid}-content`, resourcePageContent)

        publishKmEditor(kmEditorUuid, [1, 0, 0]).then((packageUuid) => {
          cy.visitApp(`/knowledge-models/${packageUuid}/resource-pages/${resourcePageUuid}`)
          cy.get('#ui-main-heading').should('contain.text', resourcePageTitle)
          cy.get('body').should('contain.text', resourceCollectionTitle).and('contain.text', resourcePageContent)

          deleteKnowledgeModelPackage(packageUuid)
        })
      })
    })
  })
}
