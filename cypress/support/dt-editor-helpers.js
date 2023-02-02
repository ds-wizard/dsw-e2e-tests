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
