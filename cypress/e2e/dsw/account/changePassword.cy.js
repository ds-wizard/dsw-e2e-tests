import { changeOwnPassword } from '../../shared/account/changePassword'

// No beforeEach/cy.loginAs here, unlike every other spec - the core creates and logs
// in as its own throwaway user.
describe('Account / change password', () => {
  it('changes a password and logs back in with the new one', () => {
    changeOwnPassword()
  })
})
