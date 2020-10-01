import * as project from './project-helpers'

export function submitDocumentForm(document, format) {
    cy.get('#name').clear().type(document)
    cy.contains(format).click()
    cy.get('.form-actions button').contains('Create').click()
}

export function createDocument(document, questionnaireUuid, format) {
    cy.visitApp(`/projects/${questionnaireUuid}/documents/new`)
    submitDocumentForm(document, format)
}

export function checkDocument(document, wait = false) {
    cy.contains(document)
    if (wait) {
        cy.wait(1000) // Wait for document generation
    }
    cy.get('span.badge-danger').should('not.exist')
    cy.get('span.badge-info').should('not.exist')
}
