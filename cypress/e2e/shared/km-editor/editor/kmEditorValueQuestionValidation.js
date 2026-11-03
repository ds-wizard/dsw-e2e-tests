// Mirrors dsw-e2e-tests' own value-question-validation.spec.js: every validation rule
// kind, exercised end-to-end through the KM Editor's own "Preview" tab (reuses the
// same Questionnaire component a real project answers through, so the question's
// answer field is reached the same way - cy.getQuestionnaireField("<chapterUuid>.
// <questionUuid>")) rather than just checking the rule's own fields got set. Each test
// uses a fresh KM editor with a single question, so the validation warning
// ("questionnaire_validation-warning_<rule>") needs no further scoping.
//
// Each rule row's fields have deterministic ids ("<listId>-<position>-type"/
// "-value"). Orcid/Doi take no value field at all. Rule kinds are gated by the question's own valueType
// (Common.Api.Models.KnowledgeModel.Question.QuestionValidation.validValueTypes) -
// Min/MaxLength/Regex/Orcid/Doi need the default String type; Min/MaxNumber need
// Number; From/ToDate(Time) need Date/DateTime; From/ToTime need Time; Domain needs
// Email. Date/time validation values are typed directly into the picker's own input
// (flatpickr's allowInput, packages/elm-ui/js/date-picker.js) rather than driven
// through its calendar UI - Date needs "Y-m-d", DateTime "Y-m-d H:i", Time "H:i".
//
// Adding an entity navigates straight to its own edit route (its uuid comes from the
// resulting URL, not a separate list-item link). The root-level "chapters-add" id is
// keyed by the knowledge model's own entity uuid, a real uuid generated per editor
// (fetched via createKmEditor below), not the KM editor's own uuid.

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

// Creates a chapter with one Value question, optionally switching its valueType away
// from the default (String).
function createValueQuestion(valueType) {
  return createKmEditor().then(({ kmEditorUuid, knowledgeModelUuid }) => {
    return addChild(`km-editor-${knowledgeModelUuid}-chapters-add`).then((chapterUuid) => {
      return addChild(`km-editor-${chapterUuid}-questions-add`).then((questionUuid) => {
        cy.get(`#km-editor-${questionUuid}-type`).select('Value')
        if (valueType) {
          cy.get(`#km-editor-${questionUuid}-valueType`).select(valueType)
        }
        // Chained via cy.wrap(), not returned bare - the select()s above already
        // queued cy commands, so this callback must keep returning a cy chain.
        return cy.wrap({ kmEditorUuid, chapterUuid, questionUuid })
      })
    })
  })
}

function addValidationRule(questionUuid, type, value) {
  const validationsId = `km-editor-${questionUuid}-validations`
  cy.getCy(`${validationsId}_add`).click()
  cy.get(`#${validationsId}-0-type`).select(type)
  if (value !== undefined) {
    cy.get(`#${validationsId}-0-value`).clear()
    cy.get(`#${validationsId}-0-value`).type(value)
    cy.get(`#${validationsId}-0-value`).blur()
  }
}

function openPreview(kmEditorUuid) {
  cy.visitApp(`/knowledge-models/editors/${kmEditorUuid}/preview`)
}

function answerAndExpectWarning(questionPath, answer, expectWarning) {
  cy.getQuestionnaireField(questionPath).clear()
  cy.getQuestionnaireField(questionPath).type(answer)
  cy.getQuestionnaireField(questionPath).blur()
  cy.get('[data-cy^="questionnaire_validation-warning_"]').should(expectWarning ? 'exist' : 'not.exist')
}

export function minLengthValidation() {
  createValueQuestion().then(({ kmEditorUuid, chapterUuid, questionUuid }) => {
    addValidationRule(questionUuid, 'MinLength', '5')
    waitForSave()

    openPreview(kmEditorUuid)
    const questionPath = `${chapterUuid}.${questionUuid}`
    answerAndExpectWarning(questionPath, 'abcd', true)
    answerAndExpectWarning(questionPath, 'abcde', false)

    deleteKmEditor(kmEditorUuid)
  })
}

