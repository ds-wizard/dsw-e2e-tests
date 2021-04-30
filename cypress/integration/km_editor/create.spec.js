describe('KM Editor Create', () => {

    beforeEach(() => {
        cy.task('mongo:delete', {
            collection: 'packages',
        })
        cy.task('mongo:delete', {
            collection: 'branches',
        })
        cy.clearServerCache()

        cy.fixture('test-km-1').then((km) => {
            cy.importKM(km)
        })
        
        cy.loginAs('datasteward')
    })

    it('can create empty', () => {
        const kmName = 'Test Knowledge Model'
        const kmId = 'test-km'

        cy.visitApp('/km-editor')

        cy.clickBtn('Create')
        cy.url().should('contain', '/km-editor/create')

        cy.fillFields({ name: kmName, kmId })
        cy.clickBtn('Create')
        cy.url().should('contain', '/km-editor/edit/')

        cy.visitApp('/km-editor')
        cy.getListingItem(kmId).should('contain', kmName)
    })

    it('can create based on existing', () => {
        const kmName = 'Test Knowledge Model 1'
        const kmId = 'test-km-1'

        cy.visitApp('/knowledge-models/dsw:test-km-1:1.0.0')

        cy.clickLink('Create KM editor')
        cy.url().should('contain', '/km-editor/create')

        cy.checkFields({ name: kmName, kmId })

        cy.clickBtn('Create')
        cy.url().should('contain', '/km-editor/edit/')

        cy.visitApp('/km-editor')
        cy.getListingItem(kmId).should('contain', kmName)
    })

    it('can create fork', () => {
        const kmName = 'Fork Knowledge Model 1'
        const kmId = 'fork-km-1'

        cy.visitApp('/knowledge-models/dsw:test-km-1:1.0.0')

        cy.clickLink('Fork KM')
        cy.url().should('contain', '/km-editor/create')

        cy.checkFields({ name: '', kmId: '' })
        cy.fillFields({ name: kmName, kmId })

        cy.clickBtn('Create')
        cy.url().should('contain', '/km-editor/edit/')

        cy.visitApp('/km-editor')
        cy.getListingItem(kmId).should('contain', kmName)
    })

    it('prefill KM ID', () => {
        const kmName = 'Test Knowledge Model'
        const kmId = 'test-knowledge-model'

        cy.visitApp('/km-editor')
        cy.clickBtn('Create')

        cy.get('#name').type(kmName).blur()
        cy.checkFields({ kmId })
    })
})
