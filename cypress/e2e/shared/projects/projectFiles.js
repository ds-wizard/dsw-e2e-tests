// Projects / files tab - downloads a file uploaded through a File question.
//
// Download goes through a hidden iframe pointed at a signed URL the app first asks
// the API for (GET /projects/:uuid/files/:fileUuid), so the check intercepts that call
// and fetches the URL it returned rather than reading the downloads folder.
//
// Needs a KM with a File question, built through the KM editor (questionTypeKms.js) -
// Data Steward only.
import { waitForSave } from '../km-editor/editor/kmEditorAddEntities'
import { buildFileQuestionKm, deleteQuestionTypeKm } from './questionTypeKms'
import { createProjectFromKm, deleteProject, fetchSignedContent } from './projectTabsHelpers'

// Resolves to { km, projectUuid, projectName, fileUuid, fileName, fileContent }.
export function createProjectWithUploadedFile() {
  const projectName = `Test Files Project ${Date.now()}`
  const fileName = `upload-${Date.now()}.csv`
  const fileContent = 'a,b,c\n1,2,3\n'

  return buildFileQuestionKm().then((km) => {
    const filePath = `${km.chapterUuid}.${km.fileQuestionUuid}`

    return createProjectFromKm(km.packageUuid, km.kmName, projectName).then((projectUuid) => {
      // The trigger button and the upload dialog share the "file-upload" test id.
      cy.get('button[data-cy="file-upload"]').click()
      cy.get('ui-dialog[data-cy="file-upload"]').within(() => {
        cy.getCy('file-upload_dropzone').selectFile(
          { contents: Cypress.Buffer.from(fileContent), fileName, mimeType: 'text/csv' },
          { action: 'drag-drop' }
        )
        cy.getCy('form-submit').click()
      })
      waitForSave()
      cy.getCy('questionnaire_file').should('contain.text', fileName)

      return cy.apiToken().then((token) => {
        return cy.request({
          method: 'GET',
          url: `${Cypress.expose('apiUrl')}/projects/${projectUuid}/questionnaire`,
          headers: { Authorization: `Bearer ${token}` }
        }).then(({ body }) => ({
          km,
          projectUuid,
          projectName,
          fileUuid: body.replies[filePath].value.value,
          fileName,
          fileContent
        }))
      })
    })
  })
}

export function expectFileDownload(projectUuid, fileUuid, fileContent) {
  cy.wait('@fileUrl').then(({ request, response }) => {
    expect(request.url).to.include(`/projects/${projectUuid}/files/${fileUuid}`)
    expect(response.statusCode).to.eq(200)
    fetchSignedContent(response.body.url).then((content) => {
      expect(content).to.eq(fileContent)
    })
  })
}

export function downloadProjectFile() {
  createProjectWithUploadedFile().then(({ km, projectUuid, fileUuid, fileName, fileContent }) => {
    cy.getCy('project_nav_files').click()
    cy.getCy(`listing-item_${fileUuid}`).should('contain.text', fileName)

    cy.intercept('GET', `**/projects/${projectUuid}/files/${fileUuid}`).as('fileUrl')
    cy.openListingItemActions(fileUuid, 'listing-item_action_download').click()
    expectFileDownload(projectUuid, fileUuid, fileContent)

    deleteProject(projectUuid)
    deleteQuestionTypeKm(km)
  })
}
