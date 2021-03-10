import * as editor from '../../../../support/editor-helpers'
import * as project from '../../../../support/project-helpers'
import * as tagSelect from '../../../../support/tag-select-helpers'


describe('KM Editor Preview - Tags', () => {
    const kmName = 'Test Knowledge Model'
    const kmId = 'km-with-tags'
    const previousPackageId = 'mto:km-with-tags:1.0.0'

    // test cases

    before(() => {
        cy.task('mongo:delete', {
            collection: 'packages',
            args: { kmId }
        })
        cy.clearServerCache()

        cy.fixture('km-with-tags').then((km) => {
            cy.importKM(km)
        })
    })


    beforeEach(() => {
        cy.task('mongo:delete', {
            collection: 'branches',
            args: { kmId }
        })
        cy.clearServerCache()
        
        cy.createKMEditor({ kmId, name: kmName, previousPackageId })
        cy.loginAs('datasteward')
        cy.visitApp('/km-editor')
    })


    it('no tags selected', () => {
        editor.open(kmId)
        editor.openPreview()

        project.expectQuestions([
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
        project.expectQuestions([
            'Question 1',
            'Question 2',
            'Question 3'
        ], true)
        project.expectQuestions([
            'Question 4'
        ], false)

        tagSelect.selectNone()
        project.expectQuestions([
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

            project.expectQuestions(visible, true)
            project.expectQuestions(hidden, false)
        })
    })
})
