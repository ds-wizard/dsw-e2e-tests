// Every warning Common.Pages.KMEditor.Editor.Warnings computes from a field/shape
// left empty or invalid, one test each - except the Integration entity's own cluster
// (empty name, malformed request URL, unknown Jinja variables/secrets, no plugin
// selected, and several that need an actual loaded test-data response) and the
// closely related "Missing variables for integration question" warning, which depends
// on the same declared-variables configuration - all deliberately out of scope here,
// same reasoning as the mock-HTTP-server-dependent integration flow documented in
// kmEditorAddEntities.js.
//
// Neither the Warnings panel's own toggle button nor its warning rows carry data-cy,
// so both are selected by visible text (the sanctioned cy.contains() exception used
// elsewhere for upstream gaps) - confirmed still the only way to reach them. Clicking a
// row is a real in-app navigation (Nav.pushUrl) straight to the offending entity's own
// edit page, not a hard reload, so no wait-for-save is needed anywhere in this file -
// nothing here reopens or reloads.
//
// Adding an entity navigates straight to its own edit route (its uuid comes from the
// resulting URL, not a separate list-item link). Root-level add triggers
// ("chapters-add", "metrics-add", ...) are keyed by the knowledge model's own entity
// uuid, a real uuid generated per editor (fetched via createKmEditor below), not the
// KM editor's own uuid.

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

function deleteKmEditor(kmEditorUuid) {
  cy.apiToken().then((token) => {
    cy.request({
      method: 'DELETE',
      url: `${Cypress.expose('apiUrl')}/knowledge-model-editors/${kmEditorUuid}`,
      headers: { Authorization: `Bearer ${token}` }
    })
  })
}

// Opens the Warnings panel, confirms the given warning is listed, clicks it, and
// confirms it navigated to the offending entity's own edit page.
function checkWarningNavigatesTo(kmEditorUuid, warningText, entityUuid) {
  cy.getCy('km-editor_panel_warnings').click()
  // An entity can have several warnings, so the message picks among its own.
  cy.contains(`[data-cy^="km-editor_warning_${entityUuid}"]`, warningText).click()
  cy.url().should('match', new RegExp(`/knowledge-models/editors/${kmEditorUuid}/edit/${entityUuid}$`))
}

function createChapterWithQuestion(questionType) {
  return createKmEditor().then(({ kmEditorUuid, knowledgeModelUuid }) => {
    return addChild(`km-editor-${knowledgeModelUuid}-chapters-add`).then((chapterUuid) => {
      cy.get(`#km-editor-${chapterUuid}-title`).type(`Chapter ${Date.now()}`)
      return addChild(`km-editor-${chapterUuid}-questions-add`).then((questionUuid) => {
        if (questionType) {
          cy.get(`#km-editor-${questionUuid}-type`).select(questionType)
        }
        return cy.wrap({ kmEditorUuid, chapterUuid, questionUuid })
      })
    })
  })
}

export function emptyChapterTitleWarning() {
  createKmEditor().then(({ kmEditorUuid, knowledgeModelUuid }) => {
    addChild(`km-editor-${knowledgeModelUuid}-chapters-add`).then((chapterUuid) => {
      checkWarningNavigatesTo(kmEditorUuid, 'Empty title for chapter', chapterUuid)
      deleteKmEditor(kmEditorUuid)
    })
  })
}

export function emptyQuestionTitleWarning() {
  createChapterWithQuestion().then(({ kmEditorUuid, questionUuid }) => {
    checkWarningNavigatesTo(kmEditorUuid, 'Empty title for question', questionUuid)
    deleteKmEditor(kmEditorUuid)
  })
}

export function noAnswersForOptionsQuestionWarning() {
  createChapterWithQuestion().then(({ kmEditorUuid, questionUuid }) => {
    cy.get(`#km-editor-${questionUuid}-title`).type(`Question ${Date.now()}`)
    checkWarningNavigatesTo(kmEditorUuid, 'No answers for options question', questionUuid)
    deleteKmEditor(kmEditorUuid)
  })
}

