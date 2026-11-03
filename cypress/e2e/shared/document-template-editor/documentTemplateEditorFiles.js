// Document Template Editor / Files tab. Covers a folder (client-side only), a blank
// file typed and saved, an uploaded text file (becomes an editable FILE), and an
// uploaded binary file (stays an ASSET, shown as a Download link). After a reload,
// all three are reopened and their content re-verified against the server.
//
// Resolves to the new editor's uuid rather than deleting it itself - the caller's
// afterEach does that, so a flaky assertion mid-test doesn't skip cleanup.
//
// dt-editor_dialog unmounts entirely when closed (unlike ShareModal and other
// Modal.toHtml dialogs elsewhere), so "closed" is asserted as not.exist, not
// not.have.attr('open').

// The file tree's "Add" menu trigger is a raw DOM id, not a data-cy - same
// Ui.Menu flaky-open race as the sort toolbar/listing kebab elsewhere in this
// suite (force + retry until the expected item appears).
function openAddMenu(itemTestId) {
  function attempt(attemptsLeft) {
    cy.get('#dt-editor_file-tree_add-trigger').click({ force: true })
    cy.wait(250)
    cy.get('body').then(($body) => {
      if ($body.find(`[data-cy="${itemTestId}"]`).length === 0 && attemptsLeft > 1) {
        attempt(attemptsLeft - 1)
      }
    })
  }

  attempt(15)
  return cy.getCy(itemTestId)
}

