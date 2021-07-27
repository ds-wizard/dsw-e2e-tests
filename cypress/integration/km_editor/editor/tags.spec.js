import * as editor from '../../../support/editor-helpers'


describe('KM Editor Tags', () => {
    const kmName = 'Test Knowledge Model'
    const kmId = 'km-with-tags'
    const previousPackageId = 'mto:km-with-tags:1.0.0'

    before(() => {
        cy.task('package:delete', { km_id: kmId })
        cy.clearServerCache()

        cy.importKM('km-with-tags')
    })


    beforeEach(() => {
        cy.task('branch:delete', { km_id: kmId })
        cy.clearServerCache()

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
        cy.getCy('breadcrumb-item', ':first-child').click()
        editor.traverseChildren(['Chapter 1', 'Question 1'])
        cy.getCy('tag').contains(tagName).should('exist')

        // Open tags editor and check that the new tag is there
        editor.openTags()
        cy.getCy('km-editor_tag-editor_tag').contains(tagName).should('exist')

        // Discard changes so it does not block other tests
        editor.discardChanges()
    })


    it('select tag by the question', () => {
        const tagName = 'Red Tag'
        const tagUuid = '7dc36a6f-715b-4530-8a1f-ecc66ecc8317'
        const questionUuid = 'dfd4022f-d7ac-4852-92b9-724aec161a04'

        // Open editor, select tag and save
        editor.open(kmId)
        editor.traverseChildren(['Chapter 1', 'Question 4'])
        cy.getCy('tag').contains(tagName).click()
        editor.saveAndClose()

        // Open editor again and check that it is selected
        editor.open(kmId)
        editor.traverseChildren(['Chapter 1', 'Question 4'])
        cy.getCy('tag').contains(tagName).find('input').should('be.checked')

        // Check that it is also selected in tags editor
        editor.openTags()

        cy
            .getCy(`km-editor_tag-editor_row_question-${questionUuid}_tag-${tagUuid}`)
            .should('be.checked')
    })


    it('select tag in tags editor', () => {
        const tagName = 'Red Tag'
        const tagUuid = '7dc36a6f-715b-4530-8a1f-ecc66ecc8317'
        const questionUuid = 'dfd4022f-d7ac-4852-92b9-724aec161a04'

        // Open editor, select tag and save
        editor.open(kmId)
        editor.openTags()
        cy
            .getCy(`km-editor_tag-editor_row_question-${questionUuid}_tag-${tagUuid}`)
            .click()
        editor.saveAndClose();

        // Open editor again and check that it is selected
        editor.open(kmId)
        editor.openTags()
        cy
            .getCy(`km-editor_tag-editor_row_question-${questionUuid}_tag-${tagUuid}`)
            .should('be.checked')

        // Check that it is also selected by the question
        editor.openKM()
        editor.traverseChildren(['Chapter 1', 'Question 4'])
        cy.getCy('tag').contains(tagName).find('input').should('be.checked')
    })
})
