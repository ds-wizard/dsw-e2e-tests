export const Public = 'PublicQuestionnaire'
export const PublicReadOnly = 'PublicReadOnlyQuestionnaire'
export const Private = 'PrivateQuestionnaire'


export function open(questionnaireName) {
    cy.visitApp('/questionnaires')
    cy.clickListingItemAction(questionnaireName, 'Fill questionnaire')
    cy.get('.top-header').should('exist')
}


export function expectQuestion(question, visible) {
    const predicate = visible ? 'exist' : 'not.exist'
    cy.get('.form-group label').contains(question).should(predicate)
}


export function expectQuestions(questions, visible) {
    questions.forEach(q => expectQuestion(q, visible))
}


export function selectAnswer(answer) {
    cy.get('label').contains(answer).click()
}


export function openChapter(chapter) {
    cy.get('.chapter-list .nav-link').contains(chapter).click()
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


export function addTodoFor(question) {
    cy.get('.form-group').contains(question).find('.action-add-todo').click()
}


export function removeTodoFor(question) {
    cy.get('.form-group').contains(question).find('.action-todo a').click()
}


export function expectTodoFor(question) {
    cy.get('.form-group').contains(question).find('.action-todo a').should('exist')
}


export function expectTodo(chapter, question) {
    cy.get('.Questionnaire .nav-link').contains('TODOs').click()
    cy.get('.list-group-item').contains(question)
        .closest('.list-group-item').find('small').contains(chapter)
        .closest('.list-group-item').click()
    cy.get('.form-group').contains(question).should('be.visible')
        .find('.action-todo').contains('TODO')

}


export function expectTodoCount(count) {
    cy.get('.Questionnaire .nav-link').contains('TODOs').find('.badge').contains(count)
}


export function expectNoTodo() {
    cy.get('.Questionnaire .nav-link').contains('TODOs').should('not.exist')
    cy.get('.action-todo').should('not.exist')
}


export function saveAndClose() {
    cy.clickBtn('Save')
    cy.clickBtn('Close')
}


export function resolveAndFinalizeMigration() {
    cy.clickBtn('Resolve')
    cy.clickBtn('Finalize Migration')
    cy.url().should('contain', '/questionnaires/detail/')
}


export function finalizeMigration() {
    cy.clickBtn('Finalize Migration')
    cy.url().should('contain', '/questionnaires/detail/')
}
