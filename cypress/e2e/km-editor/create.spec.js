describe('KM Editor Create', () => {

    beforeEach(() => {
        cy.task('knowledgeModelPackage:delete')
        cy.task('knowledgeModelEditor:delete')
        cy.clearServerCache()

        cy.importKM('test-km-1')
        cy.loginAs('datasteward')
    })

    it('can create empty', () => {
        const kmName = 'Test Knowledge Model'
        const kmId = 'test-km'

        cy.visitApp('/knowledge-model-editors')

        cy.getCy('km-editor_create-button').click()
        cy.url().should('contain', '/knowledge-model-editors/create')

        cy.fillFields({
            name: kmName,
            kmId,
            'version-major': '1',
            'version-minor': '0',
            'version-patch': '0'
        })
        cy.submitForm()
        cy.url().should('contain', '/knowledge-model-editors/editor/')

        cy.visitApp('/knowledge-model-editors')
        cy.getListingItem(kmId).should('contain', kmName)
    })

    it('can create based on existing', () => {
        const kmName = 'Test Knowledge Model 1'
        const kmId = 'test-km-1'

        cy.visitApp('/knowledge-models/dsw:test-km-1:1.0.0')

        cy.clickDropdownAction('create-km-editor')
        cy.url().should('contain', '/knowledge-model-editors/create')
        cy.clickElsewhere()

        cy.checkFields({
            name: kmName,
            kmId,
        })
        cy.fillFields({
            'version-major': '1',
            'version-minor': '0',
            'version-patch': '0'
        })

        cy.submitForm()
        cy.url().should('contain', '/knowledge-model-editors/editor/')

        cy.visitApp('/knowledge-model-editors')
        cy.getListingItem(kmId).should('contain', kmName)
    })

    it('can create fork', () => {
        const kmName = 'Fork Knowledge Model 1'
        const kmId = 'fork-km-1'

        cy.visitApp('/knowledge-models/dsw:test-km-1:1.0.0')

        cy.clickDropdownAction('fork')
        cy.url().should('contain', '/knowledge-model-editors/create')

        cy.checkFields({ name: '', kmId: '' })
        cy.fillFields({
            name: kmName,
            kmId,
            'version-major': '1',
            'version-minor': '0',
            'version-patch': '0'
        })

        cy.submitForm()
        cy.url().should('contain', '/knowledge-model-editors/editor/')

        cy.visitApp('/knowledge-model-editors')
        cy.getListingItem(kmId).should('contain', kmName)
    })

    it('prefill KM ID', () => {
        const kmName = 'Test Knowledge Model'
        const kmId = 'test-knowledge-model'

        cy.visitApp('/knowledge-model-editors')
        cy.getCy('km-editor_create-button').click()

        cy.get('#name').type(kmName).blur()
        cy.checkFields({ kmId })
    })
})
