import * as editor from '../../../support/editor-helpers'


describe('KM Editor Delete Entity', () => {
    const kmName = 'Test Knowledge Model'
    const kmId = 'test-km'
    const previousKmId = 'test-km-1'
    const previousPackageId = 'dsw:test-km-1:1.0.0'

    before(() => {
        cy.task('package:delete', { km_id: previousKmId })
        cy.clearServerCache()

        cy.importKM('test-km-1')
    })

    beforeEach(() => {
        cy.task('branch:delete', { km_id: kmId })
        cy.clearServerCache()

        cy.createKMEditor({ kmId, name: kmName, version: '1.0.0', previousPackageId })
        cy.loginAs('datasteward')
        cy.visitApp('/km-editor')
    })

    const fixtures = [{
        group: 'Knowledge Model',
        tests: [{
            name: 'delete Chapter',
            path: [],
            child: 'Chapter 1'
        }, {
            name: 'delete Metric',
            path: [],
            child: 'Findability'
        }, {
            name: 'delete Phase',
            path: [],
            child: 'Before Submitting the Proposal'
        }, {
            name: 'delete Tag',
            path: [],
            child: 'Tag 1'
        }, {
            name: 'delete Integration',
            path: [],
            child: 'Integration 1',
        }]
    }, {
        group: 'Chapter',
        tests: [{
            name: 'delete Question',
            path: ['Chapter 1'],
            child: 'Question 1'
        }]
    }, {
        group: 'Chapter Question',
        tests: [{
            name: 'delete Answer',
            path: ['Chapter 1', 'Options Question 1'],
            child: 'Answer 1'
        }, {
            name: 'delete Follow-up Question',
            path: ['Chapter 1', 'Options Question 1', 'Answer 1'],
            child: 'Follow-up Question 1'
        }, {
            name: 'delete Answer Item Question',
            path: ['Chapter 1', 'List Question 1'],
            child: 'Answer Item Question 1'
        }, {
            name: 'delete Choice',
            path: ['Chapter 1', 'Multi-Choice Question 1'],
            child: 'Choice 1'
        }, {
            name: 'delete Reference',
            path: ['Chapter 1', 'Question 1'],
            child: 'Reference 1'
        }, {
            name: 'delete Expert',
            path: ['Chapter 1', 'Question 1'],
            child: 'Expert 1'
        }]
    }, {
        group: 'Follow-up Question',
        tests: [{
            name: 'delete Answer',
            path: ['Chapter 1', 'Options Question 1', 'Answer 1', 'Follow-up Question 1'],
            child: 'Follow-up Answer'
        }, {
            name: 'delete Answer Item Question',
            path: ['Chapter 1', 'Options Question 1', 'Answer 1', 'Follow-up Question 2'],
            child: 'Follow-up Answer Item Question'
        }, {
            name: 'delete Choice',
            path: ['Chapter 1', 'Options Question 1', 'Answer 1', 'Follow-up Question 3'],
            child: 'Follow-up Choice'
        }, {
            name: 'delete Reference',
            path: ['Chapter 1', 'Options Question 1', 'Answer 1', 'Follow-up Question 1'],
            child: 'Follow-up Reference'
        }, {
            name: 'delete Expert',
            path: ['Chapter 1', 'Options Question 1', 'Answer 1', 'Follow-up Question 1'],
            child: 'Follow-up Expert'
        }]
    }, {
        group: 'Answer Item Question',
        tests: [{
            name: 'delete Answer',
            path: ['Chapter 1', 'List Question 1', 'Answer Item Question 1'],
            child: 'Answer Item Question Answer'
        }, {
            name: 'delete Answer Item Question',
            path: ['Chapter 1', 'List Question 1', 'Answer Item Question 2'],
            child: 'Answer Item Question Answer Item Question'
        }, {
            name: 'delete Choice',
            path: ['Chapter 1', 'List Question 1', 'Answer Item Question 3'],
            child: 'Answer Item Question Choice'
        }, {
            name: 'delete Reference',
            path: ['Chapter 1', 'List Question 1', 'Answer Item Question 1'],
            child: 'Answer Item Question Reference'
        }, {
            name: 'delete Expert',
            path: ['Chapter 1', 'List Question 1', 'Answer Item Question 1'],
            child: 'Answer Item Question Expert'
        }]
    }, {
        group: 'Deep Nested Question',
        tests: [{
            name: 'delete Answer',
            path: ['Chapter 1', 'Question 1', 'Answer 2', 'Question 2', 'Question 3', 'Answer 3', 'Deep Nested Question 1'],
            child: 'Deep Nested Answer 1'
        }, {
            name: 'delete Answer Item Question',
            path: ['Chapter 1', 'Question 1', 'Answer 2', 'Question 2', 'Question 3', 'Answer 3', 'Deep Nested Question 2'],
            child: 'Deep Nested Answer Item Question'
        }, {
            name: 'delete Choice',
            path: ['Chapter 1', 'Question 1', 'Answer 2', 'Question 2', 'Question 3', 'Answer 3', 'Deep Nested Question 3'],
            child: 'Deep Nested Choice 1'
        }, {
            name: 'delete Reference',
            path: ['Chapter 1', 'Question 1', 'Answer 2', 'Question 2', 'Question 3', 'Answer 3', 'Deep Nested Question 1'],
            child: 'Deep Nested Reference 1'
        }, {
            name: 'delete Expert',
            path: ['Chapter 1', 'Question 1', 'Answer 2', 'Question 2', 'Question 3', 'Answer 3', 'Deep Nested Question 1'],
            child: 'Deep Nested Expert 1'
        }]
    }]

    fixtures.forEach(({ group, tests }) => {
        describe(group, () => {
            tests.forEach(({ name, path, child, confirm }) => {
                it(name, () => {
                    // Delete entity and save
                    editor.open(kmId)
                    editor.traverseChildren(path)
                    editor.openChild(child)
                    editor.deleteCurrent()
                    cy.clickModalAction()

                    // Check that the entity is not there
                    cy.visitApp('/km-editor')
                    editor.open(kmId)
                    editor.traverseChildren(path)
                    editor.shouldNotHaveChild(child)
                })
            })
        })
    })
})