export function noItemQuestionsForListQuestionWarning() {
  createChapterWithQuestion('List').then(({ kmEditorUuid, questionUuid }) => {
    cy.get(`#km-editor-${questionUuid}-title`).type(`Question ${Date.now()}`)
    checkWarningNavigatesTo(kmEditorUuid, 'No item questions for list question', questionUuid)
    deleteKmEditor(kmEditorUuid)
  })
}

export function noListQuestionSelectedForItemSelectQuestionWarning() {
  createChapterWithQuestion('ItemSelect').then(({ kmEditorUuid, questionUuid }) => {
    cy.get(`#km-editor-${questionUuid}-title`).type(`Question ${Date.now()}`)
    checkWarningNavigatesTo(kmEditorUuid, 'No list question selected for item select question', questionUuid)
    deleteKmEditor(kmEditorUuid)
  })
}

export function noChoicesForMultiChoiceQuestionWarning() {
  createChapterWithQuestion('MultiChoice').then(({ kmEditorUuid, questionUuid }) => {
    cy.get(`#km-editor-${questionUuid}-title`).type(`Question ${Date.now()}`)
    checkWarningNavigatesTo(kmEditorUuid, 'No choices for multi-choice question', questionUuid)
    deleteKmEditor(kmEditorUuid)
  })
}

export function noIntegrationSelectedForIntegrationQuestionWarning() {
  createChapterWithQuestion('Integration').then(({ kmEditorUuid, questionUuid }) => {
    cy.get(`#km-editor-${questionUuid}-title`).type(`Question ${Date.now()}`)
    checkWarningNavigatesTo(kmEditorUuid, 'No integration selected for integration question', questionUuid)
    deleteKmEditor(kmEditorUuid)
  })
}

export function emptyAnswerLabelWarning() {
  createChapterWithQuestion().then(({ kmEditorUuid, questionUuid }) => {
    cy.get(`#km-editor-${questionUuid}-title`).type(`Question ${Date.now()}`)
    addChild(`km-editor-${questionUuid}-answers-add`).then((answerUuid) => {
      checkWarningNavigatesTo(kmEditorUuid, 'Empty label for answer', answerUuid)
      deleteKmEditor(kmEditorUuid)
    })
  })
}

export function emptyChoiceLabelWarning() {
  createChapterWithQuestion('MultiChoice').then(({ kmEditorUuid, questionUuid }) => {
    cy.get(`#km-editor-${questionUuid}-title`).type(`Question ${Date.now()}`)
    addChild(`km-editor-${questionUuid}-choices-add`).then((choiceUuid) => {
      checkWarningNavigatesTo(kmEditorUuid, 'Empty label for choice', choiceUuid)
      deleteKmEditor(kmEditorUuid)
    })
  })
}

export function emptyUrlForUrlReferenceWarning() {
  createChapterWithQuestion().then(({ kmEditorUuid, questionUuid }) => {
    cy.get(`#km-editor-${questionUuid}-title`).type(`Question ${Date.now()}`)
    addChild(`km-editor-${questionUuid}-references-add`).then((referenceUuid) => {
      cy.get(`#km-editor-${referenceUuid}-referenceType`).select('URL')
      cy.get(`#km-editor-${referenceUuid}-label`).type(`Reference ${Date.now()}`)

      checkWarningNavigatesTo(kmEditorUuid, 'Empty URL for URL reference', referenceUuid)
      deleteKmEditor(kmEditorUuid)
    })
  })
}

export function invalidUrlForUrlReferenceWarning() {
  createChapterWithQuestion().then(({ kmEditorUuid, questionUuid }) => {
    cy.get(`#km-editor-${questionUuid}-title`).type(`Question ${Date.now()}`)
    addChild(`km-editor-${questionUuid}-references-add`).then((referenceUuid) => {
      cy.get(`#km-editor-${referenceUuid}-referenceType`).select('URL')
      cy.get(`#km-editor-${referenceUuid}-label`).type(`Reference ${Date.now()}`)
      cy.get(`#km-editor-${referenceUuid}-url`).type('not-a-valid-url')

      checkWarningNavigatesTo(kmEditorUuid, 'Invalid URL for URL reference', referenceUuid)
      deleteKmEditor(kmEditorUuid)
    })
  })
}

