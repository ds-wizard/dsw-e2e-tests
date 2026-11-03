import { shareProjectPublicly } from '../../shared/projects/projectPublicSharing'

// Researcher (the owner) shares; the core logs out to check as an anonymous visitor.
describe('Projects / public sharing', () => {
  beforeEach(() => {
    cy.loginAs('researcher')
  })

  it('opens a publicly shared project logged out, and not once the link is off', () => {
    shareProjectPublicly()
  })
})
