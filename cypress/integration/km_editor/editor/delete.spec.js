import * as editor from '../../../support/editor-helpers'


describe('KM Editor Delete Entity', () => {
    const kmName = 'Test Knowledge Model'
    const kmId = 'test-km'
    const parentKmId = 'test-km-1'
    const parentPackageId = 'dsw:test-km-1:1.0.0'

    before(() => {
        cy.task('mongo:delete', {
            collection: 'packages',
            args: { kmId: parentKmId }
        })
        cy.fixture('test-km-1').then((km) => {
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

    const fixtures = [{
        group: 'Knowledge Model',
        tests: [{
            name: 'delete Chapter',
            path: [],
            child: 'Chapter 1'
        }, {
            name: 'delete Tag',
            path: [],
            child: 'Tag 1'
        }, {
            name: 'delete Integration',
            path: [],
            child: 'Integration 1',
            confirm: true
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
                    if (confirm) {
                        editor.confirmDelete()
                    }
                    editor.save()

                    // Check that the entity is not there
                    editor.open(kmId)
                    editor.traverseChildren(path)
                    editor.shouldNotHaveChild(child)
                })
            })
        })
    })
})
