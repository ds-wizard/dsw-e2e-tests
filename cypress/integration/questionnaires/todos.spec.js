import * as questionnaire from '../../support/questionnaire-helpers'


describe('Questionnaire TODOs', () => {
    const questionnaireName = 'Test Questionnaire'
    const kmId = 'test-km-1'
    const packageId = 'dsw:test-km-1:1.0.0'


    before(() => {
        cy.task('mongo:delete', {
            collection: 'packages',
            args: { kmId: kmId }
        })
        cy.fixture('test-km-1').then((km) => {
            cy.importKM(km)
        })
    })


    beforeEach(() => {
        cy.task('mongo:delete', {
            collection: 'questionnaires',
            args: {}
        })
        cy.createQuestionnaire({
            accessibility: questionnaire.PublicReadOnly,
            name: questionnaireName,
            packageId
        })
        cy.loginAs('researcher')
        cy.visitApp('/questionnaires')
        cy.clickListingItemAction(questionnaireName, 'Fill questionnaire')
        cy.get('.top-header').should('exist')
    })


    const simpleTests = [{
        name: 'top level question',
        chapter: 'Chapter 1',
        question: 'Options Question 1',
        prepare: () => { }
    }, {
        name: 'nested question',
        chapter: 'Chapter 1',
        question: 'Follow-up Question 1',
        prepare: () => {
            questionnaire.selectAnswer('Answer 1')
        }
    }, {
        name: 'item question',
        chapter: 'Chapter 1',
        question: 'Answer Item Question 1',
        prepare: () => {
            cy.clickBtn('Add')
        }
    }]


    simpleTests.forEach((test) => {
        it(`add todo for ${test.name}`, () => {
            // add todo and check it was added
            test.prepare()
            questionnaire.addTodoFor(test.question)
            questionnaire.expectTodo(test.chapter, test.question)

            // save, reopen and check again
            questionnaire.saveAndClose()
            cy.clickListingItemAction(questionnaireName, 'Fill questionnaire')
            questionnaire.expectTodo(test.chapter, test.question)
        })
    })


    simpleTests.forEach((test) => {
        it(`remove todo for ${test.name}`, () => {
            // add todo, save and reopen
            test.prepare()
            questionnaire.addTodoFor(test.question)
            questionnaire.saveAndClose()
            cy.clickListingItemAction(questionnaireName, 'Fill questionnaire')

            // remove todo and check there are no todos
            questionnaire.removeTodoFor(test.question)
            questionnaire.expectNoTodo()

            // save, reopen and check again
            questionnaire.saveAndClose()
            cy.clickListingItemAction(questionnaireName, 'Fill questionnaire')
            questionnaire.expectNoTodo()
        })
    })


    it('shows correct count for top level questions', () => {
        questionnaire.expectNoTodo()

        questionnaire.addTodoFor('Options Question 1')
        questionnaire.expectTodoCount(1)

        questionnaire.addTodoFor('Value Question 1')
        questionnaire.expectTodoCount(2)

        cy.clickBtn('Discard')
    })


    it('shows correct count for nested questions', () => {
        questionnaire.expectNoTodo()

        questionnaire.selectAnswer('Answer 1')
        questionnaire.addTodoFor('Follow-up Question 1')
        questionnaire.expectTodoCount(1)

        cy.get('.clear-answer').click()
        questionnaire.expectNoTodo()

        questionnaire.selectAnswer('Answer 1')
        questionnaire.expectTodoCount(1)

        cy.clickBtn('Discard')
    })


    it('shows correct count for item question', () => {
        questionnaire.expectNoTodo()

        cy.clickBtn('Add')
        questionnaire.addTodoFor('Answer Item Question 1')
        questionnaire.expectTodoCount(1)

        cy.get('.btn-item-delete').click()
        questionnaire.expectNoTodo()

        cy.clickBtn('Discard')
    })


    it('shows correct count for deep nested question', () => {
        questionnaire.expectNoTodo()

        questionnaire.selectAnswer('Answer 1')

        questionnaire.addTodoFor('Follow-up Question 1')
        questionnaire.expectTodoCount(1)

        cy.get('.followups-group .btn').contains('Add').click()

        questionnaire.addTodoFor('Follow-up Answer Item Question')
        questionnaire.expectTodoCount(2)

        cy.get('.clear-answer').click()
        questionnaire.expectNoTodo()

        cy.clickBtn('Discard')
    })
})
