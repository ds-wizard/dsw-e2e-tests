// Projects / preview - sets a default document template and format in the project's
// Settings, then checks the Preview tab renders a real document for it.
//
// Uses questionnaire-report's "JSON Data" format: no rendering toolchain needed, and
// application/json is shown inline (an iframe), never as a download link.
import {
  JSON_FORMAT_UUID,
  QUESTIONNAIRE_REPORT_ID,
  createProjectFromKm,
  deleteProject,
  fetchSignedContent,
  importBasicKmAndReportTemplate
} from './projectTabsHelpers'

export function setDefaultDocumentTemplate(projectUuid, template) {
  cy.visitApp(`/projects/${projectUuid}/settings`)
  cy.getField('documentTemplateUuid').click()
  cy.focused().type(template.name)
  cy.getCy(`form-documentTemplateUuid_option_${template.uuid}`).click()
  cy.getCy(`form-formatUuid_${JSON_FORMAT_UUID}`).click()
  // ShareModal's always-mounted form-submit would also match a bare getCy.
  cy.getPageFormTestId('form-submit').click()
  cy.getCy('form-unsaved').should('have.attr', 'hidden')
}

export function previewProjectDocument() {
  const projectName = `Test Preview Project ${Date.now()}`

  importBasicKmAndReportTemplate().then(({ kmPackage, template }) => {
    createProjectFromKm(kmPackage.uuid, 'Basic KM', projectName).then((projectUuid) => {
      setDefaultDocumentTemplate(projectUuid, template)

      cy.getCy('project_nav_preview').click()
      // The tab polls through 202s until the document is rendered.
      cy.getCy('project-preview_frame', { timeout: 30000 })
        .should('have.attr', 'src')
        .then((src) => {
          fetchSignedContent(src).then((content) => {
            expect(content, "the preview contains the project's own name").to.include(projectName)
          })
        })

      deleteProject(projectUuid)
      cy.cleanupDocumentTemplate(QUESTIONNAIRE_REPORT_ID)
    })
  })
}
