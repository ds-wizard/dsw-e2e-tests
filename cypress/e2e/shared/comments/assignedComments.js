// Assigned comments - the user menu's "Assigned comments" page lists a thread once
// it's assigned to the signed-in user, and each row links back to the thread in its
// project's questionnaire.
import {
  BASIC_KM_QUESTION_PATH,
  createBasicKmProject,
  deleteProject,
  getUserUuid,
  pollUntil,
  projectApiGet
} from '../projects/projectQuestionnaireHelpers'

const path = BASIC_KM_QUESTION_PATH

export function assignedThreadIsListed() {
  const ts = Date.now()
  const projectName = `Test Assigned Comments Project ${ts}`
  const commentText = `Please have a look ${ts}`

  getUserUuid('researcher').then((researcherUuid) => {
    createBasicKmProject(projectName).then((projectUuid) => {
      cy.getCy('questionnaire_question-action_comment').click()
      cy.get(`[id="comment-${path}-new"]`).type(commentText)
      cy.getCy('comments_new-thread_submit').click()
      cy.getCy('comments_thread').should('have.length', 1)

      cy.getCy('comments_thread').invoke('attr', 'data-comment-thread-uuid').then((threadUuid) => {
        cy.getCy('comments_thread_assign').click()
        cy.getCy(`comments_thread_assign_${researcherUuid}`).click()
        pollUntil(
          () => projectApiGet('researcher', projectUuid, `/comments?path=${encodeURIComponent(path)}`),
          (body) => (body[path] || []).some((t) => t.uuid === threadUuid && t.assignedTo && t.assignedTo.uuid === researcherUuid),
          'the assignment to be stored'
        )

        cy.get('#c-user-menu-trigger').click()
        cy.getCy('user-menu_assigned-comments').click()
        cy.url().should('include', '/comments')
        cy.getCy(`listing-item_${threadUuid}`)
          .should('contain.text', commentText)
          .and('contain.text', projectName)

        cy.getCy(`listing-item_${threadUuid}`).find('a').click()
        cy.url().should('include', `/projects/${projectUuid}`).and('include', `commentThreadUuid=${threadUuid}`)
        cy.get(`#comment-thread-${threadUuid}`).should('be.visible').and('contain.text', commentText)

        deleteProject(projectUuid)
      })
    })
  })
}
