import * as documentTemplates from './document-templates-helpers'

export function createEditor(selectedTemplateId, expectedTemplateId) {
    documentTemplates.getDocumentTemplateUuid(selectedTemplateId).then((documentTemplateUuid) => {
        cy.visitApp(`/document-template-editors/create?selected=${documentTemplateUuid}&edit=true`)
    })
    cy.submitForm()
    return documentTemplates.getDocumentTemplateUuid(expectedTemplateId)
        .then((documentTemplateUuid) => {
            cy.url().should('contain', `/document-template-editors/${documentTemplateUuid}`)
            return new Promise((resolve) => resolve(documentTemplateUuid))
        })
}

export function save() {
    cy.getCy('dt-editor_save').click()
    cy.getCy('dt-editor_save').should('not.exist')
}

export function addFile() {
    cy.getCy('dt-editor_file-tree_add').click()
    cy.getCy('dt-editor_file-tree_add-file').click()
}

export function addFolder() {
    cy.getCy('dt-editor_file-tree_add').click()
    cy.getCy('dt-editor_file-tree_add-folder').click()
}

export function addAsset() {
    cy.getCy('dt-editor_file-tree_add').click()
    cy.getCy('dt-editor_file-tree_upload').click()
}
