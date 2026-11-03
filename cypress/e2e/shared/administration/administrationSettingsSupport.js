// Administration / settings / support - change the support email and site, and check
// the "Report issue" dialog (user menu) links to them. Admin only.
import { getSettings, saveSettingsPage } from './administrationSettingsSection'

export const SECTION = 'support'

export function changeSupportContacts() {
  const suffix = Date.now()
  const supportEmail = `support-${suffix}@example.com`
  const supportSiteName = `E2E Helpdesk ${suffix}`
  const supportSiteUrl = `https://example.com/helpdesk-${suffix}`

  cy.visitApp('/settings/support')
  cy.getField('supportEmail').clear().type(supportEmail)
  cy.getField('supportSiteName').clear().type(supportSiteName)
  cy.getField('supportSiteUrl').clear().type(supportSiteUrl)

  saveSettingsPage(SECTION)

  cy.getField('supportEmail').should('have.value', supportEmail)
  cy.getField('supportSiteName').should('have.value', supportSiteName)
  cy.getField('supportSiteUrl').should('have.value', supportSiteUrl)

  getSettings(SECTION).then(({ value }) => {
    expect(value.supportEmail).to.equal(supportEmail)
    expect(value.supportSiteName).to.equal(supportSiteName)
    expect(value.supportSiteUrl).to.equal(supportSiteUrl)
  })

  cy.get('#c-user-menu-trigger').click()
  cy.getCy('user-menu_report-issue').click()
  cy.getCy('report-issue').within(() => {
    cy.get(`a[href="mailto:${supportEmail}"]`).should('contain.text', supportEmail)
    cy.get(`a[href="${supportSiteUrl}"]`).should('contain.text', supportSiteName)
  })
}
