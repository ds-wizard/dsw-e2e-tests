import { downloadAndDeleteDocument } from '../../shared/projects/projectDocuments'

// Researcher - any editor of the project can generate, download and delete its documents.
describe('Projects / documents', () => {
  beforeEach(() => {
    cy.loginAs('researcher')
  })

  it('downloads and deletes a generated document', () => {
    downloadAndDeleteDocument()
  })
})
