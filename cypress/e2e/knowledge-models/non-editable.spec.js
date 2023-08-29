describe('Non-editable KM', () => {
    const orgId = 'dsw'
    const kmId = 'test-km-1'
    const kmName = 'Test Knowledge Model 1'
    const version = '1.0.0'

    before(() => {
        cy.task('package:delete', { km_id: kmId })
        cy.clearServerCache()

        cy.importKM('/test-km-1')
        cy.task('package:setNonEditable', { km_id: kmId })
    })

    beforeEach(() => {
        cy.loginAs('datasteward')
    })

    it('list view', () => {
        cy.visitApp('/knowledge-models')
        cy.get('.badge').contains('non-editable').should('exist')
        
        cy.expectListingItemAction(kmName, 'create-project', true)
        cy.expectListingItemAction(kmName, 'create-km-editor', false)
        cy.expectListingItemAction(kmName, 'export', false)
        cy.expectListingItemAction(kmName, 'fork', false)
    })

    it('detail', () => {
        cy.visitApp(`/knowledge-models/${orgId}:${kmId}:${version}`)
        cy.get('.badge').contains('non-editable').should('exist')

        cy.expectDropdownAction('create-project', true)
        cy.expectDropdownAction('create-km-editor', false)
        cy.expectDropdownAction('export', false)
        cy.expectDropdownAction('fork', false)
    })

    it('cannot create editor manually', () => {
        cy.visitApp(`/km-editor/create?selected=${orgId}:${kmId}:${version}&edit=true`)
        cy.get('.version-suggestions a:first-child').click()
        cy.submitForm()
        cy.getCy('flash_alert-danger').should('exist')
    })
})
