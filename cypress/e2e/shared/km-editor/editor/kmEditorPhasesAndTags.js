// Mirrors dsw-e2e-tests' own phases.spec.js/tags.spec.js: a question's "requiredPhase"
// (single select) and "tags" (checkboxes, id "km-editor-<uuid>-tags", but with no
// per-option id/data-cy on the individual checkbox inputs - matched by
// `input[value="<uuid>"]`) are the SAME state as the /phases and /question-tags matrix
// pages' own per-cell checkboxes (data-cy "km-editor_phases_<questionUuid>_<phaseUuid>"
// / "km-editor_question-tags_<questionUuid>_<tagUuid>") - setting either one is
// reflected in the other, and persists across a reload. Three tests per field, matching
// dsw-e2e-tests' own breadth: newly created is visible in both places, set via the
// question syncs to the matrix (surviving a reload), set via the matrix syncs to the
// question (surviving a reload).
//
// Adding an entity navigates straight to its own edit route (its uuid comes from the
// resulting URL, not a separate list-item link). Root-level ids ("chapters-add"/
// "tags-add"/"phases-add") are keyed by the knowledge model's own entity uuid, a real
// uuid generated per editor (fetched via createKmEditor below), not the KM editor's
// own uuid.

function createKmEditor() {
  const kmId = `km-${Date.now()}`
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
    .then((kmEditorUuid) => {
      return cy.apiToken().then((token) => {
        return cy.request({
          method: 'GET',
          url: `${Cypress.expose('apiUrl')}/knowledge-model-editors/${kmEditorUuid}`,
          headers: { Authorization: `Bearer ${token}` }
        }).then(({ body }) => ({ kmEditorUuid, knowledgeModelUuid: body.knowledgeModel.uuid }))
      })
    })
}

function addChild(triggerId) {
  cy.get(`#${triggerId}`).click()
  return cy.url()
    .should('match', /\/edit\/[0-9a-f-]{36}$/)
    .then((url) => url.split('/').pop())
}

function waitForSave() {
  cy.wait(1200)
  cy.getCy('saving-indicator').should('not.have.attr', 'data-state', 'saving')
}

function deleteKmEditor(kmEditorUuid) {
  cy.apiToken().then((token) => {
    cy.request({
      method: 'DELETE',
      url: `${Cypress.expose('apiUrl')}/knowledge-model-editors/${kmEditorUuid}`,
      headers: { Authorization: `Bearer ${token}` }
    })
  })
}

function createChapterWithQuestion() {
  return createKmEditor().then(({ kmEditorUuid, knowledgeModelUuid }) => {
    return addChild(`km-editor-${knowledgeModelUuid}-chapters-add`).then((chapterUuid) => {
      return addChild(`km-editor-${chapterUuid}-questions-add`).then((questionUuid) => {
        return { kmEditorUuid, questionUuid, knowledgeModelUuid }
      })
    })
  })
}

function tagCheckbox(questionUuid, tagUuid) {
  return `#km-editor-${questionUuid}-tags input[value="${tagUuid}"]`
}

// ---- Phases ----

export function newPhaseAppearsOnQuestionAndInPhaseMatrix() {
  const phaseTitle = `Phase ${Date.now()}`

  createChapterWithQuestion().then(({ kmEditorUuid, questionUuid, knowledgeModelUuid }) => {
    cy.visitApp(`/knowledge-models/editors/${kmEditorUuid}`)
    addChild(`km-editor-${knowledgeModelUuid}-phases-add`).then((phaseUuid) => {
      cy.get(`#km-editor-${phaseUuid}-title`).type(phaseTitle)
      waitForSave()

      cy.visitApp(`/knowledge-models/editors/${kmEditorUuid}/edit/${questionUuid}`)
      cy.get(`#km-editor-${questionUuid}-requiredPhase`).find(`option[value="${phaseUuid}"]`).should('exist')

      cy.visitApp(`/knowledge-models/editors/${kmEditorUuid}/phases`)
      cy.getCy(`km-editor_phases_${questionUuid}_${phaseUuid}`).should('exist')

      deleteKmEditor(kmEditorUuid)
    })
  })
}

export function selectingPhaseOnQuestionReflectsInPhaseMatrix() {
  const phaseTitle = `Phase ${Date.now()}`

  createChapterWithQuestion().then(({ kmEditorUuid, questionUuid, knowledgeModelUuid }) => {
    cy.visitApp(`/knowledge-models/editors/${kmEditorUuid}`)
    addChild(`km-editor-${knowledgeModelUuid}-phases-add`).then((phaseUuid) => {
      cy.get(`#km-editor-${phaseUuid}-title`).type(phaseTitle)
      waitForSave()

      cy.visitApp(`/knowledge-models/editors/${kmEditorUuid}/edit/${questionUuid}`)
      cy.get(`#km-editor-${questionUuid}-requiredPhase`).select(phaseUuid)
      waitForSave()

      cy.visitApp(`/knowledge-models/editors/${kmEditorUuid}/edit/${questionUuid}`)
      cy.get(`#km-editor-${questionUuid}-requiredPhase`).should('have.value', phaseUuid)

      cy.visitApp(`/knowledge-models/editors/${kmEditorUuid}/phases`)
      cy.getCy(`km-editor_phases_${questionUuid}_${phaseUuid}`).should('be.checked')

      deleteKmEditor(kmEditorUuid)
    })
  })
}

