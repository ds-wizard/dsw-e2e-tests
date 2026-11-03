import { pushAnswerOverWebsocket } from '../../shared/projects/projectWebsocket'

describe('Projects / websocket', () => {
  beforeEach(() => {
    cy.loginAs('researcher')
  })

  it('reacts live to an answer set by another client', () => {
    pushAnswerOverWebsocket()
  })
})
