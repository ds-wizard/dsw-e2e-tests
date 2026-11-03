import { manageCommentThread } from '../../shared/projects/projectComments'

describe('Projects / comments', () => {
  beforeEach(() => {
    cy.loginAs('researcher')
  })

  it('replies, edits, deletes, resolves, reopens, assigns and deletes a thread', () => {
    manageCommentThread()
  })
})
