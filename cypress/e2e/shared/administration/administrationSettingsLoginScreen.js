// Administration / settings / login screen - set the login info, the sidebar login
// info and an announcement, check they persisted and show on the logged-out login
// page. Admin only (settings.manage).
import { addAnnouncement } from './administrationSettingsAnnouncements'

const sectionUrl = () => `${Cypress.expose('apiUrl')}/settings/login-screen`

export function captureLoginScreenSettings() {
  return cy.apiToken().then((token) => {
    return cy.request({
      method: 'GET',
      url: sectionUrl(),
      headers: { Authorization: `Bearer ${token}` }
    }).then(({ body }) => body)
  })
}

export function restoreLoginScreenSettings(originalSettings) {
  if (!originalSettings) {
    return
  }

  cy.apiToken().then((token) => {
    cy.request({
      method: 'PUT',
      url: sectionUrl(),
      headers: { Authorization: `Bearer ${token}` },
      body: originalSettings
    })
  })
}

// Two markdown editors on the page, so the mode switch is scoped to the field's own.
function typeMarkdown(path, value) {
  cy.get(`ui-markdown-editor[input-id="form-${path}"]`).within(() => {
    cy.getCy('markdown-editor_mode-markdown').click()
  })
  cy.getField(path).clear().type(value, { parseSpecialCharSequences: false })
}

export function setLoginInfo() {
  const suffix = Date.now()
  const loginInfoText = `E2E login info ${suffix}`
  const sidebarText = `E2E sidebar login info ${suffix}`

  cy.visitApp('/settings/login-screen')
  typeMarkdown('loginInfo', loginInfoText)
  typeMarkdown('loginInfoSidebar', sidebarText)
  cy.getPageFormTestId('form-submit').click()
  cy.getCy('form-unsaved').should('have.attr', 'hidden')

  cy.reload()
  cy.getField('loginInfo').should('have.value', loginInfoText)
  cy.getField('loginInfoSidebar').should('have.value', sidebarText)

  captureLoginScreenSettings().then((settings) => {
    expect(settings.value.loginInfo).to.equal(loginInfoText)
    expect(settings.value.loginInfoSidebar).to.equal(sidebarText)
  })

  cy.logout()
  cy.visitApp('/')
  cy.getCy('login_info').should('contain.text', loginInfoText)
  cy.getCy('login_info-sidebar').should('contain.text', sidebarText)
}

export function addLoginAnnouncement(originalSettings) {
  const content = `E2E login announcement ${Date.now()}`
  const index = originalSettings.value.announcements.length

  cy.visitApp('/settings/login-screen')
  addAnnouncement(index, 'Info', content)
  cy.getPageFormTestId('form-submit').click()
  cy.getCy('form-unsaved').should('have.attr', 'hidden')

  captureLoginScreenSettings().then((settings) => {
    expect(settings.value.announcements[index]).to.deep.equal({ level: 'InfoAnnouncementLevelType', content })
  })

  cy.logout()
  cy.visitApp('/')
  cy.getCy('announcements').find('[data-cy="announcement_info"]').should('contain.text', content)
}
