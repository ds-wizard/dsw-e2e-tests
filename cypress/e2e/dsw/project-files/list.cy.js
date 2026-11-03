import { listDownloadAndDeleteProjectFile } from '../../shared/project-files/projectFilesList'

// Data Steward - the page needs projects.edit, and the File question's KM the KM editor.
describe('Project files', () => {
  beforeEach(() => {
    cy.loginAs('dataSteward')
  })

  it('lists, downloads and deletes a file uploaded in a project', () => {
    listDownloadAndDeleteProjectFile()
  })
})
