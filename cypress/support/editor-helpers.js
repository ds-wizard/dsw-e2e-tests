export function open(kmId) {
    cy.clickListingItemAction(kmId, 'Open Editor')
    cy.url().should('contain', '/km-editor/edit')
    cy.get('.editor-header').should('exist')
}


export function saveAndClose() {
    cy.get('.btn').contains('Save').click()
    cy.get('.btn-outline-primary').contains('Close').click()
}


export function discardChanges() {
    cy.get('.btn').contains('Discard').click()
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

export function openKM() {
    cy.get('.nav-link').contains('Knowledge Model').click()
    cy.get('.KMEditor__Editor__KMEditor').should('exist')
}


export function openTags() {
    cy.get('.nav-link').contains('Tags').click()
    cy.get('.KMEditor__Editor__TagEditor').should('exist')
}


export function openPreview() {
    cy.get('.nav-link').contains('Preview').click()
    cy.get('.KMEditor__Editor__Preview').should('exist')
}


function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
