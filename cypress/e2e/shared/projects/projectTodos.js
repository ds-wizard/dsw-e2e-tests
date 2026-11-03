// Projects / TODOs - marking a question TODO, finding it in the toolbar's TODOs
// panel, jumping to it from there (it's in the other chapter), and taking it off.
import { waitForSave } from '../km-editor/editor/kmEditorAddEntities'
import { createProject, deleteProject, openToolbarPanel, pollUntil, projectApiGet, question } from './projectQuestionnaireHelpers'

function todoRows() {
  return cy.get('#questionnaire-aside [data-cy^="questionnaire-panel_item_"]')
}

function labelsOf(projectUuid) {
  return projectApiGet('researcher', projectUuid, '/questionnaire').then((body) => body.labels || {})
}

export function addAndRemoveTodo(km) {
  const path = km.farQuestionPath

  createProject(`Test TODOs Project ${Date.now()}`, km.kmName, km.packageUuid).then((projectUuid) => {
    cy.visitApp(`/projects/${projectUuid}?questionPath=${encodeURIComponent(path)}`)
    question(path).find('[data-cy="questionnaire_question-action_add-todo"]').click()
    question(path).find('[data-cy="questionnaire_todo"]').should('be.visible')
    question(path).find('[data-cy="questionnaire_question-action_add-todo"]').should('not.exist')
    waitForSave()
    pollUntil(() => labelsOf(projectUuid), (labels) => (labels[path] || []).length > 0, 'the TODO to be stored')

    // Back on the first chapter, the TODO's question isn't rendered at all
    cy.visitApp(`/projects/${projectUuid}`)
    cy.getQuestionnaireField(km.laterQuestionPath).should('be.visible')
    cy.getQuestionnaireField(path).should('not.exist')

    openToolbarPanel('questionnaire_toolbar_todos')
    todoRows().should('have.length', 1).and('contain.text', km.farQuestionTitle)
    cy.getCy(`questionnaire-panel_item_${path}`).click()
    cy.getQuestionnaireField(path).should('be.visible')
    question(path).find('[data-cy="questionnaire_todo"]').should('be.visible')

    question(path).find('[data-cy="questionnaire_question-action_remove-todo"]').click()
    question(path).find('[data-cy="questionnaire_todo"]').should('not.exist')
    question(path).find('[data-cy="questionnaire_question-action_add-todo"]').should('exist')
    todoRows().should('not.exist')
    waitForSave()
    pollUntil(() => labelsOf(projectUuid), (labels) => (labels[path] || []).length === 0, 'the TODO to be removed')

    deleteProject(projectUuid)
  })
}
