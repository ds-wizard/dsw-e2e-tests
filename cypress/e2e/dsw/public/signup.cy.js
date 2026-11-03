import {
  captureAuthenticationSettings,
  enableRegistration,
  restoreAuthenticationSettings,
  signUpConfirmAndLogIn
} from '../../shared/public/signup'

// Logged out - a public page. Registration is tenant-wide, so it's turned on for this
// spec only and the original authentication settings are restored afterwards.
describe('Public / sign up', () => {
  let originalSettings

  before(() => {
    captureAuthenticationSettings().then((settings) => {
      originalSettings = settings
      enableRegistration(settings)
    })
  })

  after(() => {
    restoreAuthenticationSettings(originalSettings)
  })

  it('signs up, confirms the account and logs in', () => {
    signUpConfirmAndLogIn()
  })
})
