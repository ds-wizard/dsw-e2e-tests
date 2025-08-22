import * as project from './project-helpers'
import { dataCy } from './utils'

export function submitDocumentForm(document, format) {
    cy.get('#name').clear().type(document)
    cy.contains(format).click()
    cy.get('.form-actions button').contains('Create').click()
}

export function createDocument(document, questionnaireUuid, format) {
    cy.visitApp(`/projects/${questionnaireUuid}/documents/new`)
    submitDocumentForm(document, format)
}

export function checkDocument(document,) {
    cy.contains(document)
    cy.get(dataCy('badge_doc_queued'), { timeout: 10000 }).should('not.exist')
    cy.get(dataCy('badge_doc_in-progress'), { timeout: 10000 }).should('not.exist')
    cy.getCy('badge_doc_error').should('not.exist')
}
