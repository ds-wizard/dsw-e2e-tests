// Helpers shared by the project tab modules (preview, documents, files, sharing,
// templates) - not a test of their own.

// The value question basic-km.json starts with.
export const BASIC_KM_QUESTION_PATH = 'fa34a580-6485-4b0d-8167-927c921c461b.2a98fa12-a2dd-4f7b-9546-c0065bbbfa95'

export const QUESTIONNAIRE_REPORT_ID = 'dsw.questionnaire-report'
export const JSON_FORMAT_UUID = 'd3e98eb6-344d-481f-8e37-6a67b6cd1ad2'

// Resolves to the new project's uuid. The starting-point radio only renders when the
// workspace has both a project template and a KM (a template left over from a
// failed run would otherwise hide the KM picker) - the form only renders once both
// counts have loaded, so checking for it after #form-name exists is not a race.
export function createProjectFromKm(kmPackageUuid, kmName, projectName) {
  cy.visitApp('/projects/create')
  cy.getField('name').type(projectName)
  cy.get('body').then(($body) => {
    if ($body.find('[data-cy="project-create-starting-point_knowledge-model"]').length > 0) {
      cy.getCy('project-create-starting-point_knowledge-model').click()
    }
  })
  cy.getField('knowledgeModelPackageUuid').click()
  cy.focused().type(kmName)
  cy.getCy(`form-knowledgeModelPackageUuid_option_${kmPackageUuid}`).click()
  cy.get('#c-create-form').within(() => cy.getCy('form-submit').click())

  return cy.url()
    .should('match', /\/projects\/[0-9a-f-]{36}/).waitForPageFocus()
    .then((url) => url.match(/\/projects\/([0-9a-f-]{36})/)[1])
}

export function deleteProject(projectUuid) {
  if (!projectUuid) {
    return
  }
  cy.apiToken().then((token) => {
    cy.request({
      method: 'DELETE',
      url: `${Cypress.expose('apiUrl')}/projects/${projectUuid}`,
      headers: { Authorization: `Bearer ${token}` },
      failOnStatusCode: false
    })
  })
}

// Signed object-storage URLs (previews, documents, files) can answer NoSuchKey for a
// moment after the API already handed them out - retried rather than failing.
export function fetchSignedContent(url, attemptsLeft = 10) {
  return cy.request({ url, failOnStatusCode: false }).then((response) => {
    if (response.status >= 200 && response.status < 300) {
      return typeof response.body === 'string' ? response.body : JSON.stringify(response.body)
    }
    if (attemptsLeft <= 1) {
      throw new Error(`Content at ${url} never became available (last status ${response.status})`)
    }
    cy.wait(1000)
    return fetchSignedContent(url, attemptsLeft - 1)
  })
}

export function importBasicKmAndReportTemplate() {
  cy.fixture('shared/basic-km.json').then((fixture) => cy.cleanupKnowledgeModelPackage(fixture.id))
  cy.cleanupDocumentTemplate(QUESTIONNAIRE_REPORT_ID)

  return cy.importKM('shared/basic-km.json').then((kmPackage) => {
    return cy.importTemplate('templates/questionnaire-report.zip').then((template) => ({ kmPackage, template }))
  })
}
