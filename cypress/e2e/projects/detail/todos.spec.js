import * as project from '../../../support/project-helpers'


describe('TODOs', () => {
    const projectName = 'Test Project'
    const kmId = 'test-km-1'
    const packageId = 'dsw:test-km-1:1.0.0'


    before(() => {
        cy.task('package:delete', { km_id: kmId })
        cy.clearServerCache()

        cy.importKM('test-km-1')
    })


    beforeEach(() => {
        cy.task('questionnaire:delete')
        cy.clearServerCache()
        
        cy.createQuestionnaire({
            visibility: project.VisibleView,
            sharing: project.Restricted,
            name: projectName,
            packageId
        })
        cy.loginAs('researcher')
        project.open(projectName)
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
            project.selectAnswer('Answer 1')
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
            project.addTodoFor(test.question)
            project.expectTodo(test.question)

            // save, reopen and check again
            project.awaitSave()
            project.open(projectName)
            project.expectTodo(test.question)
        })
    })


    simpleTests.forEach((test) => {
        it(`remove todo for ${test.name}`, () => {
            // add todo, save and reopen
            test.prepare()
            project.addTodoFor(test.question)
            project.awaitSave()
            project.open(projectName)

            // remove todo and check there are no todos
            project.removeTodoFor(test.question)
            project.expectNoTodo()

            // save, reopen and check again
            project.awaitSave()
            project.open(projectName)
            project.expectNoTodo()
        })
    })


    it('shows correct count for top level questions', () => {
        project.expectNoTodo()

        project.addTodoFor('Options Question 1')
        project.expectTodoCount(1)

        project.addTodoFor('Value Question 1')
        project.expectTodoCount(2)
    })


    it('shows correct count for nested questions', () => {
        project.expectNoTodo()

        project.selectAnswer('Answer 1')
        project.addTodoFor('Follow-up Question 1')
        project.expectTodoCount(1)

        cy.get('.clear-answer').click()
        project.expectNoTodo()

        project.selectAnswer('Answer 1')
        project.expectTodoCount(1)
    })


    it('shows correct count for item question', () => {
        project.expectNoTodo()

        cy.clickBtn('Add')
        project.addTodoFor('Answer Item Question 1')
        project.expectTodoCount(1)

        cy.getCy('item-delete').click()
        cy.clickModalAction()
        project.expectNoTodo()
    })


    it('shows correct count for deep nested question', () => {
        project.expectNoTodo()

        project.selectAnswer('Answer 1')

        project.addTodoFor('Follow-up Question 1')
        project.expectTodoCount(1)

        cy.get('.followups-group .btn').contains('Add').click()

        project.addTodoFor('Follow-up Answer Item Question')
        project.expectTodoCount(2)

        cy.get('.clear-answer').click()
        project.expectNoTodo()
    })
})
