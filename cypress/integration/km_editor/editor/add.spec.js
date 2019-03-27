describe('KM Editor add entity', () => {
    const kmName = 'Test Knowledge Model'
    const kmId = 'test-km'

    beforeEach(() => {
        cy.task('mongo:delete', {
            collection: 'branches',
            args: { kmId }
        })
        cy.createKMEditor({kmId, name: kmName, parentPackageId: null})
        cy.loginAs('datasteward')
        cy.visitApp('/km-editor')
    })


    it('add chapter', () => {
        const chapterName = 'My Awesome Chapter'
        const chapterText = 'This chapter is awesome.'

        // Open editor
        cy.clickIndexTableAction(kmId, 'Open Editor')
        cy.url().should('contain', '/km-editor/edit')

        // Add chapter and save
        cy.get('.link-add-child').contains('Add chapter').click()
        cy.get('#title').clear().type(chapterName)
        cy.get('#text').clear().type(chapterText)
        cy.get('.btn').contains('Save').click()

        // Open editor again
        cy.url().should('contain', '/km-editor')
        cy.clickIndexTableAction(kmId, 'Open Editor')
        cy.url().should('contain', '/km-editor/edit')

        // Check that the chapter is there
        cy.get('.input-child a').contains(chapterName).click()
        cy.get('#title').should('have.value', chapterName)
        cy.get('#text').should('have.value', chapterText)
    })
})