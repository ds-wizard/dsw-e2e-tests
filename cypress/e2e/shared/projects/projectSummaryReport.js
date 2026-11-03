// Projects / summary report - the Metrics tab (Common.Pages.Projects.Detail.Metrics,
// the server-computed report from Shared.Service.Report.Evaluator.Metric). See
// summaryReportKm.js for the KM this drives and why its three metrics/four questions
// are shaped the way they are (one of the three, Metric B, fed by two different
// questions, to prove a real weighted average rather than one answer's value passed
// through unchanged).
//
// Each metric's own row (`metrics_row_<metricUuid>`, Table.withRowTestId) is a real
// data-cy - genuinely gone from the DOM, not just showing "0", while nothing has
// answered into it yet (filterEmptyMetricSummary drops it from the report outright).
// "Answered: X/Y" ("summary-report_answered") is checked by its data-answered/
// data-total attributes.
//
// The radar chart (Ui.Chart, a "ui-chart" custom element) only draws once there are
// more than two metrics (Metrics.elm's own viewMetrics) - this KM's own point in
// having three. Its drawn canvas isn't something Cypress can read, but Ui.Chart
// renders the same numbers into a real, if visually hidden, accessibility table
// ("chart_data") beside it - checked here too, not just that "ui-chart" exists.
//
// Deletes the project and the KM at the end.
import { waitForSave } from '../km-editor/editor/kmEditorAddEntities'
import { buildSummaryReportKm, deleteSummaryReportKm } from './summaryReportKm'

// Same as projectQuestionnaireTypes.js's own local helper - an OptionsQuestion
// answer's radio input, "#value_<sanitized path>_<answerUuid>".
function getOptionField(path, uuid) {
  const sanitizedPath = path.replace(/[^a-zA-Z0-9_-]/g, '_')
  return cy.get(`#value_${sanitizedPath}_${uuid}`)
}

function createProjectFrom(km, projectName) {
  cy.visitApp('/projects/create')
  cy.getField('name').type(projectName)
  cy.getField('knowledgeModelPackageUuid').click()
  cy.focused().type(km.kmName)
  cy.getCy(`form-knowledgeModelPackageUuid_option_${km.packageUuid}`).click()
  cy.getCy('form-submit').click()

  return cy.url()
    .should('match', /\/projects\/[0-9a-f-]{36}/).waitForPageFocus()
    .then((url) => url.match(/\/projects\/([0-9a-f-]{36})/)[1])
}

// checkReport leaves the browser on the /metrics tab, not the questionnaire - the
// option field only exists on the project's own page, so it's navigated back to here
// rather than assumed still open from whatever the previous step left it on.
function answer(km, question, answerUuid) {
  cy.visitApp(`/projects/${km.projectUuid}`)
  const path = `${km.chapterUuid}.${question.questionUuid}`
  getOptionField(path, answerUuid).click()
  waitForSave()
}

// expected is { <metricKey>: '1.00' | null, ... } - null means the metric hasn't had
// anything answered into it yet, so its whole row is gone, not showing "0.00".
function checkMetricsTable(km, expected) {
  Object.entries(expected).forEach(([key, value]) => {
    const metricUuid = km.metrics[key].uuid
    if (value === null) {
      cy.getCy(`metrics_row_${metricUuid}`).should('not.exist')
    } else {
      // .first() - this KM has a single chapter, so the overall "Summary Report"
      // table and the "Chapter 1" table beneath it show the exact same rows twice;
      // the first in DOM order is the overall one.
      cy.getCy(`metrics_row_${metricUuid}`).first().should('contain.text', value)
    }
  })
}

// Checks the chart only draws with answered !== null for more than two metrics
// (viewMetrics' own rule), and that its hidden accessibility table carries the same
// values as the visible one above - String.fromFloat's own raw form (Ui.Chart.
// valueAt), not Round.round's 2-decimal one, so e.g. "0.5" here against "0.50" there.
function checkChart(km, expected) {
  const answeredCount = Object.values(expected).filter((value) => value !== null).length

  if (answeredCount <= 2) {
    cy.get('ui-chart').should('not.exist')
    return
  }

  cy.get('ui-chart[chart-type="radar"]').should('exist')
  cy.getCy('chart_data').first().within(() => {
    Object.entries(expected).forEach(([key, value]) => {
      if (value !== null) {
        // The value's own td, exact text - not the row's full text (contain.text
        // on the <tr> would also match the category's own Date.now()-suffixed
        // title, which for bare values like "1"/"0" is all too likely to contain
        // that exact digit somewhere in its timestamp).
        cy.contains('th', km.metrics[key].title).next('td').should('have.text', value)
      }
    })
  })
}

function checkReport(km, { answered: [answered, total], table, chart }) {
  cy.visitApp(`/projects/${km.projectUuid}/metrics`)
  cy.getCy('summary-report_answered')
    .should('have.attr', 'data-answered', String(answered))
    .and('have.attr', 'data-total', String(total))
  checkMetricsTable(km, table)
  checkChart(km, chart)
}

export function viewProjectSummaryReport() {
  const projectName = `Test Summary Report Project ${Date.now()}`

  buildSummaryReportKm().then((km) => {
    createProjectFrom(km, projectName).then((projectUuid) => {
      km.projectUuid = projectUuid

      checkReport(km, {
        answered: [0, 4],
        table: { a: null, b: null, c: null },
        chart: { a: null, b: null, c: null }
      })

      answer(km, km.questionA, km.questionA.goodAnswerUuid)
      checkReport(km, {
        answered: [1, 4],
        table: { a: '1.00', b: null, c: null },
        chart: { a: '1', b: null, c: null }
      })

      answer(km, km.questionC, km.questionC.goodAnswerUuid)
      checkReport(km, {
        answered: [2, 4],
        table: { a: '1.00', b: null, c: '1.00' },
        chart: { a: '1', b: null, c: '1' }
      })

      // Metric B's first and only contributor so far is this "Bad" answer (0, weight
      // 1) - on its own, its weighted average is just that one measure, 0.
      answer(km, km.questionB1, km.questionB1.badAnswerUuid)
      checkReport(km, {
        answered: [3, 4],
        // Three metrics now - the point where the chart joins the table.
        table: { a: '1.00', b: '0.00', c: '1.00' },
        chart: { a: '1', b: '0', c: '1' }
      })

      // Metric B's second contributor (1, weight 1) joins the first (0, weight 1):
      // (0*1 + 1*1) / (1 + 1) = 0.5 - a real weighted average of two different
      // questions' answers, not either one's own value passed through.
      answer(km, km.questionB2, km.questionB2.goodAnswerUuid)
      checkReport(km, {
        answered: [4, 4],
        table: { a: '1.00', b: '0.50', c: '1.00' },
        chart: { a: '1', b: '0.5', c: '1' }
      })

      // Replying differently to an already-answered question, not just answering a
      // new one - Metric A moves from 1 to 0, Metric B/C stay exactly as they were.
      answer(km, km.questionA, km.questionA.badAnswerUuid)
      checkReport(km, {
        answered: [4, 4],
        table: { a: '0.00', b: '0.50', c: '1.00' },
        chart: { a: '0', b: '0.5', c: '1' }
      })

      cy.apiToken().then((token) => {
        cy.request({
          method: 'DELETE',
          url: `${Cypress.expose('apiUrl')}/projects/${projectUuid}`,
          headers: { Authorization: `Bearer ${token}` }
        })
      })
      deleteSummaryReportKm(km)
    })
  })
}