export function maxLengthValidation() {
  createValueQuestion().then(({ kmEditorUuid, chapterUuid, questionUuid }) => {
    addValidationRule(questionUuid, 'MaxLength', '5')
    waitForSave()

    openPreview(kmEditorUuid)
    const questionPath = `${chapterUuid}.${questionUuid}`
    answerAndExpectWarning(questionPath, 'abcdef', true)
    answerAndExpectWarning(questionPath, 'abcde', false)

    deleteKmEditor(kmEditorUuid)
  })
}

export function regexValidation() {
  createValueQuestion().then(({ kmEditorUuid, chapterUuid, questionUuid }) => {
    addValidationRule(questionUuid, 'Regex', '[a-z]+')
    waitForSave()

    openPreview(kmEditorUuid)
    const questionPath = `${chapterUuid}.${questionUuid}`
    answerAndExpectWarning(questionPath, '12345', true)
    answerAndExpectWarning(questionPath, 'abcde', false)

    deleteKmEditor(kmEditorUuid)
  })
}

export function orcidValidation() {
  createValueQuestion().then(({ kmEditorUuid, chapterUuid, questionUuid }) => {
    addValidationRule(questionUuid, 'Orcid')
    waitForSave()

    openPreview(kmEditorUuid)
    const questionPath = `${chapterUuid}.${questionUuid}`
    answerAndExpectWarning(questionPath, '12345', true)
    answerAndExpectWarning(questionPath, '0000-0002-9079-593X', false)

    deleteKmEditor(kmEditorUuid)
  })
}

export function doiValidation() {
  createValueQuestion().then(({ kmEditorUuid, chapterUuid, questionUuid }) => {
    addValidationRule(questionUuid, 'Doi')
    waitForSave()

    openPreview(kmEditorUuid)
    const questionPath = `${chapterUuid}.${questionUuid}`
    answerAndExpectWarning(questionPath, '12345', true)
    answerAndExpectWarning(questionPath, '10.5334/dsj-2019-059', false)

    deleteKmEditor(kmEditorUuid)
  })
}

export function minNumberValidation() {
  createValueQuestion('NumberQuestionValueType').then(({ kmEditorUuid, chapterUuid, questionUuid }) => {
    addValidationRule(questionUuid, 'MinNumber', '5')
    waitForSave()

    openPreview(kmEditorUuid)
    const questionPath = `${chapterUuid}.${questionUuid}`
    answerAndExpectWarning(questionPath, '4', true)
    answerAndExpectWarning(questionPath, '5', false)

    deleteKmEditor(kmEditorUuid)
  })
}

export function maxNumberValidation() {
  createValueQuestion('NumberQuestionValueType').then(({ kmEditorUuid, chapterUuid, questionUuid }) => {
    addValidationRule(questionUuid, 'MaxNumber', '5')
    waitForSave()

    openPreview(kmEditorUuid)
    const questionPath = `${chapterUuid}.${questionUuid}`
    answerAndExpectWarning(questionPath, '6', true)
    answerAndExpectWarning(questionPath, '5', false)

    deleteKmEditor(kmEditorUuid)
  })
}

export function fromDateValidation() {
  createValueQuestion('DateQuestionValueType').then(({ kmEditorUuid, chapterUuid, questionUuid }) => {
    addValidationRule(questionUuid, 'FromDate', '2024-06-15')
    waitForSave()

    openPreview(kmEditorUuid)
    const questionPath = `${chapterUuid}.${questionUuid}`
    answerAndExpectWarning(questionPath, '2024-06-14', true)
    answerAndExpectWarning(questionPath, '2024-06-15', false)

    deleteKmEditor(kmEditorUuid)
  })
}

