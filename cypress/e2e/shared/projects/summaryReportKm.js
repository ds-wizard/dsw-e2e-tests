// Builds, through the real KM Editor UI, a KM purpose-built to drive the Projects /
// summary report (Metrics tab) - see projectSummaryReport.js for the test itself.
//
// Metrics only come from an OptionsQuestion's chosen Answer (Shared.Service.Report.
// Evaluator.Metric.evaluateQuestion - every other question type contributes nothing,
// not even MultiChoiceQuestion), and a metric's own measure is the weight-average of
// every answered OptionsQuestion's contribution to it, project-wide (Shared.Util.Math.
// weightAverage: sum(measure*weight)/sum(weight)) - dropped from the report entirely
// (not shown as 0) while nothing has contributed to it yet (filterEmptyMetricSummary).
//
// Three metrics (A, B, C) - "more than two" is also what the report draws a radar
// chart for, next to its table (Common.Pages.Projects.Detail.Metrics.viewMetrics).
// Metric A and C are each fed by one question's Good/Bad answer (measure 1 or 0,
// weight 1 - Good leaves MetricMeasure.init's own defaults untouched, only Bad dials
// measure down to 0). Metric B is fed by TWO separate questions, so answering both
// shows a real weighted average rather than one answer's own value passed through -
// answering Q2 "Bad" (0, weight 1) alone makes B 0, then also answering Q4 "Good" (1,
// weight 1) moves it to the average of both, 0.5 - not a straight replace.
//
// Revisits the KM editor's own root (for the next root-level metric) or the question's
// own edit page (for the next sibling answer) before every addChild beyond a
// collection's first child - same reason kmEditorAddEntities.js/questionTypeKms.js's
// own multi-sibling builders already do: the add trigger needs its parent's own page
// active, which navigating away from (to the entity just created) drops.
import { addChild, deleteKmEditor, getKnowledgeModelUuid, waitForSave } from '../km-editor/editor/kmEditorAddEntities'

