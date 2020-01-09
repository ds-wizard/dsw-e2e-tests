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
            accessibility: questionnaire.PublicReadOnly,
            name: questionnaireName,
            packageId
        })

        // fill in some answers
        cy.visitApp('/questionnaires')
        cy.clickListingItemAction(questionnaireName, 'Fill questionnaire')
        questionnaire.selectAnswer('Answer 1.2')
        questionnaire.selectAnswer('Follow-up answer 1.1')
        questionnaire.typeAnswer('Value Question String', 'Some value')
        questionnaire.saveAndClose()

        // clone questionnaire
        const copyName = `Copy of ${questionnaireName}`
        cy.clickListingItemAction(questionnaireName, 'Clone')
        cy.expectAlert('success', `Copy of ${questionnaireName} has been created`)
        cy.getListingItem(copyName).should('exist')

        // check filled answers
        cy.clickListingItemAction(copyName, 'Fill questionnaire')
        questionnaire.checkAnswerChecked('Answer 1.2')
        questionnaire.checkAnswerChecked('Follow-up answer 1.1')
        questionnaire.checkAnswer('Value Question String', 'Some value')
    })
})
