// Projects / questionnaire View menu - each of its five switches hides exactly its
// own thing, "Hide all"/"Show all" flip them together, and the choice survives a
// reload (local storage "project-view-settings", shared by every project).
//
// What each one hides, on the desirable question unless noted:
//   answered-by             "Answered ... by ..." under an answered question
//   phases                  the "Desirable: <phase>" extra
//   tags                    the question's tag list
//   metric-values           the percentage next to each metric on an answer; the
//                           metric's name stays
//   non-desirable-questions the later question, required only in phase B while
//                           the project is in phase A
import { waitForSave } from '../km-editor/editor/kmEditorAddEntities'
import { createProject, deleteProject, openMenu, pollUntil, projectApiGet, question } from './projectQuestionnaireHelpers'

const ALL_SHOWN = { answeredBy: true, phases: true, tags: true, metricValues: true, nonDesirable: true }
const NONE_SHOWN = { answeredBy: false, phases: false, tags: false, metricValues: false, nonDesirable: false }

const SWITCHES = [
  { testId: 'answered-by', key: 'answeredBy' },
  { testId: 'phases', key: 'phases' },
  { testId: 'tags', key: 'tags' },
  { testId: 'metric-values', key: 'metricValues' },
  { testId: 'non-desirable-questions', key: 'nonDesirable' }
]

function viewItem(testId) {
  return openMenu(() => cy.getCy('questionnaire_toolbar_view'), `questionnaire_toolbar_view_${testId}`)
}

function expectShown(km, shown) {
  const desirable = () => question(km.desirableQuestionPath)

  desirable().find('[data-cy="questionnaire_answered-by"]').should(shown.answeredBy ? 'exist' : 'not.exist')

  if (shown.phases) {
    desirable().find('[data-cy="questionnaire_question-extra"]').should('contain.text', km.phaseATitle)
  } else {
    desirable().find('[data-cy="questionnaire_question-extra"]').should('not.exist')
  }

  if (shown.tags) {
    desirable().find(`[data-cy="questionnaire_question-tag_${km.tagUuid}"]`).should('contain.text', km.tagName)
  } else {
    desirable().find('[data-cy="questionnaire_question-tags"]').should('not.exist')
  }

  const metric = () => desirable().find(`[data-cy="questionnaire_answer-metric_${km.metricUuid}"]`)
  metric().should('contain.text', km.metricTitle).and('have.attr', 'data-value', '1')
  if (shown.metricValues) {
    metric().find('[data-cy="questionnaire_answer-metric-value"]').should('contain.text', '100%')
  } else {
    metric().find('[data-cy="questionnaire_answer-metric-value"]').should('not.exist')
  }

  cy.getQuestionnaireField(km.laterQuestionPath).should(shown.nonDesirable ? 'exist' : 'not.exist')
}

export function toggleViewSettings(km) {
  const answerField = `#value_${km.desirableQuestionPath.replace(/[^a-zA-Z0-9_-]/g, '_')}_${km.answerUuid}`

  createProject(`Test View Settings Project ${Date.now()}`, km.kmName, km.packageUuid).then((projectUuid) => {
    const getQuestionnaire = () => projectApiGet('researcher', projectUuid, '/questionnaire')

    // The current phase's own option has no click handler, so only switch if needed.
    getQuestionnaire().then((body) => {
      if (body.phaseUuid !== km.phaseAUuid) {
        cy.get('button[data-cy="phase-selection"]').click()
        cy.getCy(`phase-option_${km.phaseAUuid}`).click()
      }
    })
    pollUntil(getQuestionnaire, (body) => body.phaseUuid === km.phaseAUuid, 'the project to be in phase A')

    cy.get(answerField).click()
    waitForSave()
    pollUntil(getQuestionnaire, (body) => Boolean(body.replies[km.desirableQuestionPath]), 'the answer to be stored')
    cy.reload()

    expectShown(km, ALL_SHOWN)

    SWITCHES.forEach(({ testId, key }) => {
      viewItem(testId).should('have.attr', 'aria-checked', 'true').click()
      viewItem(testId).should('have.attr', 'aria-checked', 'false')
      expectShown(km, { ...ALL_SHOWN, [key]: false })

      viewItem(testId).click()
      viewItem(testId).should('have.attr', 'aria-checked', 'true')
      expectShown(km, ALL_SHOWN)
    })

    viewItem('hide-all').click()
    expectShown(km, NONE_SHOWN)
    cy.reload()
    expectShown(km, NONE_SHOWN)

    viewItem('show-all').click()
    expectShown(km, ALL_SHOWN)
    cy.reload()
    expectShown(km, ALL_SHOWN)

    deleteProject(projectUuid)
  })
}
