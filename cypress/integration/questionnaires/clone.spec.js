import * as questionnaire from '../../support/questionnaire-helpers'

describe('Clone Questionnaire', () => {
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
        cy.loginAs('researcher')
    })

    
    it('can clone questinnaire', () => {
        // create a new questionnaire
        cy.createQuestionnaire({
            visibility: questionnaire.VisibleView,
            sharing: questionnaire.Restricted,
            name: questionnaireName,
            packageId
        })

        // fill in some answers
        cy.visitApp('/questionnaires')
        cy.clickListingItemAction(questionnaireName, 'Fill questionnaire')
        questionnaire.selectAnswer('Answer 1.2')
        questionnaire.selectAnswer('Follow-up answer 1.1')
        questionnaire.typeAnswer('Value Question String', 'Some value')
        questionnaire.awaitSave()
        cy.visitApp('/questionnaires')

        // clone questionnaire
        const copyName = `Copy of ${questionnaireName}`
        cy.clickListingItemAction(questionnaireName, 'Clone')
        cy.get('.btn-primary').contains('Clone').click()

        // check filled answers
        cy.get('.questionnaire-header__title').contains(copyName)
        questionnaire.checkAnswerChecked('Answer 1.2')
        questionnaire.checkAnswerChecked('Follow-up answer 1.1')
        questionnaire.checkAnswer('Value Question String', 'Some value')
    })
})
