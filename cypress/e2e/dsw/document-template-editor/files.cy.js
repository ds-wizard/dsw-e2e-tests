import { manageDocumentTemplateFiles } from '../../shared/document-template-editor/documentTemplateEditorFiles'

// Cleanup is an `afterEach` (not inline like other specs): a flaky assertion mid-test
// used to skip cleanup and leak the editor. `function`, not an arrow, to share `this`
// with the `it` below, which sets `editorUuid`.
describe('Document Template Editor / files', () => {
  beforeEach(() => {
    cy.loginAs('dataSteward')
  })

  afterEach(function () {
    if (this.editorUuid) {
      cy.apiToken().then((token) => {
        cy.request({
          method: 'DELETE',
          url: `${Cypress.expose('apiUrl')}/document-template-drafts/${this.editorUuid}`,
          headers: { Authorization: `Bearer ${token}` }
        })
      })
    }
  })

  it('adds a folder, a file, an uploaded text file and an uploaded binary, and reopens all three after a reload to check their content', function () {
    manageDocumentTemplateFiles().then((editorUuid) => {
      this.editorUuid = editorUuid
    })
  })
})
