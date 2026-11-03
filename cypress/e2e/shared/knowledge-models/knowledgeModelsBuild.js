// Builds small knowledge models through the KM editor UI for the compare/resource
// page specs - same flow as km-editor/migration/*.js (create, add entities, publish
// from the editor's settings tab, continue a published package as its next version).
import { getKnowledgeModelUuid, waitForSave } from '../km-editor/editor/kmEditorAddEntities'

export function createKmEditor() {
  const kmId = `km-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
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
    .then((kmEditorUuid) => getKnowledgeModelUuid(kmEditorUuid).then((knowledgeModelUuid) => ({ kmId, kmName, kmEditorUuid, knowledgeModelUuid })))
}

// "edit=true" pre-fills name/id from the parent package; version starts empty.
export function continueKmEditor(packageUuid) {
  cy.visitApp(`/knowledge-models/editors/create?selected=${packageUuid}&edit=true`)
  cy.getField('versionMajor').type('1')
  cy.getField('versionMinor').type('0')
  cy.getField('versionPatch').type('0')
  cy.getCy('form-submit').click()

  return cy.url()
    .should('match', /\/knowledge-models\/editors\/[0-9a-f-]{36}$/)
    .then((url) => url.split('/').pop())
    .then((kmEditorUuid) => getKnowledgeModelUuid(kmEditorUuid).then((knowledgeModelUuid) => ({ kmEditorUuid, knowledgeModelUuid })))
}

// Publishing removes the editor, leaving only the package to clean up.
export function publishKmEditor(kmEditorUuid, [major, minor, patch]) {
  waitForSave()

  cy.visitApp(`/knowledge-models/editors/${kmEditorUuid}/settings`)
  cy.getField('versionMajor').clear().type(String(major))
  cy.getField('versionMinor').clear().type(String(minor))
  cy.getField('versionPatch').clear().type(String(patch))
  cy.getField('license').type('MIT')
  cy.getField('description').type('Published by the Knowledge Models E2E suite.')
  cy.getCy('markdown-editor_mode-markdown').click()
  cy.getField('readme').type('# Readme')
  cy.getCy('form-submit').click()
  cy.getCy('form-unsaved').should('have.attr', 'hidden')

  cy.visitApp(`/knowledge-models/editors/${kmEditorUuid}`)
  cy.getCy('km-editor_publish').click()
  cy.getCy('km-editor_publish-modal_confirm').click()

  return cy.url()
    .should('match', /\/knowledge-models\/[0-9a-f-]{36}$/)
    .then((url) => url.split('/').pop())
}

export function deleteKnowledgeModelPackage(packageUuid) {
  cy.apiToken().then((token) => {
    cy.request({
      method: 'DELETE',
      url: `${Cypress.expose('apiUrl')}/knowledge-model-packages/${packageUuid}?allVersions=true`,
      headers: { Authorization: `Bearer ${token}` }
    })
  })
}
