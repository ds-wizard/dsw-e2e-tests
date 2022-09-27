import * as project from '../../../../support/project-helpers'
import { dataCy } from '../../../../support/utils'

describe('Basic Questionnaire Tests', () => {
    const projectName = 'Test Project'
    const kmId = 'basic-questionnaire-test-km'
    const packageId = 'dsw:basic-questionnaire-test-km:1.0.0'


    const getCurrentYearAndMonth = () => {
        const date = new Date()
        const year = date.getFullYear()
        let month = date.getMonth() + 1
        month = month < 10 ? `0${month}` : month
        return `${year}-${month}`
    }


    before(() => {
        cy.task('package:delete', { km_id: kmId })
        cy.clearServerCache()

        cy.importKM(kmId)
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


    it('answer, advice & clear answer', () => {
        // select answer
        project.selectAnswer('Answer 1.1')
        cy.get('.alert-info').contains('This is an advice for answer 1.').should('be.visible')
        project.awaitSave()

        // reopen and check the answer
        project.open(projectName)
        project.checkAnswerChecked('Answer 1.1')
        cy.get('.alert-info').contains('This is an advice for answer 1.').should('be.visible')

        // clear answer and save
        cy.clickLink('Clear answer')
        project.checkAnswerNotChecked('Answer 1.1')
        cy.get('.alert-info').should('not.be.visible')

        // reopen and check it was cleared
        project.open(projectName)
        project.checkAnswerNotChecked('Answer 1.1')
        cy.get('.alert-info').should('not.be.visible')
    })


    it('choice', () => {
        project.selectAnswer('Choice 1')
        project.selectAnswer('Choice 3')
        project.awaitSave()

        project.open(projectName)
        project.checkAnswerChecked('Choice 1')
        project.checkAnswerChecked('Choice 3')
    })


    it('answer follow-up question', () => {
        project.selectAnswer('Answer 1.2')
        project.selectAnswer('Follow-up answer 1.2')
        project.awaitSave()

        project.open(projectName)
        project.checkAnswerChecked('Answer 1.2')
        project.checkAnswerChecked('Follow-up answer 1.2')
    })


    it('add & remove item answer', () => {
        // Add item and answer a question
        cy.clickBtn('Add')
        cy.get('.item').should('exist')
        cy.get('.badge').contains('2.a.1').should('exist')
        project.selectAnswer('Item answer 1.2')

        // Add another item and save
        cy.clickBtn('Add')
        cy.get('.badge').contains('2.b.1').should('exist')
        project.awaitSave()

        // Reopen questionnaire and check answers
        project.open(projectName)
        cy.get('.badge').contains('2.a.1').should('exist')
        cy.get('.badge').contains('2.b.1').should('exist')
        project.checkAnswerChecked('Item answer 1.2')

        // Remove items and save
        cy.get(`.item:first-child() ${dataCy('item-delete')}`).click()
        cy.clickModalAction()
        cy.get(`.item:first-child() ${dataCy('item-delete')}`).click()
        cy.clickModalAction()
        cy.get('.badge').contains('2.a.1').should('not.exist')
        cy.get('.badge').contains('2.b.1').should('not.exist')
        project.awaitSave()

        // Reopen and check items are not there
        project.open(projectName)
        cy.get('.badge').contains('2.a.1').should('not.exist')
        cy.get('.badge').contains('2.b.1').should('not.exist')
    })

    it('collapse & expand item answer', () => {
        // Add item and answer a question
        cy.clickBtn('Add')
        cy.get('.item').should('exist')
        cy.get('.badge').contains('2.a.1').should('exist')
        project.selectAnswer('Item answer 1.2')

        // Collapse item
        cy.get(`.item:first-child() ${dataCy('item-collapse')}`).click()

        // Reopen project and check that the item is collapsed
        project.open(projectName)
        cy.get('.item:first-child()').should('have.class', 'item-collapsed')

        // Expand item
        cy.get(`.item:first-child() ${dataCy('item-expand')}`).click()

        // Reopen project and check that the item is expanded
        project.open(projectName)
        cy.get('.item:first-child()').should('not.have.class', 'item-collapsed')
    })

    it('reorder item answer', () => {
        // Add item and answer a question
        cy.clickBtn('Add')
        cy.get('.item').should('exist')
        cy.get('.badge').contains('2.a.1').should('exist')
        project.selectAnswer('Item answer 1.2')

        // Add another item and don't answer the question
        cy.clickBtn('Add')
        cy.get('.item').should('exist')
        cy.get('.badge').contains('2.a.1').should('exist')

        // Move the first item down and check that now the first one
        cy.get(`.item:first-child() ${dataCy('item-move-down')}`).click()
        cy.get('.item:first-child() label').contains('Item answer 1.2').closest('.form-group').find('input').should('not.be.checked')

        // Reopen project and check it still works
        project.open(projectName)
        cy.get('.item:first-child() label').contains('Item answer 1.2').closest('.form-group').find('input').should('not.be.checked')

        // Move items back and check that the first one is checked
        cy.get(`.item:last-child() ${dataCy('item-move-up')}`).click()
        cy.get('.item:first-child() label').contains('Item answer 1.2').closest('.form-group').find('input').should('be.checked')

        // Reopen project and check it still works
        project.open(projectName)
        cy.get('.item:first-child() label').contains('Item answer 1.2').closest('.form-group').find('input').should('be.checked')
    })


    const valueQuestionTests = [{
        label: 'Value Question String',
        value: 'My String Answer'
    }, {
        label: 'Value Question Number',
        value: '125'
    }]
    valueQuestionTests.forEach((test => {
        it(`answer ${test.label}`, () => {
            // type answer and save
            project.typeAnswer(test.label, test.value)
            project.awaitSave()

            // reopen questionnaire and check that the answer is there
            project.open(projectName)
            project.checkAnswer(test.label, test.value)
        })
    }))


    it('answer Value Question Text', () => {
        const label = 'Value Question Text'
        const value = 'My Text Answer'

        // type answer and save
        project.typeAnswerText(label, value)
        project.awaitSave()

        // reopen questionnaire and check that the answer is there
        project.open(projectName)
        project.checkAnswerText(label, value)
    })


    it('answer Value Question DateTime', () => {
        const label = 'Value Question DateTime'
        const day = 18
        const hour = 22
        const minute = 43

        // Select datepicker value
        project.openDatePicker(label)
        project.selectDay(day)
        project.selectTime(hour, minute)
        project.closeDatePicker(label)
        project.awaitSave()

        // reopen questionnaire and check that the answer is there
        project.open(projectName)
        const expectedDateTime = `${getCurrentYearAndMonth()}-${day} ${hour}:${minute}`
        project.checkDatePickerValue(label, 'datetime', expectedDateTime)
    })


    it('answer Value Question Date', () => {
        const label = 'Value Question Date'
        const day = 21

        // Select datepicker value
        project.openDatePicker(label)
        project.selectDay(day)
        project.closeDatePicker(label)
        project.awaitSave()

        // reopen questionnaire and check that the answer is there
        project.open(projectName)
        const expectedDateTime = `${getCurrentYearAndMonth()}-${day}`
        project.checkDatePickerValue(label, 'date', expectedDateTime)
    })


    it('answer Value Question Time', () => {
        const label = 'Value Question Time'
        const hour = 3
        const minute = 8
        const expectedTime = '03:08'

        // Select datepicker value
        project.openDatePicker(label)
        project.selectTime(hour, minute)
        project.closeDatePicker(label)
        project.awaitSave()

        // reopen questionnaire and check that the answer is there
        project.open(projectName)
        project.checkDatePickerValue(label, 'time', expectedTime)
    })


    const valueQuestionWithWrongValueTests = [{
        label: 'Value Question Email',
        wrongValue: 'abcd',
        value: 'albert.einstein@example.com'
    }, {
        label: 'Value Question URL',
        wrongValue: 'invalid',
        value: 'http://example.com'
    }]
    valueQuestionWithWrongValueTests.forEach(({ label, wrongValue, value }) => {
        it(`answer ${label}`, () => {
            // type a wrong answer
            project.typeAnswer(label, wrongValue)
            project.expectWarningFor(label)
            project.expectWarningCount(1)

            // type correct answer
            project.typeAnswer(label, value)
            project.awaitSave()

            // reopen questionnaire and check that the answer is there
            project.open(projectName)
            project.checkAnswer(label, value)
        })

    })

    it('answer deep nested question', () => {
        const label = 'Follow-up Question 2'
        const value = 'My Nested Answer'

        // fill answers and save
        cy.clickBtn('Add')
        project.selectAnswer('Item answer 1.1')
        project.typeAnswer(label, value)
        project.awaitSave()

        // reopen questionnaire and check answers
        project.open(projectName)
        project.checkAnswer(label, value)
    })


    it('answer question in different chapter', () => {
        cy.get('.nav-link').contains('Chapter 2').click()
        project.selectAnswer('Answer 2.2')
        project.awaitSave()

        project.open(projectName)
        cy.get('.nav-link').contains('Chapter 2').click()
        project.checkAnswerChecked('Answer 2.2')
    })
})
