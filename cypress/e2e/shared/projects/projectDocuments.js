// Projects / documents tab - generates a document, downloads it once it's done, then
// deletes it.
//
// Download goes through a hidden iframe pointed at a signed URL the app first asks
// the API for (GET /documents/:uuid/download), so the check intercepts that call and
// fetches the URL it returned rather than reading the downloads folder.
import {
  JSON_FORMAT_UUID,
  QUESTIONNAIRE_REPORT_ID,
  createProjectFromKm,
  deleteProject,
  fetchSignedContent,
  importBasicKmAndReportTemplate
} from './projectTabsHelpers'

function createDocument(projectUuid, template) {
  cy.intercept('POST', '**/documents').as('createDocument')

  cy.visitApp(`/projects/${projectUuid}/documents/new`)
  cy.getField('documentTemplateUuid').click()
  cy.focused().type(template.name)
  cy.getCy(`form-documentTemplateUuid_option_${template.uuid}`).click()
  cy.getCy(`form-formatUuid_${JSON_FORMAT_UUID}`).click()
  cy.get('#c-create-form').within(() => cy.getCy('form-submit').click())

  cy.url().should('match', new RegExp(`/projects/${projectUuid}/documents$`))

  return cy.wait('@createDocument').then(({ response }) => response.body.uuid)
}

export function downloadAndDeleteDocument() {
  const projectName = `Test Documents Tab Project ${Date.now()}`

  importBasicKmAndReportTemplate().then(({ kmPackage, template }) => {
    createProjectFromKm(kmPackage.uuid, 'Basic KM', projectName).then((projectUuid) => {
      createDocument(projectUuid, template).then((documentUuid) => {
        // The title only becomes a download link once the document is done - the
        // tab re-polls every second while it's queued/in progress.
        cy.getCy(`listing-item_${documentUuid}`)
          .find('[data-cy="listing-item_title-download"]', { timeout: 30000 })
          .should('exist')

        cy.intercept('GET', `**/documents/${documentUuid}/download`).as('documentUrl')
        cy.openListingItemActions(documentUuid, 'listing-item_action_download').click()
        cy.wait('@documentUrl').then(({ response }) => {
          expect(response.statusCode).to.eq(200)
          fetchSignedContent(response.body.url).then((content) => {
            expect(content, "the downloaded document contains the project's own name").to.include(projectName)
          })
        })

        cy.openListingItemActions(documentUuid, 'listing-item_action_delete').click()
        cy.getCy('documents-delete_confirm').click()
        cy.getCy(`listing-item_${documentUuid}`).should('not.exist')

        cy.reload()
        cy.getCy('listing-empty').should('exist')

        deleteProject(projectUuid)
        cy.cleanupDocumentTemplate(QUESTIONNAIRE_REPORT_ID)
      })
    })
  })
}
