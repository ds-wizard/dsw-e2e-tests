// Administration / settings / projects - change the default project visibility, then
// check a project a Researcher creates gets it. Admin changes the setting; Researcher
// creates the project, as in projectCreate.js.
import { getSettings, saveSettingsPage } from './administrationSettingsSection'

export const SECTION = 'projects'

// Edit or Private only: the create form folds the default sharing into the visibility
// (ProjectVisibility.fromFormValues), which can raise View/Comment but never changes
// these two.
export function changeDefaultProjectVisibility(originalSettings) {
  const visibility = originalSettings.value.projectVisibility.defaultValue === 'VisibleEditProjectVisibility'
    ? 'PrivateProjectVisibility'
    : 'VisibleEditProjectVisibility'
  const optionTestId = `form-questionnaireVisibilityDefaultValue_${visibility}`

  cy.visitApp('/settings/projects')
  cy.getCy(optionTestId).click()

  saveSettingsPage(SECTION)

  cy.getCy(optionTestId).find('input').should('be.checked')

  getSettings(SECTION).then(({ value }) => {
    expect(value.projectVisibility.defaultValue, 'the settings have the new default').to.equal(visibility)
  })

  cy.fixture('shared/basic-km.json').then((fixture) => cy.cleanupKnowledgeModelPackage(fixture.id))
  cy.importKM('shared/basic-km.json').then((kmPackage) => {
    cy.logout()
    cy.loginAs('researcher')

    cy.visitApp('/projects/create')
    cy.getField('name').type(`E2E Visibility Project ${Date.now()}`)
    cy.getField('knowledgeModelPackageUuid').click()
    cy.focused().type('Basic KM')
    cy.getCy(`form-knowledgeModelPackageUuid_option_${kmPackage.uuid}`).click()
    cy.getCy('form-submit').click()

    cy.url()
      .should('match', /\/projects\/[0-9a-f-]{36}/).waitForPageFocus()
      .then((url) => {
        const projectUuid = url.match(/\/projects\/([0-9a-f-]{36})/)[1]

        cy.apiToken().then((token) => {
          cy.request({
            method: 'GET',
            url: `${Cypress.expose('apiUrl')}/projects/${projectUuid}`,
            headers: { Authorization: `Bearer ${token}` }
          }).then(({ body }) => {
            expect(body.visibility).to.equal(visibility)
          })

          cy.request({
            method: 'DELETE',
            url: `${Cypress.expose('apiUrl')}/projects/${projectUuid}`,
            headers: { Authorization: `Bearer ${token}` }
          })
        })
      })
  })
}
