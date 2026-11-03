import { downloadProjectFile } from '../../shared/projects/projectFiles'

// Data Steward - building the File question's KM needs the KM editor.
describe('Projects / files', () => {
  beforeEach(() => {
    cy.loginAs('dataSteward')
  })

  it('downloads a file uploaded through a File question', () => {
    downloadProjectFile()
  })
})
