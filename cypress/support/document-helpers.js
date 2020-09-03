
export function submitDocumentForm(document, template, format) {
    cy.get('#name').clear().type(document)
    cy.get('#templateId').select(template)
    cy.contains(format).click()
    cy.get('.form-actions button').contains('Create').click()
}

export function createDocument(document, questionnaireUuid, template, format) {
    cy.visitApp(`/documents/create/${questionnaireUuid}`)
    submitDocumentForm(document, template, format)
}

export function checkDocument(document, wait = false) {
    cy.visitApp('/documents')
    cy.contains(document)
    if (wait) {
        cy.wait(1000) // Wait for document generation
    }
    cy.get('span.badge-danger').should('not.exist')
    cy.get('span.badge-info').should('not.exist')
}
