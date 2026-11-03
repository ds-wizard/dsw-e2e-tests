// Projects / comments - a thread's whole life on one question: start it, reply,
// edit and delete a comment, resolve and reopen, assign and unassign, delete it.
// Every change travels over the websocket, so each step's end state is also read
// back from GET /projects/:uuid/comments rather than trusted from the panel alone.
import {
  BASIC_KM_QUESTION_PATH,
  createBasicKmProject,
  deleteProject,
  getUserUuid,
  openMenu,
  pollUntil,
  projectApiGet
} from './projectQuestionnaireHelpers'

const path = BASIC_KM_QUESTION_PATH

function threadsFromApi(projectUuid) {
  return projectApiGet('researcher', projectUuid, `/comments?path=${encodeURIComponent(path)}`)
    .then((body) => body[path] || [])
}

function waitForThreads(projectUuid, predicate, description) {
  return pollUntil(() => threadsFromApi(projectUuid), predicate, description)
}

function thread(threadUuid) {
  return cy.get(`[data-comment-thread-uuid="${threadUuid}"]`)
}

function comment(commentUuid) {
  return cy.get(`[data-comment-uuid="${commentUuid}"]`)
}

function openThreadMenu(threadUuid, itemTestId) {
  return openMenu(() => thread(threadUuid).find('[data-cy="comments_thread_menu"]'), itemTestId)
}

function openCommentMenu(commentUuid, itemTestId) {
  return openMenu(() => comment(commentUuid).find('[data-cy="comments_comment_menu"]'), itemTestId)
}

export function manageCommentThread() {
  const ts = Date.now()
  const firstText = `Thread start ${ts}`
  const replyText = `A reply ${ts}`
  const editedText = `Thread start, edited ${ts}`

  getUserUuid('researcher').then((researcherUuid) => {
    createBasicKmProject(`Test Comments Project ${ts}`).then((projectUuid) => {
      cy.getCy('questionnaire_question-action_comment').click()
      cy.get('#questionnaire-comments-panel').should('be.visible')

      // Start a thread
      cy.get(`[id="comment-${path}-new"]`).type(firstText)
      cy.getCy('comments_new-thread_submit').click()
      cy.getCy('comments_thread').should('have.length', 1).and('contain.text', firstText)

      cy.getCy('comments_thread').invoke('attr', 'data-comment-thread-uuid').then((threadUuid) => {
        thread(threadUuid).find('[data-cy="comments_comment"]').should('have.length', 1)
          .invoke('attr', 'data-comment-uuid').then((firstCommentUuid) => {
            // Reply
            cy.get(`[id="comment-${path}-${threadUuid}"]`).type(replyText)
            thread(threadUuid).find('[data-cy="comments_reply_submit"]').click()
            thread(threadUuid).find('[data-cy="comments_comment"]').should('have.length', 2)
            thread(threadUuid).should('contain.text', replyText)
            waitForThreads(projectUuid, (threads) => threads.length === 1 && threads[0].comments.length === 2, 'the reply to be stored')

            // Edit the first comment
            openCommentMenu(firstCommentUuid, 'comments_comment_edit').click()
            cy.get(`#comment-edit-${firstCommentUuid}`).should('have.value', firstText)
              .clear().type(editedText)
            comment(firstCommentUuid).find('[data-cy="comments_edit_submit"]').click()
            cy.get(`#comment-edit-${firstCommentUuid}`).should('not.exist')
            comment(firstCommentUuid).should('contain.text', editedText)
            waitForThreads(projectUuid, (threads) => {
              return threads[0].comments.some((c) => c.uuid === firstCommentUuid && c.text === editedText)
            }, 'the edited comment to be stored')

            // Delete the reply (the first comment has no delete - that's the thread's)
            thread(threadUuid).find('[data-cy="comments_comment"]')
              .not(`[data-comment-uuid="${firstCommentUuid}"]`)
              .invoke('attr', 'data-comment-uuid')
              .then((replyUuid) => {
                openCommentMenu(replyUuid, 'comments_comment_delete').click()
                cy.getCy('comments-delete_confirm').click()
                cy.getCy('comments-delete').should('not.have.attr', 'open')
                comment(replyUuid).should('not.exist')
                thread(threadUuid).find('[data-cy="comments_comment"]').should('have.length', 1)
                waitForThreads(projectUuid, (threads) => threads[0].comments.length === 1, 'the reply to be deleted')
              })

            // Resolve - a resolved thread is hidden until "Show resolved" is on
            thread(threadUuid).find('[data-cy="comments_thread_resolve"]').click()
            thread(threadUuid).should('not.exist')
            waitForThreads(projectUuid, (threads) => threads[0].resolved === true, 'the thread to be resolved')
            cy.get('#questionnaire-comments-resolved').check()
            thread(threadUuid).should('be.visible').and('have.class', 'is-resolved')
            thread(threadUuid).find('[data-cy="comments_thread_resolve"]').should('not.exist')

            // Reopen
            openThreadMenu(threadUuid, 'comments_thread_reopen').click()
            thread(threadUuid).should('not.have.class', 'is-resolved')
            thread(threadUuid).find('[data-cy="comments_thread_resolve"]').should('exist')
            waitForThreads(projectUuid, (threads) => threads[0].resolved === false, 'the thread to be reopened')

            // Assign to the project's owner (the one person sure to be offered)
            thread(threadUuid).find('[data-cy="comments_thread_assign"]').click()
            cy.getCy(`comments_thread_assign_${researcherUuid}`).click()
            thread(threadUuid).find('[data-cy="comments_thread_assign"]').should('not.exist')
            waitForThreads(projectUuid, (threads) => threads[0].assignedTo && threads[0].assignedTo.uuid === researcherUuid, 'the assignment to be stored')

            // Remove the assignment
            openThreadMenu(threadUuid, 'comments_thread_remove-assignment').click()
            thread(threadUuid).find('[data-cy="comments_thread_assign"]').should('exist')
            waitForThreads(projectUuid, (threads) => !threads[0].assignedTo, 'the assignment to be removed')

            // Delete the thread
            openThreadMenu(threadUuid, 'comments_thread_delete').click()
            cy.getCy('comments-delete_confirm').click()
            thread(threadUuid).should('not.exist')
            waitForThreads(projectUuid, (threads) => threads.length === 0, 'the thread to be deleted')

            deleteProject(projectUuid)
          })
      })
    })
  })
}