export function selectingPhaseInMatrixReflectsOnQuestion() {
  const phaseTitle = `Phase ${Date.now()}`

  createChapterWithQuestion().then(({ kmEditorUuid, questionUuid, knowledgeModelUuid }) => {
    cy.visitApp(`/knowledge-models/editors/${kmEditorUuid}`)
    addChild(`km-editor-${knowledgeModelUuid}-phases-add`).then((phaseUuid) => {
      cy.get(`#km-editor-${phaseUuid}-title`).type(phaseTitle)
      waitForSave()

      cy.visitApp(`/knowledge-models/editors/${kmEditorUuid}/phases`)
      cy.getCy(`km-editor_phases_${questionUuid}_${phaseUuid}`).click()
      waitForSave()

      cy.visitApp(`/knowledge-models/editors/${kmEditorUuid}/phases`)
      cy.getCy(`km-editor_phases_${questionUuid}_${phaseUuid}`).should('be.checked')

      cy.visitApp(`/knowledge-models/editors/${kmEditorUuid}/edit/${questionUuid}`)
      cy.get(`#km-editor-${questionUuid}-requiredPhase`).should('have.value', phaseUuid)

      deleteKmEditor(kmEditorUuid)
    })
  })
}

// ---- Tags ----

export function newTagAppearsOnQuestionAndInTagMatrix() {
  const tagName = `Tag ${Date.now()}`

  createChapterWithQuestion().then(({ kmEditorUuid, questionUuid, knowledgeModelUuid }) => {
    cy.visitApp(`/knowledge-models/editors/${kmEditorUuid}`)
    addChild(`km-editor-${knowledgeModelUuid}-tags-add`).then((tagUuid) => {
      cy.get(`#km-editor-${tagUuid}-name`).type(tagName)
      waitForSave()

      cy.visitApp(`/knowledge-models/editors/${kmEditorUuid}/edit/${questionUuid}`)
      cy.get(tagCheckbox(questionUuid, tagUuid)).should('exist')

      cy.visitApp(`/knowledge-models/editors/${kmEditorUuid}/question-tags`)
      cy.getCy(`km-editor_question-tags_${questionUuid}_${tagUuid}`).should('exist')

      deleteKmEditor(kmEditorUuid)
    })
  })
}

export function selectingTagOnQuestionReflectsInTagMatrix() {
  const tagName = `Tag ${Date.now()}`

  createChapterWithQuestion().then(({ kmEditorUuid, questionUuid, knowledgeModelUuid }) => {
    cy.visitApp(`/knowledge-models/editors/${kmEditorUuid}`)
    addChild(`km-editor-${knowledgeModelUuid}-tags-add`).then((tagUuid) => {
      cy.get(`#km-editor-${tagUuid}-name`).type(tagName)
      waitForSave()

      cy.visitApp(`/knowledge-models/editors/${kmEditorUuid}/edit/${questionUuid}`)
      cy.get(tagCheckbox(questionUuid, tagUuid)).click()
      waitForSave()

      cy.visitApp(`/knowledge-models/editors/${kmEditorUuid}/edit/${questionUuid}`)
      cy.get(tagCheckbox(questionUuid, tagUuid)).should('be.checked')

      cy.visitApp(`/knowledge-models/editors/${kmEditorUuid}/question-tags`)
      cy.getCy(`km-editor_question-tags_${questionUuid}_${tagUuid}`).should('be.checked')

      deleteKmEditor(kmEditorUuid)
    })
  })
}

export function selectingTagInMatrixReflectsOnQuestion() {
  const tagName = `Tag ${Date.now()}`

  createChapterWithQuestion().then(({ kmEditorUuid, questionUuid, knowledgeModelUuid }) => {
    cy.visitApp(`/knowledge-models/editors/${kmEditorUuid}`)
    addChild(`km-editor-${knowledgeModelUuid}-tags-add`).then((tagUuid) => {
      cy.get(`#km-editor-${tagUuid}-name`).type(tagName)
      waitForSave()

      cy.visitApp(`/knowledge-models/editors/${kmEditorUuid}/question-tags`)
      cy.getCy(`km-editor_question-tags_${questionUuid}_${tagUuid}`).click()
      waitForSave()

      cy.visitApp(`/knowledge-models/editors/${kmEditorUuid}/question-tags`)
      cy.getCy(`km-editor_question-tags_${questionUuid}_${tagUuid}`).should('be.checked')

      cy.visitApp(`/knowledge-models/editors/${kmEditorUuid}/edit/${questionUuid}`)
      cy.get(tagCheckbox(questionUuid, tagUuid)).should('be.checked')

      deleteKmEditor(kmEditorUuid)
    })
  })
}
