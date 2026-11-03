// Administration / settings / look and feel - change the application title and check
// the browser tab title picks it up. Admin only.
//
// The primary color and the logo aren't covered: the color field is a custom picker
// element, and the logo upload has no visible effect checkable without an image diff.
import { getSettings, saveSettingsPage } from './administrationSettingsSection'

export const SECTION = 'look-and-feel'

export function changeAppTitle() {
  const appTitle = `E2E Wizard ${Date.now()}`

  cy.visitApp('/settings/look-and-feel')
  cy.getField('appTitle').clear().type(appTitle)

  saveSettingsPage(SECTION)

  cy.getField('appTitle').should('have.value', appTitle)

  getSettings(SECTION).then(({ value }) => {
    expect(value.appTitle).to.equal(appTitle)
  })

  cy.title().should('match', new RegExp(` \\| ${appTitle}$`))
}
