import { cleanupLocales, manageLocaleRow, uploadLocale } from '../../shared/administration/administrationSettingsLocales'

// Admin only - settings.manage, tenant plane.
describe('Administration / settings / application translations', () => {
  beforeEach(() => {
    cleanupLocales()
    cy.loginAs('admin')
  })

  afterEach(() => {
    cleanupLocales()
  })

  it('uploads a translation, and checks it is listed as disabled', () => {
    uploadLocale()
  })

  it('enables, sets as default, unsets, disables, downloads and deletes a translation', () => {
    manageLocaleRow()
  })
})
