export function selectNone() {
    cy.getCy('km-editor_preview_tags_select-none').click()
}

export function selectAll() {
    cy.getCy('km-editor_preview_tags_select-all').click()
}

export function select(tag) {
    cy.get('.tag-selection .tag-label').contains(tag).click()
}

export function selectMultiple(tags) {
    tags.forEach(select)
}