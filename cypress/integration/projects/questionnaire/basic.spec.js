import * as project from '../../../support/project-helpers'

describe('Basic Questionnaire Tests', () => {
    const projectName = 'Test Project'
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
        cy.get('.alert-info').contains('This is an advice for answer 1.').should('not.be.visible')

        // reopen and check it was cleared
        project.open(projectName)
        project.checkAnswerNotChecked('Answer 1.1')
        cy.get('.alert-info').contains('This is an advice for answer 1.').should('not.be.visible')
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
        cy.get('.badge-human-identifier').contains('2.a.1').should('exist')
        project.selectAnswer('Item answer 1.2')

        // Add another item and save
        cy.clickBtn('Add')
        cy.get('.badge-human-identifier').contains('2.b.1').should('exist')
        project.awaitSave()

        // Reopen questionnaire and check answers
        project.open(projectName)
        cy.get('.badge-human-identifier').contains('2.a.1').should('exist')
        cy.get('.badge-human-identifier').contains('2.b.1').should('exist')
        project.checkAnswerChecked('Item answer 1.2')

        // Remove items and save
        cy.get('.item:first-child() .btn-item-delete').click()
        cy.get('.item:first-child() .btn-item-delete').click()
        cy.get('.badge-human-identifier').contains('2.a.1').should('not.exist')
        cy.get('.badge-human-identifier').contains('2.b.1').should('not.exist')
        project.awaitSave()

        // Reopen and check items are not there
        project.open(projectName)
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
