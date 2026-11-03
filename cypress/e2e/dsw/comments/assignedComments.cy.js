import { assignedThreadIsListed } from '../../shared/comments/assignedComments'

describe('Comments / assigned comments', () => {
  beforeEach(() => {
    cy.loginAs('researcher')
  })

  it('lists a thread assigned to the user and links back to it', () => {
    assignedThreadIsListed()
  })
})
