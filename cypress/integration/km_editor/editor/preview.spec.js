import * as editor from '../../../support/editor-helpers'


describe('KM Editor Preview', () => {
    const kmName = 'Test Knowledge Model'
    const kmId = 'km-with-tags'
    const parentPackageId = 'mto:km-with-tags:1.0.0'

    // helpers

    const expectQuestion = (question, visible) => {
        const predicate = visible ? 'exist' : 'not.exist'
        cy.get('.form-group label').contains(question).should(predicate)
    }

    const expectQuestions = (questions, visible) => {
        questions.forEach(q => expectQuestion(q, visible))
    }

    const selectTagsNone = () => {
        cy.get('.tag-selection-header').contains('Select None').click()
    }

    const selectTagsAll = () => {
        cy.get('.tag-selection-header').contains('Select All').click()
    }

    const selectTag = (tag) => {
        cy.get('.tag-label').contains(tag).click()
    }

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

        expectQuestions([
            'Question 1',
            'Question 2',
            'Question 3',
            'Question 4'
        ], true)
    })

    it('select all and none', () => {
        editor.open(kmId)
        editor.openPreview()

        selectTagsAll()
        expectQuestions([
            'Question 1',
            'Question 2',
            'Question 3'
        ], true)
        expectQuestions([
            'Question 4'
        ], false)

        selectTagsNone()
        expectQuestions([
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
            selectTagsNone()
            tags.forEach(selectTag)

            expectQuestions(visible, true)
            expectQuestions(hidden, false)
        })
    })
})
