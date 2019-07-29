import * as editor from '../../../support/editor-helpers'


describe('KM Editor Tags', () => {
    const kmName = 'Test Knowledge Model'
    const kmId = 'km-with-tags'
    const previousPackageId = 'mto:km-with-tags:1.0.0'

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
        cy.createKMEditor({ kmId, name: kmName, previousPackageId })
        cy.loginAs('datasteward')
        cy.visitApp('/km-editor')
    })


    it('create tag visible by question and in tags editor', () => {
        const tagName = 'My new tag'

        editor.open(kmId)

        // Create a new tag
        const tag = { name: tagName }
        editor.createChildren([['tag', tag]])

        // Navigate to a question and check that the new tag is there
        cy.get('.breadcrumb-item:first-child').click()
        editor.traverseChildren(['Chapter 1', 'Question 1'])
        cy.get('.tag-label').contains(tagName).should('exist')

        // Open tags editor and check that the new tag is there
        editor.openTags()
        cy.get('.tag').contains(tagName).should('exist')

        // Discard changes so it does not block other tests
        editor.discardChanges()
    })


    it('select tag by the question', () => {
        // Open editor, select tag and save
        editor.open(kmId)
        editor.traverseChildren(['Chapter 1', 'Question 4'])
        cy.get('.tag-label').contains('Red Tag').click()
        editor.saveAndClose()

        // Open editor again and check that it is selected
        editor.open(kmId)
        editor.traverseChildren(['Chapter 1', 'Question 4'])
        cy.get('.tag-label').contains('Red Tag').find('input').should('be.checked')

        // Check that it is also selected in tags editor
        editor.openTags()
        cy.get('.editor-table-container tbody tr:last-child td.td-checkbox:last-child input').should('be.checked')
    })


    it('select tag in tags editor', () => {
        // Open editor, select tag and save
        editor.open(kmId)
        editor.openTags()
        cy.get('.editor-table-container tbody tr:last-child td.td-checkbox:last-child input').click()
        editor.saveAndClose();

        // Open editor again and check that it is selected
        editor.open(kmId)
        editor.openTags()
        cy.get('.editor-table-container tbody tr:last-child td.td-checkbox:last-child input').should('be.checked')

        // Check that it is also selected by the question
        editor.openKM()
        editor.traverseChildren(['Chapter 1', 'Question 4'])
        cy.get('.tag-label').contains('Red Tag').find('input').should('be.checked')
    })
})
