// Projects / public sharing - the Share dialog's "Public link": with it on, a
// logged-out visitor can open the project read-only; with it off again, the same
// visitor is sent to the login page instead.
import { waitForSave } from '../km-editor/editor/kmEditorAddEntities'
import { BASIC_KM_QUESTION_PATH, createProjectFromKm, deleteProject } from './projectTabsHelpers'

function expectPublicSharingEnabled() {
  cy.apiToken().then((token) => {
    cy.request({
      method: 'GET',
      url: `${Cypress.expose('apiUrl')}/settings/projects`,
      headers: { Authorization: `Bearer ${token}` }
    }).then(({ body }) => {
      expect(body.value.projectSharing.enabled, 'Settings / Projects: public sharing is enabled').to.eq(true)
    })
  })
}

function setPublicLink(projectUuid, enabled) {
  cy.loginAs('researcher')
  cy.visitApp(`/projects/${projectUuid}`)
  cy.getCy('project_detail_share-button').click()
  cy.getCy('project-share').within(() => {
    cy.getField('sharingEnabled').then(($toggle) => {
      if ($toggle.is(':checked') !== enabled) {
        cy.wrap($toggle).click()
      }
    })
    cy.getField('sharingEnabled').should(enabled ? 'be.checked' : 'not.be.checked')
    if (enabled) {
      cy.getField('sharingPermission').select('view')
    }
    cy.getCy('form-submit').click()
  })
  cy.getCy('project-share').should('not.have.attr', 'open')
}

export function shareProjectPublicly() {
  const projectName = `Test Public Project ${Date.now()}`
  const answer = `Public answer ${Date.now()}`

  expectPublicSharingEnabled()
  cy.fixture('shared/basic-km.json').then((fixture) => cy.cleanupKnowledgeModelPackage(fixture.id))

  cy.importKM('shared/basic-km.json').then((kmPackage) => {
    createProjectFromKm(kmPackage.uuid, 'Basic KM', projectName).then((projectUuid) => {
      cy.getQuestionnaireField(BASIC_KM_QUESTION_PATH).type(answer).blur()
      waitForSave()

      setPublicLink(projectUuid, true)

      cy.logout()
      cy.visitApp(`/projects/${projectUuid}`)
      cy.getQuestionnaireField(BASIC_KM_QUESTION_PATH)
        .should('have.value', answer)
        .and('be.disabled')
      cy.getCy('project_detail_share-button').should('not.exist')
      cy.getCy('project_nav_settings').should('not.exist')
      cy.get('#login-email').should('not.exist')

      setPublicLink(projectUuid, false)

      cy.logout()
      cy.visitApp(`/projects/${projectUuid}`)
      cy.get('#login-email').should('exist')

      deleteProject(projectUuid)
    })
  })
}