export function manageDocumentTemplateFiles() {
  const documentTemplateId = `dt-${Date.now()}`
  const documentTemplateName = `Test Document Template ${Date.now()}`
  const folderName = `assets-${Date.now()}`
  const fileName = `styles-${Date.now()}.css`
  const fileContent = 'body { color: red; }'
  const uploadedFileName = `uploaded-${Date.now()}.txt`
  const uploadedFileContent = 'A text file uploaded by the E2E suite - still editable here.'
  const assetFileName = `asset-${Date.now()}.bin`
  const assetContent = 'An asset uploaded by the E2E suite - not text, not shown inline.'

  cy.visitApp('/document-templates/editors/create')
  cy.getField('name').type(documentTemplateName)
  cy.getField('id').clear().type(documentTemplateId)
  cy.getField('versionMajor').clear().type('1')
  cy.getField('versionMinor').clear().type('0')
  cy.getField('versionPatch').clear().type('0')
  cy.getCy('form-submit').click()

  return cy.url()
    .should('match', /\/document-templates\/editors\/[0-9a-f-]{36}$/)
    .then((url) => {
      const editorUuid = url.split('/').pop()

      openAddMenu('dt-editor_file-tree_add-folder').click()
      cy.getCy('dt-editor_dialog').within(() => {
        cy.get('#dt-editor-dialog-name').type(folderName)
        cy.getCy('form-submit').click()
      })
      cy.getCy('dt-editor_dialog').should('not.exist')
      cy.contains('[data-cy="dt-editor_file-tree_folder"]', folderName).should('exist')

      // Lands inside the folder just made - it stays selected after creation.
      openAddMenu('dt-editor_file-tree_add-file').click()
      cy.getCy('dt-editor_dialog').within(() => {
        cy.get('#dt-editor-dialog-name').type(fileName)
        cy.getCy('form-submit').click()
      })

      cy.getCy('dt-editor_dialog').should('not.exist')
      // parseSpecialCharSequences: false - the CSS braces in fileContent are literal
      // text, not cy.type()'s own "{selectAll}"-style sequences.
      cy.focused().type(fileContent, { parseSpecialCharSequences: false })
      cy.contains('[data-cy="dt-editor_file-tree_file"]', fileName).should('contain.text', 'Unsaved')

      cy.getCy('dt-editor_save').click()
      cy.contains('[data-cy="dt-editor_file-tree_file"]', fileName).should('not.contain.text', 'Unsaved')

      openAddMenu('dt-editor_file-tree_upload').click()
      cy.getCy('dt-editor_dialog').within(() => {
        cy.getCy('file-upload_dropzone').selectFile(
          { contents: Cypress.Buffer.from(uploadedFileContent), fileName: uploadedFileName, mimeType: 'text/plain' },
          { action: 'drag-drop' }
        )
        cy.getCy('form-submit').click()
      })

      cy.getCy('dt-editor_dialog').should('not.exist')
      cy.contains('[data-cy="dt-editor_file-tree_file"]', uploadedFileName)
        .should('exist')
        .and('not.contain.text', 'Unsaved')

      cy.apiToken().then((token) => {
        cy.request({
          method: 'GET',
          url: `${Cypress.expose('apiUrl')}/document-template-drafts/${editorUuid}/files`,
          headers: { Authorization: `Bearer ${token}` }
        }).then(({ body: files }) => {
          const uploadedFile = files.find((candidate) => candidate.fileName === `${folderName}/${uploadedFileName}`)
          expect(uploadedFile, 'the uploaded text file is found among the FILES, not the assets').to.exist

          cy.contains('[data-cy="dt-editor_file-tree_file"]', uploadedFileName).click()
          cy.get(`#dt-editor-file-${uploadedFile.uuid}`).should('contain.text', uploadedFileContent)
        })
      })

      openAddMenu('dt-editor_file-tree_upload').click()
      cy.getCy('dt-editor_dialog').within(() => {
        cy.getCy('file-upload_dropzone').selectFile(
          { contents: Cypress.Buffer.from(assetContent), fileName: assetFileName, mimeType: 'application/octet-stream' },
          { action: 'drag-drop' }
        )
        cy.getCy('form-submit').click()
      })

      cy.contains('[data-cy="dt-editor_file-tree_asset"]', assetFileName)
        .should('exist')
        .click()
      cy.getCy('dt-editor_asset-download')
        .should('have.attr', 'href')
        .then((href) => {
          cy.request(href).its('body').should('equal', assetContent)
        })

      cy.reload()

      cy.apiToken().then((token) => {
        cy.request({
          method: 'GET',
          url: `${Cypress.expose('apiUrl')}/document-template-drafts/${editorUuid}/files`,
          headers: { Authorization: `Bearer ${token}` }
        }).then(({ body: files }) => {
          const file = files.find((candidate) => candidate.fileName === `${folderName}/${fileName}`)
          expect(file, 'the saved file is found by its own full path').to.exist

          const uploadedFile = files.find((candidate) => candidate.fileName === `${folderName}/${uploadedFileName}`)
          expect(uploadedFile, 'the uploaded text file is found among the FILES, not the assets').to.exist

          cy.contains('[data-cy="dt-editor_file-tree_file"]', fileName).click()
          cy.get(`#dt-editor-file-${file.uuid}`).should('contain.text', fileContent)

          cy.contains('[data-cy="dt-editor_file-tree_file"]', uploadedFileName).click()
          cy.get(`#dt-editor-file-${uploadedFile.uuid}`).should('contain.text', uploadedFileContent)
        })

        cy.request({
          method: 'GET',
          url: `${Cypress.expose('apiUrl')}/document-template-drafts/${editorUuid}/assets`,
          headers: { Authorization: `Bearer ${token}` }
        }).then(({ body: assets }) => {
          const asset = assets.find((candidate) => candidate.fileName === `${folderName}/${assetFileName}`)
          expect(asset, 'the uploaded binary is found among the ASSETS, not the files').to.exist

          cy.contains('[data-cy="dt-editor_file-tree_asset"]', assetFileName).click()
          cy.getCy('dt-editor_asset-download')
            .should('have.attr', 'href')
            .then((href) => {
              cy.request(href).its('body').should('equal', assetContent)
            })
        })
      })

      return cy.wrap(editorUuid)
    })
}
