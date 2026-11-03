// Administration / settings / submission - enable document submission with one new
// service carrying a user property, and check the user's own "Submission Settings"
// section lists it. Actually submitting a document isn't covered (needs a real
// endpoint to receive it). Admin only.
import { getSettings, saveSettingsPage } from './administrationSettingsSection'

export const SECTION = 'submission'

export function addSubmissionService(originalSettings) {
  const suffix = Date.now()
  const serviceId = `e2e-service-${suffix}`
  const serviceName = `E2E Service ${suffix}`
  const serviceUrl = `https://example.com/submit-${suffix}`
  const index = originalSettings.value.services.length
  const path = (field) => `services.${index}.${field}`

  cy.visitApp('/settings/submission')
  cy.getField('enabled').check()
  cy.getCy('form-services_add').click()
  cy.getField(path('id')).type(serviceId)
  cy.getField(path('name')).type(serviceName)
  cy.getField(path('request.method')).select('POST')
  cy.getField(path('request.url')).type(serviceUrl)
  cy.getCy(`form-services-${index}-props_add`).click()
  cy.getField(path('props.0')).type('Token')

  saveSettingsPage(SECTION)

  cy.getField('enabled').should('be.checked')
  cy.getField(path('id')).should('have.value', serviceId)
  cy.getField(path('name')).should('have.value', serviceName)
  cy.getField(path('request.method')).should('have.value', 'POST')
  cy.getField(path('request.url')).should('have.value', serviceUrl)
  cy.getField(path('props.0')).should('have.value', 'Token')

  getSettings(SECTION).then(({ value }) => {
    expect(value.enabled).to.equal(true)
    const service = value.services.find((candidate) => candidate.id === serviceId)
    expect(service, 'the new service is saved').to.exist
    expect(service.name).to.equal(serviceName)
    expect(service.props).to.deep.equal(['Token'])
    expect(service.request.method).to.equal('POST')
    expect(service.request.url).to.equal(serviceUrl)
  })

  cy.visitApp('/users/edit/current')
  cy.getCy('user_nav_submission-settings').click()

  cy.apiToken().then((token) => {
    cy.request({
      method: 'GET',
      url: `${Cypress.expose('apiUrl')}/users/current/submission-props`,
      headers: { Authorization: `Bearer ${token}` }
    }).then(({ body }) => {
      const propsIndex = body.findIndex((props) => props.id === serviceId)
      expect(propsIndex, "the service is among the user's submission settings").to.be.at.least(0)

      cy.get(`#submission-settings-${propsIndex}`).should('contain.text', serviceName)
    })
  })
}
