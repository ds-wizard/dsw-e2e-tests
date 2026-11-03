import { recoverForgottenPassword } from '../../shared/public/forgottenPassword'

// Logged out - a public page; the core creates its own throwaway user.
describe('Public / forgotten password', () => {
  it('requests a reset, sets a new password and logs in with it', () => {
    recoverForgottenPassword()
  })
})
