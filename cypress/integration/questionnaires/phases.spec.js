import * as questionnaire from '../../support/questionnaire-helpers'
import * as phases from '../../support/phases-helpers'


describe('Questionnaire Phases', () => {
    const questionnaireName = 'Test of Phases'

    before(() => {
        cy.task('mongo:delete', {
            collection: 'packages',
            args: { kmId: phases.kmId }
        })
        cy.fixture(phases.kmId).then((km) => {
            cy.importKM(km)
        })
    })

    beforeEach(() => {
        cy.task('mongo:delete', {
            collection: 'questionnaires',
            args: {}
        })
        cy.loginAs('researcher')
        cy.createQuestionnaire({
            visibility: questionnaire.PublicReadOnly,
            name: questionnaireName,
            packageId: phases.packageId
        })
        cy.loginAs('researcher')
        cy.visitApp('/questionnaires')
        cy.clickListingItemAction(questionnaireName, 'Fill questionnaire')
        cy.get('.top-header').should('exist')
    })

    phases.runCommonTests()
})
