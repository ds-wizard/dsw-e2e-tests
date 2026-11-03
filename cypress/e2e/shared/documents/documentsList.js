// Documents / list - the cross-project generated-documents list. Creates two real
// projects, each from the same KM package, and generates one real document in each
// through the project's own "New Document" form - not a raw API POST - then
// confirms both show up together on the cross-project list, proving the
// aggregation actually works rather than just that the page loads.
//
// Uses templates/questionnaire-report.zip's "JSON Data" format - the simplest that
// exists, needing no Jinja template or Pandoc/wkhtmltopdf toolchain - and compatible
// with any KM package (its allowedPackages entry is a wildcard).
//
// Doesn't wait for the document-worker to finish rendering either document - the
// listing's own query filters on tenant and durability only, never state, so a
// document only needs to exist as a row to show up here.
//
// Cleans up by deleting each project (cascades to its own document) and the
// document template - not the KM package itself, reset by cleaning it before the
// next import instead (projectCreate.js's own convention).
import { JSON_FORMAT_UUID } from '../projects/projectTabsHelpers'

function createDocumentForProject(kmPackage, template, projectName) {
  cy.visitApp('/projects/create')
  cy.getField('name').type(projectName)
  cy.getField('knowledgeModelPackageUuid').click()
  cy.focused().type('Basic KM')
  cy.getCy(`form-knowledgeModelPackageUuid_option_${kmPackage.uuid}`).click()
  // #c-create-form, not a bare cy.getCy('form-submit') - that id is shared by
  // whatever else Project Detail always keeps mounted alongside the create form.
  cy.get('#c-create-form').within(() => cy.getCy('form-submit').click())

  return cy.url()
    .should('match', /\/projects\/[0-9a-f-]{36}/).waitForPageFocus()
    .then((url) => {
      const projectUuid = url.match(/\/projects\/([0-9a-f-]{36})/)[1]

      cy.intercept('POST', '**/documents').as('createDocument')

      cy.visitApp(`/projects/${projectUuid}/documents/new`)
      cy.getField('documentTemplateUuid').click()
      cy.focused().type(template.name)
      cy.getCy(`form-documentTemplateUuid_option_${template.uuid}`).click()
      cy.getCy(`form-formatUuid_${JSON_FORMAT_UUID}`).click()
      cy.get('#c-create-form').within(() => cy.getCy('form-submit').click())

      cy.url().should('match', new RegExp(`/projects/${projectUuid}/documents$`))

      return cy.wait('@createDocument').then(({ response }) => ({
        projectUuid,
        documentUuid: response.body.uuid,
        documentName: response.body.name
      }))
    })
}

export function viewDocumentsList() {
  const documentTemplateId = 'dsw.questionnaire-report'

  cy.fixture('shared/basic-km.json').then((fixture) => cy.cleanupKnowledgeModelPackage(fixture.id))
  cy.cleanupDocumentTemplate(documentTemplateId)

  cy.importKM('shared/basic-km.json').then((kmPackage) => {
    cy.importTemplate('templates/questionnaire-report.zip').then((template) => {
      createDocumentForProject(kmPackage, template, `Test Documents Project A ${Date.now()}`).then((docA) => {
        createDocumentForProject(kmPackage, template, `Test Documents Project B ${Date.now()}`).then((docB) => {
          cy.visitApp('/project-documents')
          cy.getCy(`listing-item_${docA.documentUuid}`).should('exist').and('contain.text', docA.documentName)
          cy.getCy(`listing-item_${docB.documentUuid}`).should('exist').and('contain.text', docB.documentName)

          cy.apiToken().then((token) => {
            cy.request({ method: 'DELETE', url: `${Cypress.expose('apiUrl')}/projects/${docA.projectUuid}`, headers: { Authorization: `Bearer ${token}` } })
            cy.request({ method: 'DELETE', url: `${Cypress.expose('apiUrl')}/projects/${docB.projectUuid}`, headers: { Authorization: `Bearer ${token}` } })
          })
          cy.cleanupDocumentTemplate(documentTemplateId)
        })
      })
    })
  })
}
