export const Public = 'PublicQuestionnaire'
export const PublicReadOnly = 'PublicReadOnlyQuestionnaire'
export const Private = 'PrivateQuestionnaire'


export function selectAnswer(answer) {
    cy.get('label').contains(answer).click()
}


export function checkAnswerChecked(answer) {
    cy.get('label').contains(answer).find('input').should('be.checked')
}


export function checkAnswerNotChecked(answer) {
    cy.get('label').contains(answer).find('input').should('not.be.checked')
}


export function typeAnswer(label, answer) {
    cy.get('label').contains(label).closest('.form-group').find('input').clear().type(answer)
}


export function checkAnswer(label, answer) {
    cy.get('label').contains(label).closest('.form-group').find('input').should('have.value', answer)
}


export function typeAnswerText(label, answer) {
    cy.get('label').contains(label).closest('.form-group').find('textarea').clear().type(answer)
}


export function checkAnswerText(label, answer) {
    cy.get('label').contains(label).closest('.form-group').find('textarea').should('have.value', answer)
}
