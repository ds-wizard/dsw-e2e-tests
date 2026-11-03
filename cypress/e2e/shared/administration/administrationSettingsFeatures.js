// Administration / settings / features - flip Tours and check the "Tours" section of
// the user's own settings appears/disappears with it, then flip it back. Admin only.
//
// The AI assistant toggle only renders when the deployment has the extension, which
// the test stack doesn't.
//
// Tours stay enabled only while on pages without a tour of their own: a tour is a
// driver.js overlay that blocks every click (see create-tenants.js).
import { getSettings, saveSettingsPage } from './administrationSettingsSection'

export const SECTION = 'features'

function setTours(enabled) {
  cy.visitApp('/settings/features')
  if (enabled) {
    cy.getField('toursEnabled').check()
  } else {
    cy.getField('toursEnabled').uncheck()
  }

  saveSettingsPage(SECTION)

  cy.getField('toursEnabled').should(enabled ? 'be.checked' : 'not.be.checked')
  getSettings(SECTION).then(({ value }) => {
    expect(value.toursEnabled).to.equal(enabled)
  })

  cy.visitApp('/users/edit/current')
  cy.getCy('user_nav_profile').should('exist')
  cy.getCy('user_nav_tours').should(enabled ? 'exist' : 'not.exist')
}

export function toggleTours(originalSettings) {
  const original = originalSettings.value.toursEnabled

  setTours(!original)
  setTours(original)
}
