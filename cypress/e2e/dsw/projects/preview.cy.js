import { previewProjectDocument } from '../../shared/projects/projectPreview'

// Researcher - the project's owner sets its default template in Settings.
describe('Projects / preview', () => {
  beforeEach(() => {
    cy.loginAs('researcher')
  })

  it('previews the document of the project\'s default template and format', () => {
    previewProjectDocument()
  })
})
