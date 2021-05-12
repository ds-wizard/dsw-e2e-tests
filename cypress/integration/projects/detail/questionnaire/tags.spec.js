import * as project from '../../../../support/project-helpers'
import * as tagSelect from '../../../../support/tag-select-helpers'


describe('Questionnaire Tags', () => {
    const projectName = 'My Tagged Questionnaire'
    const kmId = 'km-with-tags'
    const packageName = 'KM With Tags'

    before(() => {
        cy.task('package:delete', { km_id: kmId })
        cy.clearServerCache()

        cy.importKM('km-with-tags')
    })


    beforeEach(() => {
        cy.task('questionnaire:delete')
        cy.clearServerCache()
        
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
            cy.visitApp('/projects')
            cy.clickBtn('Create')

            cy.fillFields({
                name: projectName,
                th_packageId: packageName
            })
            tagSelect.selectMultiple(tags)
            cy.clickBtn('Save')

            cy.url().should('match', /\/projects\/.+/)
            project.expectTitle(projectName)

            project.expectQuestions(visible, true)
            project.expectQuestions(hidden, false)
        })
    })
})
