// Administration / settings / dashboard and menu - add a custom menu link and check it
// shows up in the navigation; add an announcement and check it on the dashboard.
// Admin only.
import { addAnnouncement } from './administrationSettingsAnnouncements'
import { getSettings, saveSettingsPage } from './administrationSettingsSection'

export const SECTION = 'dashboard-and-menu'

export function addCustomMenuLink(originalSettings) {
  const suffix = Date.now()
  const title = `E2E Link ${suffix}`
  const url = `https://example.com/e2e-${suffix}`
  const index = originalSettings.value.customMenuLinks.length
  const path = (field) => `customMenuLinks.${index}.${field}`

  cy.visitApp('/settings/dashboard-and-menu')
  cy.getCy('form-customMenuLinks_add').click()
  cy.getField(path('icon')).type('fas fa-flask')
  cy.getField(path('title')).type(title)
  cy.getField(path('url')).type(url)
  cy.getField(path('newWindow')).check()

  saveSettingsPage(SECTION)

  cy.getField(path('title')).should('have.value', title)
  cy.getField(path('url')).should('have.value', url)
  cy.getField(path('newWindow')).should('be.checked')

  getSettings(SECTION).then(({ value }) => {
    expect(value.customMenuLinks[index]).to.deep.equal({ icon: 'fas fa-flask', title, url, newWindow: true })
  })

  cy.getCy(`menu_custom-link_${url}`)
    .should('have.attr', 'href', url)
    .and('have.attr', 'target', '_blank')
    .and('contain.text', title)
}

export function addDashboardAnnouncement(originalSettings) {
  const content = `E2E dashboard announcement ${Date.now()}`
  const index = originalSettings.value.announcements.length

  cy.visitApp('/settings/dashboard-and-menu')
  addAnnouncement(index, 'Warning', content)
  saveSettingsPage(SECTION)

  getSettings(SECTION).then(({ value }) => {
    expect(value.announcements[index]).to.deep.equal({ level: 'WarningAnnouncementLevelType', content })
  })

  cy.visitApp('/dashboard')
  cy.getCy('announcements').find('[data-cy="announcement_warning"]').should('contain.text', content)
}