export function noResourcePageSelectedForResourcePageReferenceWarning() {
  createChapterWithQuestion().then(({ kmEditorUuid, questionUuid }) => {
    cy.get(`#km-editor-${questionUuid}-title`).type(`Question ${Date.now()}`)
    addChild(`km-editor-${questionUuid}-references-add`).then((referenceUuid) => {
      cy.get(`#km-editor-${referenceUuid}-referenceType`).select('ResourcePage')

      checkWarningNavigatesTo(kmEditorUuid, 'No resource page selected for resource page reference', referenceUuid)
      deleteKmEditor(kmEditorUuid)
    })
  })
}

export function emptyExpertEmailWarning() {
  createChapterWithQuestion().then(({ kmEditorUuid, questionUuid }) => {
    cy.get(`#km-editor-${questionUuid}-title`).type(`Question ${Date.now()}`)
    addChild(`km-editor-${questionUuid}-experts-add`).then((expertUuid) => {
      cy.get(`#km-editor-${expertUuid}-name`).type(`Expert ${Date.now()}`)

      checkWarningNavigatesTo(kmEditorUuid, 'Empty email for expert', expertUuid)
      deleteKmEditor(kmEditorUuid)
    })
  })
}

export function invalidExpertEmailWarning() {
  createChapterWithQuestion().then(({ kmEditorUuid, questionUuid }) => {
    cy.get(`#km-editor-${questionUuid}-title`).type(`Question ${Date.now()}`)
    addChild(`km-editor-${questionUuid}-experts-add`).then((expertUuid) => {
      cy.get(`#km-editor-${expertUuid}-name`).type(`Expert ${Date.now()}`)
      cy.get(`#km-editor-${expertUuid}-email`).type('not-an-email')

      checkWarningNavigatesTo(kmEditorUuid, 'Invalid email for expert', expertUuid)
      deleteKmEditor(kmEditorUuid)
    })
  })
}

export function emptyMetricTitleWarning() {
  createKmEditor().then(({ kmEditorUuid, knowledgeModelUuid }) => {
    addChild(`km-editor-${knowledgeModelUuid}-metrics-add`).then((metricUuid) => {
      checkWarningNavigatesTo(kmEditorUuid, 'Empty title for metric', metricUuid)
      deleteKmEditor(kmEditorUuid)
    })
  })
}

export function emptyPhaseTitleWarning() {
  createKmEditor().then(({ kmEditorUuid, knowledgeModelUuid }) => {
    addChild(`km-editor-${knowledgeModelUuid}-phases-add`).then((phaseUuid) => {
      checkWarningNavigatesTo(kmEditorUuid, 'Empty title for phase', phaseUuid)
      deleteKmEditor(kmEditorUuid)
    })
  })
}

export function emptyTagNameWarning() {
  createKmEditor().then(({ kmEditorUuid, knowledgeModelUuid }) => {
    addChild(`km-editor-${knowledgeModelUuid}-tags-add`).then((tagUuid) => {
      checkWarningNavigatesTo(kmEditorUuid, 'Empty name for tag', tagUuid)
      deleteKmEditor(kmEditorUuid)
    })
  })
}

export function emptyResourceCollectionTitleWarning() {
  createKmEditor().then(({ kmEditorUuid, knowledgeModelUuid }) => {
    addChild(`km-editor-${knowledgeModelUuid}-resourceCollections-add`).then((resourceCollectionUuid) => {
      checkWarningNavigatesTo(kmEditorUuid, 'Empty title for resource collection', resourceCollectionUuid)
      deleteKmEditor(kmEditorUuid)
    })
  })
}

export function emptyResourcePageTitleWarning() {
  createKmEditor().then(({ kmEditorUuid, knowledgeModelUuid }) => {
    addChild(`km-editor-${knowledgeModelUuid}-resourceCollections-add`).then((resourceCollectionUuid) => {
      cy.get(`#km-editor-${resourceCollectionUuid}-title`).type(`Resource Collection ${Date.now()}`)
      addChild(`km-editor-${resourceCollectionUuid}-resourcePages-add`).then((resourcePageUuid) => {
        checkWarningNavigatesTo(kmEditorUuid, 'Empty title for resource page', resourcePageUuid)
        deleteKmEditor(kmEditorUuid)
      })
    })
  })
}
