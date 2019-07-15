export function open(kmId) {
    cy.clickListingItemAction(kmId, 'Open Editor')
    cy.url().should('contain', '/km-editor/edit')
    cy.get('.editor-header').should('exist')
}


export function saveAndClose() {
    cy.get('.btn').contains('Save').click()
    cy.get('.btn-outline-primary').contains('Close').click()
}


export function addInputChild(child) {
    cy.get('.link-add-child').contains(`Add ${child}`).click()
}


export function openChild(child) {
    const childName = escapeRegExp(child)
    const re = new RegExp(`^${childName}$`)
    cy.get('.input-child a').contains(re).click()
    cy.get('.breadcrumb-item').contains(child).should('exist')
}


export function createChildren(parents) {
    parents.forEach(([type, fields]) => {
        addInputChild(type)
        cy.fillFields(fields)
    })
}


export function traverseChildren(path) {
    path.forEach(openChild)
}


export function deleteCurrent() {
    cy.get('.btn').contains('Delete').click()
}


export function confirmDelete() {
    cy.get('.modal-content .btn').contains('Delete').click()
}


export function shouldNotHaveChild(child) {
    const childName = escapeRegExp(child)
    const re = new RegExp(`^${childName}$`)
    cy.contains('.input-child a', re).should('not.exist')
}


function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}