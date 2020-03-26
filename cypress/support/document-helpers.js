
export function submitDocumentForm(document, questionnaire, template, format) {
    cy.get('#name').type(document)
    if (questionnaire !== null) {
        cy.get('#questionnaireUuid').select(questionnaire)
    }
    cy.get('#templateUuid').select(template)
    cy.contains(format).click()
    cy.get('.form-actions button').contains('Create').click()
}

export function createDocument(document, questionnaire, template, format) {
    cy.visitApp('/documents')

    cy.get('.header .actions a').contains('Create').click()
    submitDocumentForm(document, questionnaire, template, format)
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
