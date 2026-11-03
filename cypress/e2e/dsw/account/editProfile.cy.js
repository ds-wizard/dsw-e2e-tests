import { editOwnProfile } from '../../shared/account/editProfile'

// Researcher - editing your own profile needs no permission.
describe('Account / edit profile', () => {
  beforeEach(() => {
    cy.loginAs('researcher')
  })

  it('edits and saves the current user\'s own profile', () => {
    editOwnProfile()
  })
})
