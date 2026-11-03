// Project files - the workspace-wide list of files uploaded in any project (needs
// projects.edit): a file uploaded in a project is listed with its project, downloads,
// and can be deleted from here.
import { deleteQuestionTypeKm } from '../projects/questionTypeKms'
import { createProjectWithUploadedFile, expectFileDownload } from '../projects/projectFiles'
import { deleteProject } from '../projects/projectTabsHelpers'

export function listDownloadAndDeleteProjectFile() {
  createProjectWithUploadedFile().then(({ km, projectUuid, projectName, fileUuid, fileName, fileContent }) => {
    cy.visitApp('/project-files')
    cy.getCy(`listing-item_${fileUuid}`)
      .should('contain.text', fileName)
      .and('contain.text', projectName)

    cy.intercept('GET', `**/projects/${projectUuid}/files/${fileUuid}`).as('fileUrl')
    cy.openListingItemActions(fileUuid, 'listing-item_action_download').click()
    expectFileDownload(projectUuid, fileUuid, fileContent)

    cy.openListingItemActions(fileUuid, 'listing-item_action_delete').click()
    cy.getCy('file-delete_confirm').click()
    cy.getCy(`listing-item_${fileUuid}`).should('not.exist')

    cy.apiToken().then((token) => {
      cy.request({
        method: 'GET',
        url: `${Cypress.expose('apiUrl')}/projects/${projectUuid}/files`,
        headers: { Authorization: `Bearer ${token}` }
      }).then(({ body }) => {
        expect(body._embedded.projectFiles, "the project's own files").to.have.length(0)
      })
    })

    deleteProject(projectUuid)
    deleteQuestionTypeKm(km)
  })
}
