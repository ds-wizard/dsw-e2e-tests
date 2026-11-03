// Document Template Editor / Preview - adds a format with a "json" step (the
// simplest step type, needing no Jinja template or Pandoc/wkhtmltopdf toolchain -
// same as questionnaire-report.zip's own "JSON Data" format), picks a project to
// render it against, and confirms a real document comes back, not just that the
// tab loads.
//
// "dt-editor_save" no longer existing is this editor's save-completed signal
// (Save/Publish are mutually exclusive on whether anything is still unsaved).
//
// The preview can render inline (iframe) or as a download link depending on the
// format - checks for either rather than assuming which "json" gets.
function addStep(formatIndex, stepIndex, stepName) {
  cy.getCy(`dt-settings-steps-${formatIndex}_add`).click()
  cy.get(`#dt-settings-step-${formatIndex}-${stepIndex}`).type(stepName)
}

// Retries fetching the preview's own content, not just its URL - observed live,
// Garage can still answer "NoSuchKey" for a moment after the frontend already
// treats the render as done.
function fetchPreviewContent(url, attemptsLeft) {
  return cy.request({ url, failOnStatusCode: false }).then((response) => {
    if (response.status >= 200 && response.status < 300) {
      return typeof response.body === 'string' ? response.body : JSON.stringify(response.body)
    }

    if (attemptsLeft <= 1) {
      throw new Error(`Preview content at ${url} never became available (last status ${response.status})`)
    }

    cy.wait(1000)
    return fetchPreviewContent(url, attemptsLeft - 1)
  })
}

export function previewDocumentTemplate() {
  const documentTemplateId = `dt-${Date.now()}`
  const documentTemplateName = `Test Document Template ${Date.now()}`
  const formatName = `Test JSON Format ${Date.now()}`
  const projectName = `Test Preview Project ${Date.now()}`

  cy.fixture('shared/basic-km.json').then((fixture) => cy.cleanupKnowledgeModelPackage(fixture.id))

  cy.importKM('shared/basic-km.json').then((kmPackage) => {
    cy.visitApp('/document-templates/editors/create')
    cy.getField('name').type(documentTemplateName)
    cy.getField('id').clear().type(documentTemplateId)
    cy.getField('versionMajor').clear().type('1')
    cy.getField('versionMinor').clear().type('0')
    cy.getField('versionPatch').clear().type('0')
    cy.getCy('form-submit').click()

    cy.url()
      .should('match', /\/document-templates\/editors\/[0-9a-f-]{36}$/)
      .then((editorUrl) => {
        const editorUuid = editorUrl.split('/').pop()

        cy.visitApp(`/document-templates/editors/${editorUuid}/settings/formats`)
        cy.getCy('dt-settings-format-list_add').click()
        cy.get('#dt-settings-format-name-0').clear().type(formatName)
        addStep(0, 0, 'json')

        cy.getCy('dt-editor_save').click()
        cy.getCy('dt-editor_save').should('not.exist')

        cy.visitApp('/projects/create')
        cy.getField('name').type(projectName)
        cy.getField('knowledgeModelPackageUuid').click()
        cy.focused().type('Basic KM')
        cy.getCy(`form-knowledgeModelPackageUuid_option_${kmPackage.uuid}`).click()
        cy.getCy('form-submit').click()

        cy.url()
          .should('match', /\/projects\/[0-9a-f-]{36}/).waitForPageFocus()
          .then((projectUrl) => {
            const projectUuid = projectUrl.match(/\/projects\/([0-9a-f-]{36})/)[1]

            // Preview defaults to "Project" mode, no mode switch needed first.
            //
            // Selecting project then format each PUT the full settings record and
            // only GET the preview once that PUT lands - without waiting here, the
            // two PUTs can arrive out of order and wipe the format back to unset
            // (confirmed live via a 400 project_or_format_not_set_up).
            cy.intercept('PUT', '**/document-template-drafts/*/documents/preview/settings').as('savePreviewSettings')

            cy.visitApp(`/document-templates/editors/${editorUuid}/preview`)
            cy.get('#dt-preview-project').click()
            cy.focused().type(projectName)
            cy.getCy(`dt-preview-project_option_${projectUuid}`).click()
            cy.wait('@savePreviewSettings')

            cy.get('#dt-preview-format').select(formatName)
            cy.wait('@savePreviewSettings')

            cy.getCy('dt-editor_preview-document', { timeout: 20000 }).should(($el) => {
              const hasFrame = $el.find('[data-cy="dt-editor_preview-frame"]').length > 0
              const hasDownload = $el.find('[data-cy="dt-editor_preview-download"]').length > 0
              expect(hasFrame || hasDownload, 'the preview rendered either inline or as a download link').to.be.true
            }).then(($el) => {
              const $frame = $el.find('[data-cy="dt-editor_preview-frame"]')
              const url = $frame.length > 0
                ? $frame.attr('src')
                : $el.find('[data-cy="dt-editor_preview-download"]').attr('href')

              fetchPreviewContent(url, 10).then((content) => {
                expect(content, "the rendered preview contains the project's own name").to.include(projectName)
              })
            })

            cy.apiToken().then((token) => {
              cy.request({
                method: 'DELETE',
                url: `${Cypress.expose('apiUrl')}/document-template-drafts/${editorUuid}`,
                headers: { Authorization: `Bearer ${token}` }
              })
              cy.request({
                method: 'DELETE',
                url: `${Cypress.expose('apiUrl')}/projects/${projectUuid}`,
                headers: { Authorization: `Bearer ${token}` }
              })
            })
          })
      })
  })
}