function createKm() {
  const kmId = `summary-report-km-${Date.now()}`
  const kmName = `Test Summary Report KM ${Date.now()}`

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

function publishKm(kmEditorUuid) {
  waitForSave()

  cy.visitApp(`/knowledge-models/editors/${kmEditorUuid}/settings`)
  cy.getField('license').type('MIT')
  cy.getField('description').type('Published by the Projects E2E suite.')
  cy.getCy('markdown-editor_mode-markdown').click()
  cy.getField('readme').type('# Readme')
  cy.getCy('form-submit').click()
  // Clicking Save doesn't block navigation while the PUT is in flight, and the
  // Publish button right after the next line isn't gated on it - so publishing could
  // otherwise run ahead of these settings. Common.Components.Form's unsaved-changes
  // bar only hides once the save actually lands.
  cy.getCy('form-unsaved').should('have.attr', 'hidden')

  cy.visitApp(`/knowledge-models/editors/${kmEditorUuid}`)
  cy.getCy('km-editor_publish').click()
  cy.getCy('km-editor_publish-modal_confirm').click()

  return cy.url()
    .should('match', /\/knowledge-models\/[0-9a-f-]{36}$/)
    .then((packageUrl) => packageUrl.match(/\/knowledge-models\/([0-9a-f-]{36})$/)[1])
}

function addMetric(kmEditorUuid, knowledgeModelUuid, title) {
  cy.visitApp(`/knowledge-models/editors/${kmEditorUuid}`)
  return addChild(`km-editor-${knowledgeModelUuid}-metrics-add`).then((metricUuid) => {
    cy.get(`#km-editor-${metricUuid}-title`).type(title)
    // Chained off waitForSave()'s own .then(), not returned bare right after it -
    // cy commands are async, and a plain value returned straight after queuing them
    // resolves before they actually run ("mixing up async and sync code").
    return waitForSave().then(() => metricUuid)
  })
}

// One question with a "Good" (measure 1, the untouched default) and a "Bad" (measure
// dialed to 0) answer, both weight 1, both feeding the same metric.
function addOptionsQuestion(kmEditorUuid, chapterUuid, title, metricUuid) {
  cy.visitApp(`/knowledge-models/editors/${kmEditorUuid}/edit/${chapterUuid}`)
  return addChild(`km-editor-${chapterUuid}-questions-add`).then((questionUuid) => {
    cy.get(`#km-editor-${questionUuid}-title`).type(title)
    waitForSave()

    return addChild(`km-editor-${questionUuid}-answers-add`).then((goodAnswerUuid) => {
      cy.get(`#km-editor-${goodAnswerUuid}-label`).type('Good')
      cy.get(`#km-editor-${goodAnswerUuid}-metric-${metricUuid}`).click()
      waitForSave()

      cy.visitApp(`/knowledge-models/editors/${kmEditorUuid}/edit/${questionUuid}`)
      return addChild(`km-editor-${questionUuid}-answers-add`).then((badAnswerUuid) => {
        cy.get(`#km-editor-${badAnswerUuid}-label`).type('Bad')
        cy.get(`#km-editor-${badAnswerUuid}-metric-${metricUuid}`).click()
        cy.get(`#km-editor-${badAnswerUuid}-metric-${metricUuid}-measure`).clear().type('0')

        // Same reason as addMetric's own waitForSave().then() - chained, not returned
        // bare right after it.
        return waitForSave().then(() => ({ questionUuid, goodAnswerUuid, badAnswerUuid }))
      })
    })
  })
}

export function buildSummaryReportKm() {
  const chapterTitle = `Metrics Chapter ${Date.now()}`
  const metricATitle = `Metric A ${Date.now()}`
  const metricBTitle = `Metric B ${Date.now()}`
  const metricCTitle = `Metric C ${Date.now()}`

  let km
  let chapterUuid
  let metricAUuid
  let metricBUuid
  let metricCUuid
  let questionA
  let questionB1
  let questionC
  let questionB2

  return createKm()
    .then((result) => {
      km = result

      cy.visitApp(`/knowledge-models/editors/${km.kmEditorUuid}`)
      return addChild(`km-editor-${km.knowledgeModelUuid}-chapters-add`)
    })
    .then((uuid) => {
      chapterUuid = uuid
      cy.get(`#km-editor-${chapterUuid}-title`).type(chapterTitle)
      waitForSave()

      return addMetric(km.kmEditorUuid, km.knowledgeModelUuid, metricATitle)
    })
    .then((uuid) => {
      metricAUuid = uuid
      return addMetric(km.kmEditorUuid, km.knowledgeModelUuid, metricBTitle)
    })
    .then((uuid) => {
      metricBUuid = uuid
      return addMetric(km.kmEditorUuid, km.knowledgeModelUuid, metricCTitle)
    })
    .then((uuid) => {
      metricCUuid = uuid
      return addOptionsQuestion(km.kmEditorUuid, chapterUuid, `Question for ${metricATitle}`, metricAUuid)
    })
    .then((result) => {
      questionA = result
      return addOptionsQuestion(km.kmEditorUuid, chapterUuid, `First question for ${metricBTitle}`, metricBUuid)
    })
    .then((result) => {
      questionB1 = result
      return addOptionsQuestion(km.kmEditorUuid, chapterUuid, `Question for ${metricCTitle}`, metricCUuid)
    })
    .then((result) => {
      questionC = result
      return addOptionsQuestion(km.kmEditorUuid, chapterUuid, `Second question for ${metricBTitle}`, metricBUuid)
    })
    .then((result) => {
      questionB2 = result
      return publishKm(km.kmEditorUuid)
    })
    .then((packageUuid) => ({
      kmId: km.kmId,
      kmName: km.kmName,
      kmEditorUuid: km.kmEditorUuid,
      packageUuid,
      chapterUuid,
      metrics: {
        a: { uuid: metricAUuid, title: metricATitle },
        b: { uuid: metricBUuid, title: metricBTitle },
        c: { uuid: metricCUuid, title: metricCTitle }
      },
      questionA,
      questionB1,
      questionC,
      questionB2
    }))
}

export function deleteSummaryReportKm({ kmId, kmEditorUuid }) {
  deleteKmEditor(kmEditorUuid)
  cy.cleanupKnowledgeModelPackage(kmId)
}
