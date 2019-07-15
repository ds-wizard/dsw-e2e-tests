import * as editor from '../../../support/editor-helpers'
import * as questionnaire from '../../../support/questionnaire-helpers'
import * as tagSelect from '../../../support/tag-select-helpers'


describe('KM Editor Preview', () => {
    const kmName = 'Test Knowledge Model'
    const kmId = 'km-with-tags'
    const parentPackageId = 'mto:km-with-tags:1.0.0'

    // test cases

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
            collection: 'branches',
            args: { kmId }
        })
        cy.createKMEditor({ kmId, name: kmName, parentPackageId })
        cy.loginAs('datasteward')
        cy.visitApp('/km-editor')
    })


    it('no tags selected', () => {
        editor.open(kmId)
        editor.openPreview()

        questionnaire.expectQuestions([
            'Question 1',
            'Question 2',
            'Question 3',
            'Question 4'
        ], true)
    })


    it('select all and none', () => {
        editor.open(kmId)
        editor.openPreview()

        tagSelect.selectAll()
        questionnaire.expectQuestions([
            'Question 1',
            'Question 2',
            'Question 3'
        ], true)
        questionnaire.expectQuestions([
            'Question 4'
        ], false)

        tagSelect.selectNone()
        questionnaire.expectQuestions([
            'Question 1',
            'Question 2',
            'Question 3',
            'Question 4'
        ], true)
    })


    it('select tag', () => {
        editor.open(kmId)
        editor.openPreview()

        const testCases = [{
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
            tagSelect.selectNone()
            tagSelect.selectMultiple(tags)

            questionnaire.expectQuestions(visible, true)
            questionnaire.expectQuestions(hidden, false)
        })
    })
})
