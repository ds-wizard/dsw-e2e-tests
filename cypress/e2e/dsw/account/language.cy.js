import { changeLanguage } from '../../shared/account/accountLanguage'
import { cleanupLocales } from '../../shared/administration/administrationSettingsLocales'

// No cy.loginAs here - the core logs in as admin to add a translation, then as its own
// throwaway user.
describe('Account / language', () => {
  beforeEach(() => {
    cleanupLocales()
  })

  afterEach(() => {
    cleanupLocales()
  })

  it('saves a language of your own and goes back to the default', () => {
    changeLanguage()
  })
})
