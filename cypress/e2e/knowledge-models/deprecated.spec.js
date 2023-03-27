describe('Deprecated KM', () => {
    const orgId = 'dsw'
    const kmId = 'parent-km'
    const kmName = 'Parent KM'
    const version = '1.11.0'

    const searchKM = (value) => {
        cy.get(`#packageId`).click()
        cy.get(`#packageId .TypeHintInput__TypeHints__Search`).type(value)
    }

    before(() => {
        cy.task('package:delete', { km_id: kmId })
        cy.clearServerCache()

        cy.importKM('km-migration/dsw_parent-km_1.11.0')
    })

    it('set deprecated and restore', () => {
        cy.loginAs('datasteward')

        // set KM deprecated
        cy.visitApp(`/knowledge-models/${orgId}:${kmId}:${version}`)
        cy.clickDropdownAction('set-deprecated')

        // check it was set
        cy.get('.badge.bg-danger').contains('deprecated').should('exist')

        // check it is not suggested
        cy.visitApp('/projects/create/custom')
        searchKM(kmId)
        cy.get('.TypeHintInput__TypeHints .empty').should('exist')

        // restore KM
        cy.visitApp(`/knowledge-models/${orgId}:${kmId}:${version}`)
        cy.clickDropdownAction('restore')

        // check it is suggested again
        cy.visitApp('/projects/create/custom')
        cy.fillFields({ th_packageId: kmName })
    })
})
