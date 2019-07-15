export function selectNone() {
    cy.get('.tag-selection-header').contains('Select None').click()
}

export function selectAll() {
    cy.get('.tag-selection-header').contains('Select All').click()
}

export function select(tag) {
    cy.get('.tag-label').contains(tag).click()
}

export function selectMultiple(tags) {
    tags.forEach(select)
}