export function toDateValidation() {
  createValueQuestion('DateQuestionValueType').then(({ kmEditorUuid, chapterUuid, questionUuid }) => {
    addValidationRule(questionUuid, 'ToDate', '2024-06-15')
    waitForSave()

    openPreview(kmEditorUuid)
    const questionPath = `${chapterUuid}.${questionUuid}`
    answerAndExpectWarning(questionPath, '2024-06-16', true)
    answerAndExpectWarning(questionPath, '2024-06-15', false)

    deleteKmEditor(kmEditorUuid)
  })
}

export function fromDateTimeValidation() {
  createValueQuestion('DateTimeQuestionValueType').then(({ kmEditorUuid, chapterUuid, questionUuid }) => {
    addValidationRule(questionUuid, 'FromDateTime', '2024-06-15 10:15')
    waitForSave()

    openPreview(kmEditorUuid)
    const questionPath = `${chapterUuid}.${questionUuid}`
    answerAndExpectWarning(questionPath, '2024-06-14 10:15', true)
    answerAndExpectWarning(questionPath, '2024-06-15 10:10', true)
    answerAndExpectWarning(questionPath, '2024-06-15 10:15', false)
    answerAndExpectWarning(questionPath, '2024-06-16 10:15', false)

    deleteKmEditor(kmEditorUuid)
  })
}

export function toDateTimeValidation() {
  createValueQuestion('DateTimeQuestionValueType').then(({ kmEditorUuid, chapterUuid, questionUuid }) => {
    addValidationRule(questionUuid, 'ToDateTime', '2024-06-15 10:15')
    waitForSave()

    openPreview(kmEditorUuid)
    const questionPath = `${chapterUuid}.${questionUuid}`
    answerAndExpectWarning(questionPath, '2024-06-16 10:15', true)
    answerAndExpectWarning(questionPath, '2024-06-15 10:20', true)
    answerAndExpectWarning(questionPath, '2024-06-15 10:15', false)
    answerAndExpectWarning(questionPath, '2024-06-14 10:15', false)

    deleteKmEditor(kmEditorUuid)
  })
}

export function fromTimeValidation() {
  createValueQuestion('TimeQuestionValueType').then(({ kmEditorUuid, chapterUuid, questionUuid }) => {
    addValidationRule(questionUuid, 'FromTime', '10:15')
    waitForSave()

    openPreview(kmEditorUuid)
    const questionPath = `${chapterUuid}.${questionUuid}`
    answerAndExpectWarning(questionPath, '10:10', true)
    answerAndExpectWarning(questionPath, '10:15', false)

    deleteKmEditor(kmEditorUuid)
  })
}

export function toTimeValidation() {
  createValueQuestion('TimeQuestionValueType').then(({ kmEditorUuid, chapterUuid, questionUuid }) => {
    addValidationRule(questionUuid, 'ToTime', '10:15')
    waitForSave()

    openPreview(kmEditorUuid)
    const questionPath = `${chapterUuid}.${questionUuid}`
    answerAndExpectWarning(questionPath, '10:20', true)
    answerAndExpectWarning(questionPath, '10:15', false)

    deleteKmEditor(kmEditorUuid)
  })
}

export function domainValidation() {
  createValueQuestion('EmailQuestionValueType').then(({ kmEditorUuid, chapterUuid, questionUuid }) => {
    addValidationRule(questionUuid, 'Domain', 'example.com, ds-wizard.org')
    waitForSave()

    openPreview(kmEditorUuid)
    const questionPath = `${chapterUuid}.${questionUuid}`
    answerAndExpectWarning(questionPath, 'albert.einstein@gmail.com', true)
    answerAndExpectWarning(questionPath, 'albert.einstein@example.com', false)
    answerAndExpectWarning(questionPath, 'albert.einstein@ds-wizard.org', false)

    deleteKmEditor(kmEditorUuid)
  })
}
