// Pushes a raw WebSocket frame as if from another client (cy.wsSendAs), rather than
// opening a second browser, to test real-time collaboration. A chapter's parent is
// the knowledge model itself, whose own uuid is generated per editor (Shared.Service.
// KnowledgeModel.Editor.EditorService.getEditorByUuid folds in the editor's own
// AddKnowledgeModelEvent) rather than fixed - the backend's validateWebsocketEditorEvent
// rejects an AddChapterEvent whose parentUuid doesn't match a real existing entity, so
// it has to be fetched rather than assumed; a nested entity's parentUuid would be that
// parent's own real uuid instead, same as always.
//
// The whole point here is to see the push land live, with no reload - so the title is
// checked via the KM root's own "chapters" children list (rendered in its own page
// body alongside the root-level add triggers, same as any parent entity's children
// list - see kmEditorMoveEntities.js), right on the page already open, rather than by
// navigating to the new chapter's own edit page.
export function pushChapterOverWebsocket() {
  const kmId = `km-${Date.now()}`
  const kmName = `Test KM ${Date.now()}`
  const chapterTitle = 'Pushed via websocket'
  const chapterUuid = crypto.randomUUID()

  cy.visitApp('/knowledge-models/editors/create')
  cy.getField('name').type(kmName)
  cy.getField('id').clear().type(kmId)
  cy.getField('versionMajor').clear().type('1')
  cy.getField('versionMinor').clear().type('0')
  cy.getField('versionPatch').clear().type('0')
  cy.getCy('form-submit').click()

  cy.url()
    .should('match', /\/knowledge-models\/editors\/[0-9a-f-]{36}$/)
    .then((url) => {
      const kmEditorUuid = url.split('/').pop()

      cy.apiToken().then((token) => {
        cy.request({
          method: 'GET',
          url: `${Cypress.expose('apiUrl')}/knowledge-model-editors/${kmEditorUuid}`,
          headers: { Authorization: `Bearer ${token}` }
        }).then(({ body }) => {
          const rootUuid = body.knowledgeModel.uuid

          cy.getCy(`km-editor_tree_entity_${chapterUuid}`).should('not.exist')
          cy.wsSendAs('dataSteward', `/knowledge-model-editors/${kmEditorUuid}/websocket`, {
            type: 'SetContent_ClientKnowledgeModelEditorMessage',
            data: {
              type: 'AddKnowledgeModelEditorWebSocketEvent',
              uuid: crypto.randomUUID(),
              event: {
                uuid: crypto.randomUUID(),
                parentUuid: rootUuid,
                entityUuid: chapterUuid,
                content: { eventType: 'AddChapterEvent', title: chapterTitle, text: null, annotations: [] },
                createdAt: new Date().toISOString()
              }
            }
          })

          cy.getCy(`km-editor_tree_entity_${chapterUuid}`).should('exist')

          cy.get(`[data-cy="km-editor-${rootUuid}-chapters_item_${chapterUuid}"]`)
            .should('contain.text', chapterTitle)
        })
      })

      cy.apiToken().then((token) => {
        cy.request({
          method: 'DELETE',
          url: `${Cypress.expose('apiUrl')}/knowledge-model-editors/${kmEditorUuid}`,
          headers: { Authorization: `Bearer ${token}` }
        })
      })
    })
}
