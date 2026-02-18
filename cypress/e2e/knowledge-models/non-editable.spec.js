import * as packages from '../../support/packages-helpers'

describe('Non-editable KM', () => {
    const orgId = 'dsw'
    const kmId = 'test-km-1'
    const kmName = 'Test Knowledge Model 1'
    const version = '1.0.0'

    before(() => {
        cy.task('knowledgeModelPackage:delete', { km_id: kmId })
        cy.clearServerCache()

        cy.importKM('/test-km-1')
        cy.task('knowledgeModelPackage:setNonEditable', { km_id: kmId })
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
        packages.getPackageUuid(orgId, kmId, version).then((packageUuid) => {
            cy.visitApp(`/knowledge-models/${packageUuid}`)
        })
        cy.get('.badge').contains('non-editable').should('exist')

        cy.expectDropdownAction('create-project', true)
        cy.expectDropdownAction('create-km-editor', false)
        cy.expectDropdownAction('export', false)
        cy.expectDropdownAction('fork', false)
    })

    it('cannot create editor manually', () => {
        packages.getPackageUuid(orgId, kmId, version).then((packageUuid) => {
            cy.visitApp(`/knowledge-model-editors/create?selected=${packageUuid}&edit=true`)
        })
        cy.get('.version-suggestions a:first-child').click()
        cy.submitForm()
        cy.getCy('flash_alert-danger').should('exist')
    })
})
