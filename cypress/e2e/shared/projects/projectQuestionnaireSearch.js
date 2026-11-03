// Projects / questionnaire search - the toolbar's Search panel finds a question in
// another chapter by a word in its title, and choosing the result goes there.
//
// The no-results message has no data-cy - matched by its class, inside the panel.
import { createProject, deleteProject, openToolbarPanel, question } from './projectQuestionnaireHelpers'

function results() {
  return cy.get('#questionnaire-aside [data-cy^="questionnaire-search_result_"]')
}

export function searchAndJumpToQuestion(km) {
  const path = km.farQuestionPath

  createProject(`Test Search Project ${Date.now()}`, km.kmName, km.packageUuid).then((projectUuid) => {
    cy.getQuestionnaireField(km.laterQuestionPath).should('be.visible')
    cy.getQuestionnaireField(path).should('not.exist')

    openToolbarPanel('questionnaire-search')

    cy.get('#questionnaire-search-input').type(`no-such-thing-${Date.now()}`)
    cy.get('#questionnaire-aside .c-questionnaire-search__results--message').should('be.visible')
    results().should('not.exist')

    cy.get('#questionnaire-search-input').clear().type(km.searchTerm)
    results().should('have.length', 1).and('contain.text', km.farQuestionTitle)
    cy.getCy(`questionnaire-search_result_question_${path.split('.').pop()}`).click()

    cy.getQuestionnaireField(path).should('be.visible')
    question(path).should('have.class', 'is-highlighted')
    cy.getQuestionnaireField(km.laterQuestionPath).should('not.exist')

    deleteProject(projectUuid)
  })
}
