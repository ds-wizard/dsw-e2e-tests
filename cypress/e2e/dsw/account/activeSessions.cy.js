import { revokeActiveSession, revokeAllActiveSessions } from '../../shared/account/accountActiveSessions'

// No beforeEach/cy.loginAs - the core creates and logs in as its own throwaway user.
describe('Account / active sessions', () => {
  it('revokes another session', () => {
    revokeActiveSession()
  })

  it('revokes all other sessions', () => {
    revokeAllActiveSessions()
  })
})
