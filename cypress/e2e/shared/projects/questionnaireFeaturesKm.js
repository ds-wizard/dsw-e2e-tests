// Builds and publishes, through the KM Editor UI (same approach as questionTypeKms.js),
// one KM covering what the TODO, search and View-menu modules need:
//
//   phases A, B; one question tag; one metric
//   chapter 1
//     desirable question - Options, required in phase A, tagged, its one answer
//                          measured against the metric (default weight/measure 1)
//     later question     - Value, required in phase B (non-desirable while in phase A)
//   chapter 2
//     far question       - Value, with a unique word in its title to search for
//
// Needs knowledgeModels.useEditor/manage (Data Steward); the published package is
// then usable by anyone who can create a project.
import { addChild, deleteKmEditor, getKnowledgeModelUuid, waitForSave } from '../km-editor/editor/kmEditorAddEntities'

function createKm(kmId, kmName) {
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

function publishKm(kmEditorUuid) {
  waitForSave()

  cy.visitApp(`/knowledge-models/editors/${kmEditorUuid}/settings`)
  cy.getField('license').type('MIT')
  cy.getField('description').type('Published by the Projects E2E suite.')
  cy.getCy('markdown-editor_mode-markdown').click()
  cy.getField('readme').type('# Readme')
  cy.getCy('form-submit').click()
  cy.getCy('form-unsaved').should('have.attr', 'hidden')

  cy.visitApp(`/knowledge-models/editors/${kmEditorUuid}`)
  cy.getCy('km-editor_publish').click()
  cy.getCy('km-editor_publish-modal_confirm').click()

  return cy.url()
    .should('match', /\/knowledge-models\/[0-9a-f-]{36}$/)
    .then((packageUrl) => packageUrl.match(/\/knowledge-models\/([0-9a-f-]{36})$/)[1])
}

export function buildQuestionnaireFeaturesKm() {
  const ts = Date.now()
  const km = {
    kmId: `questionnaire-features-km-${ts}`,
    kmName: `Test Questionnaire Features KM ${ts}`,
    phaseATitle: `Phase A ${ts}`,
    phaseBTitle: `Phase B ${ts}`,
    tagName: `Tag ${ts}`,
    metricTitle: `Metric ${ts}`,
    chapter1Title: `First Chapter ${ts}`,
    chapter2Title: `Second Chapter ${ts}`,
    desirableQuestionTitle: `Desirable question ${ts}`,
    answerLabel: `Measured answer ${ts}`,
    laterQuestionTitle: `Later question ${ts}`,
    searchTerm: `zebrafish${ts}`,
    farQuestionTitle: `Far away zebrafish${ts} question`
  }

  const root = () => cy.visitApp(`/knowledge-models/editors/${km.kmEditorUuid}`)
  const edit = (uuid) => cy.visitApp(`/knowledge-models/editors/${km.kmEditorUuid}/edit/${uuid}`)
  const field = (uuid, name) => cy.get(`#km-editor-${uuid}-${name}`)

  createKm(km.kmId, km.kmName).then((ids) => Object.assign(km, ids))

  // Every addChild is preceded by waitForSave: it navigates away, and a field's
  // debounced edit doesn't survive the unmount (see questionTypeKms.js).
  cy.then(() => addChild(`km-editor-${km.knowledgeModelUuid}-phases-add`)).then((uuid) => {
    km.phaseAUuid = uuid
    field(uuid, 'title').type(km.phaseATitle)
    waitForSave()
  })
  cy.then(() => root())
  cy.then(() => addChild(`km-editor-${km.knowledgeModelUuid}-phases-add`)).then((uuid) => {
    km.phaseBUuid = uuid
    field(uuid, 'title').type(km.phaseBTitle)
    waitForSave()
  })
  cy.then(() => root())
  cy.then(() => addChild(`km-editor-${km.knowledgeModelUuid}-tags-add`)).then((uuid) => {
    km.tagUuid = uuid
    field(uuid, 'name').type(km.tagName)
    waitForSave()
  })
  cy.then(() => root())
  cy.then(() => addChild(`km-editor-${km.knowledgeModelUuid}-metrics-add`)).then((uuid) => {
    km.metricUuid = uuid
    field(uuid, 'title').type(km.metricTitle)
    waitForSave()
  })

  cy.then(() => root())
  cy.then(() => addChild(`km-editor-${km.knowledgeModelUuid}-chapters-add`)).then((uuid) => {
    km.chapter1Uuid = uuid
    field(uuid, 'title').type(km.chapter1Title)
    waitForSave()
  })
  cy.then(() => addChild(`km-editor-${km.chapter1Uuid}-questions-add`)).then((uuid) => {
    km.desirableQuestionUuid = uuid
    field(uuid, 'title').type(km.desirableQuestionTitle)
    waitForSave()
    field(uuid, 'requiredPhase').select(km.phaseAUuid)
    waitForSave()
    cy.getCy(`km-editor-${uuid}-tags_${km.tagUuid}`).click()
    field(uuid, 'tags').find(`input[value="${km.tagUuid}"]`).should('be.checked')
    waitForSave()
  })
  cy.then(() => addChild(`km-editor-${km.desirableQuestionUuid}-answers-add`)).then((uuid) => {
    km.answerUuid = uuid
    field(uuid, 'label').type(km.answerLabel)
    waitForSave()
    field(uuid, `metric-${km.metricUuid}`).check()
    field(uuid, `metric-${km.metricUuid}-measure`).should('have.value', '1')
    waitForSave()
  })

  cy.then(() => edit(km.chapter1Uuid))
  cy.then(() => addChild(`km-editor-${km.chapter1Uuid}-questions-add`)).then((uuid) => {
    km.laterQuestionUuid = uuid
    field(uuid, 'type').select('Value')
    field(uuid, 'title').type(km.laterQuestionTitle)
    waitForSave()
    field(uuid, 'requiredPhase').select(km.phaseBUuid)
    waitForSave()
  })

  cy.then(() => root())
  cy.then(() => addChild(`km-editor-${km.knowledgeModelUuid}-chapters-add`)).then((uuid) => {
    km.chapter2Uuid = uuid
    field(uuid, 'title').type(km.chapter2Title)
    waitForSave()
  })
  cy.then(() => addChild(`km-editor-${km.chapter2Uuid}-questions-add`)).then((uuid) => {
    km.farQuestionUuid = uuid
    field(uuid, 'type').select('Value')
    field(uuid, 'title').type(km.farQuestionTitle)
    waitForSave()
  })

  return cy.then(() => publishKm(km.kmEditorUuid)).then((packageUuid) => {
    km.packageUuid = packageUuid
    km.desirableQuestionPath = `${km.chapter1Uuid}.${km.desirableQuestionUuid}`
    km.laterQuestionPath = `${km.chapter1Uuid}.${km.laterQuestionUuid}`
    km.farQuestionPath = `${km.chapter2Uuid}.${km.farQuestionUuid}`
    return km
  })
}

export function deleteQuestionnaireFeaturesKm(km) {
  if (!km) {
    return
  }
  deleteKmEditor(km.kmEditorUuid)
  cy.cleanupKnowledgeModelPackage(km.kmId)
}
