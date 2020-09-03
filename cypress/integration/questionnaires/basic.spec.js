import * as questionnaire from '../../support/questionnaire-helpers'

describe('Basic Questionnaire Tests', () => {
    const questionnaireName = 'Test Questionnaire'
    const kmId = 'basic-questionnaire-test-km'
    const packageId = 'dsw:basic-questionnaire-test-km:1.0.0'


    before(() => {
        cy.task('mongo:delete', {
            collection: 'packages',
            args: { kmId }
        })
        cy.fixture(kmId).then((km) => {
            cy.importKM(km)
        })
    })


    beforeEach(() => {
        cy.task('mongo:delete', {
            collection: 'questionnaires',
            args: {}
        })
        cy.createQuestionnaire({
            visibility: questionnaire.VisibleView,
            sharing: questionnaire.Restricted,
            name: questionnaireName,
            packageId
        })
        cy.loginAs('researcher')
        questionnaire.open(questionnaireName)
    })


    it('answer, advice & clear answer', () => {
        // select answer
        questionnaire.selectAnswer('Answer 1.1')
        cy.get('.alert-info').contains('This is an advice for answer 1.').should('be.visible')
        questionnaire.awaitSave()

        // reopen and check the answer
        questionnaire.open(questionnaireName)
        questionnaire.checkAnswerChecked('Answer 1.1')
        cy.get('.alert-info').contains('This is an advice for answer 1.').should('be.visible')

        // clear answer and save
        cy.clickLink('Clear answer')
        questionnaire.checkAnswerNotChecked('Answer 1.1')
        cy.get('.alert-info').contains('This is an advice for answer 1.').should('not.be.visible')

        // reopen and check it was cleared
        questionnaire.open(questionnaireName)
        questionnaire.checkAnswerNotChecked('Answer 1.1')
        cy.get('.alert-info').contains('This is an advice for answer 1.').should('not.be.visible')
    })


    it('answer follow-up question', () => {
        questionnaire.selectAnswer('Answer 1.2')
        questionnaire.selectAnswer('Follow-up answer 1.2')
        questionnaire.awaitSave()

        questionnaire.open(questionnaireName)
        questionnaire.checkAnswerChecked('Answer 1.2')
        questionnaire.checkAnswerChecked('Follow-up answer 1.2')
    })


    it('add & remove item answer', () => {
        // Add item and answer a question
        cy.clickBtn('Add')
        cy.get('.item').should('exist')
        cy.get('.badge-human-identifier').contains('2.a.1').should('exist')
        questionnaire.selectAnswer('Item answer 1.2')

        // Add another item and save
        cy.clickBtn('Add')
        cy.get('.badge-human-identifier').contains('2.b.1').should('exist')
        questionnaire.awaitSave()

        // Reopen questionnaire and check answers
        questionnaire.open(questionnaireName)
        cy.get('.badge-human-identifier').contains('2.a.1').should('exist')
        cy.get('.badge-human-identifier').contains('2.b.1').should('exist')
        questionnaire.checkAnswerChecked('Item answer 1.2')

        // Remove items and save
        cy.get('.item:first-child() .btn-item-delete').click()
        cy.get('.item:first-child() .btn-item-delete').click()
        cy.get('.badge-human-identifier').contains('2.a.1').should('not.exist')
        cy.get('.badge-human-identifier').contains('2.b.1').should('not.exist')
        questionnaire.awaitSave()

        // Reopen and check items are not there
        questionnaire.open(questionnaireName)
        cy.get('.badge-human-identifier').contains('2.a.1').should('not.exist')
        cy.get('.badge-human-identifier').contains('2.b.1').should('not.exist')
    })


    const valueQuestionTests = [{
        label: 'Value Question String',
        value: 'My String Answer'
    }, {
        label: 'Value Question Date',
        value: '2019-05-29'
    }, {
        label: 'Value Question Number',
        value: '125'
    }]
    valueQuestionTests.forEach((test => {
        it(`answer ${test.label}`, () => {
            // type answer and save
            questionnaire.typeAnswer(test.label, test.value)
            questionnaire.awaitSave()

            // reopen questionnaire and check that the answer is there
            questionnaire.open(questionnaireName)
            questionnaire.checkAnswer(test.label, test.value)
        })
    }))


    it('answer Value Question Text', () => {
        const label = 'Value Question Text'
        const value = 'My Text Answer'

        // type answer and save
        questionnaire.typeAnswerText(label, value)
        questionnaire.awaitSave()

        // reopen questionnaire and check that the answer is there
        questionnaire.open(questionnaireName)
        questionnaire.checkAnswerText(label, value)
    })


    it('answer deep nested question', () => {
        const label = 'Follow-up Question 2'
        const value = 'My Nested Answer'

        // fill answers and save
        cy.clickBtn('Add')
        questionnaire.selectAnswer('Item answer 1.1')
        questionnaire.typeAnswer(label, value)
        questionnaire.awaitSave()

        // reopen questionnaire and check answers
        questionnaire.open(questionnaireName)
        questionnaire.checkAnswer(label, value)
    })


    it('answer question in different chapter', () => {
        cy.get('.nav-link').contains('Chapter 2').click()
        questionnaire.selectAnswer('Answer 2.2')
        questionnaire.awaitSave()

        questionnaire.open(questionnaireName)
        cy.get('.nav-link').contains('Chapter 2').click()
        questionnaire.checkAnswerChecked('Answer 2.2')
    })
})
