import { dataCy } from './utils'


export function open(kmId) {
    cy.clickListingItemAction(kmId, 'open-editor')
    cy.url().should('contain', '/km-editor/edit')
    cy.getCy('km-editor').should('exist')
}


export function addInputChild(child) {
    cy.getCy(`km-editor_input-children_${child}_add-button`).click()
}


export function openChild(child) {
    const childName = escapeRegExp(child)
    const re = new RegExp(`^${childName}$`)
    cy.getCy('reorderable_item').contains(re).click()
    cy.contains(child).should('exist')
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
    cy.getCy('km-editor_delete-button').click()
}


export function confirmDelete() {
    cy.clickModalAction()
}


export function shouldNotHaveChild(child) {
    const childName = escapeRegExp(child)
    const re = new RegExp(`^${childName}$`)
    cy.contains(dataCy('reorderable_item'), re).should('not.exist')
}

export function openKM() {
    cy.getCy('km-editor_nav_km').click()
    cy.getCy('km-editor_km').should('exist')
}


export function openTags() {
    cy.getCy('km-editor_nav_tags').click()
    cy.getCy('km-editor_tags').should('exist')
}


export function openPreview() {
    cy.getCy('km-editor_nav_preview').click()
    cy.getCy('km-editor_preview').should('exist')
}


export function moveModalOpenItem(child) {
    const childName = escapeRegExp(child)
    const re = new RegExp(`^${childName}$`)
    cy.getCy('km-editor_move-modal_item')
        .contains(re)
        .closest(dataCy('km-editor_move-modal_item'))
        .find(`>${dataCy('km-editor_move-modal_item_caret')}`)
        .click()
}


export function moveModalSelect(child) {
    const childName = escapeRegExp(child)
    const re = new RegExp(`^${childName}$`)
    cy.getCy('km-editor_move-modal_item').contains(re).click()
    cy.clickModalAction()
}


function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
