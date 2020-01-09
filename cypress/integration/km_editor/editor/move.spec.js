import * as editor from '../../../support/editor-helpers'


describe('KM Editor Move Entity', () => {
    const kmName = 'Test Knowledge Model'
    const kmId = 'test-km'
    const previousKmId = 'test-km-1'
    const previousPackageId = 'dsw:test-km-1:1.0.0'

    before(() => {
        cy.task('mongo:delete', {
            collection: 'packages',
            args: { kmId: previousKmId }
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
        cy.createKMEditor({ kmId, name: kmName, previousPackageId })
        cy.loginAs('datasteward')
        cy.visitApp('/km-editor')
    })

    const testCases = [{
        name: 'Reference',
        entity: 'Reference 1',
        originalPath: [
            'Chapter 1', 
            'Question 1'
        ],
        newPath: [
            'Chapter 1', 
            'Integration Question 1'
        ]
    }, {
        name: 'Expert',
        entity: 'Expert 1',
        originalPath: [
            'Chapter 1',
            'Question 1'
        ],
        newPath: [
            'Chapter 1', 
            'Options Question 1',
            'Answer 1', 
            'Follow-up Question 1'
        ]
    }, {
        name: 'Answer',
        entity: 'Answer 1',
        originalPath: [
            'Chapter 1',
            'Options Question 1'
        ],
        newPath: [
            'Chapter 1',
            'Question 1',
            'Answer 2',
            'Question 2',
            'Question 3'
        ]
    }, {
        name: 'Question from Chapter to Chapter',
        entity: 'Options Question 1',
        originalPath: [
            'Chapter 1'
        ],
        newPath: [
            'Chapter 2'
        ]
    }, {
        name: 'Question from Chapter to Question',
        entity: 'Options Question 1',
        originalPath: [
            'Chapter 1'
        ],
        newPath: [
            'Chapter 1',
            'List Question 1'
        ]
    }, {
        name: 'Question from Chapter to Answer',
        entity: 'Value Question 1',
        originalPath: [
            'Chapter 1'
        ],
        newPath: [
            'Chapter 1',
            'Question 1',
            'Answer 2'
        ]
    }, {
        name: 'Question from Question to Chapter',
        entity: 'Answer Item Question 1',
        originalPath: [
            'Chapter 1',
            'List Question 1'
        ],
        newPath: [
            'Chapter 2'
        ]
    }, {
        name: 'Question from Question to Question',
        entity: 'Answer Item Question 1',
        originalPath: [
            'Chapter 1',
            'List Question 1'
        ],
        newPath: [
            'Chapter 1',
            'Question 1',
            'Answer 2',
            'Question 2'
        ],
    }, {
        name: 'Question from Question to Answer',
        entity: 'Answer Item Question 1',
        originalPath: [
            'Chapter 1',
            'List Question 1'
        ],
        newPath: [
            'Chapter 1',
            'Question 1',
            'Answer 2'
        ]
    }, {
        name: 'Question from Answer to Chapter',
        entity: 'Follow-up Question 1',
        originalPath: [
            'Chapter 1',
            'Options Question 1',
            'Answer 1'
        ],
        newPath: [
            'Chapter 2'
        ]
    }, {
        name: 'Question from Answer to Question',
        entity: 'Follow-up Question 1',
        originalPath: [
            'Chapter 1',
            'Options Question 1',
            'Answer 1'
        ],
        newPath: [
            'Chapter 1',
            'List Question 1'
        ]
    }, {
        name: 'Question from Answer to Answer',
        entity: 'Follow-up Question 1',
        originalPath: [
            'Chapter 1',
            'Options Question 1',
            'Answer 1'
        ],
        newPath: [
            'Chapter 1',
            'Question 1',
            'Answer 2'
        ]
    }]
    testCases.forEach(({ name, entity, originalPath, newPath }) => {
        it(`move ${name}`, () => {
            editor.open(kmId)
            editor.traverseChildren([...originalPath, entity])

            cy.get('.btn-outline-secondary').contains('Move').click()

            newPath.slice(0, -1).forEach(editor.moveModalOpenItem)
            editor.moveModalSelect(newPath[newPath.length - 1])
            editor.saveAndClose()

            editor.open(kmId)
            editor.traverseChildren([...newPath, entity])
        })
    })
})
