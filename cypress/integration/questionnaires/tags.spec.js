import * as q from '../../support/questionnaire-helpers'
import * as tagSelect from '../../support/tag-select-helpers'


describe('Questionnaire Tags', () => {
    const questionnaireName = 'My Tagged Questionnaire'
    const kmId = 'km-with-tags'
    const packageId = 'mto:km-with-tags:1.0.0'

    before(() => {
        cy.task('mongo:delete', {
            collection: 'packages',
            args: { kmId }
        })
        cy.fixture('km-with-tags').then((km) => {
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


    const testCases = [{
        tags: [],
        visible: ['Question 1', 'Question 2', 'Question 3', 'Question 4'],
        hidden: []
    }, {
        tags: ['Blue Tag'],
        visible: ['Question 1'],
        hidden: ['Question 2', 'Question 3', 'Question 4']
    }, {
        tags: ['Green Tag'],
        visible: ['Question 2', 'Question 3'],
        hidden: ['Question 1', 'Question 4']
    }, {
        tags: ['Red Tag'],
        visible: ['Question 3'],
        hidden: ['Question 1', 'Question 2', 'Question 4']
    }, {
        tags: ['Blue Tag', 'Red Tag'],
        visible: ['Question 1', 'Question 3'],
        hidden: ['Question 2', 'Question 4']
    }, {
        tags: ['Green Tag', 'Red Tag'],
        visible: ['Question 2', 'Question 3'],
        hidden: ['Question 1', 'Question 4']
    }, {
        tags: ['Blue Tag', 'Green Tag'],
        visible: ['Question 1', 'Question 2', 'Question 3'],
        hidden: ['Question 4']
    }, {
        tags: ['Blue Tag', 'Green Tag', 'Red Tag'],
        visible: ['Question 1', 'Question 2', 'Question 3'],
        hidden: ['Question 4']
    }]
    testCases.forEach(({ tags, visible, hidden }) => {
        it('create questionnaire with correct questions', () => {
            const questionnaire = {
                name: questionnaireName,
                s_packageId: packageId
            }
            cy.visitApp('/questionnaires')
            cy.clickBtn('Create')

            cy.fillFields(questionnaire)
            tagSelect.selectMultiple(tags)
            cy.clickBtn('Save')

            cy.url().should('contain', '/questionnaires/detail/')

            q.expectQuestions(visible, true)
            q.expectQuestions(hidden, false)
        })
    })
})
