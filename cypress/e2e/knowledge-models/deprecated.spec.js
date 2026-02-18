describe('Deprecated KM', () => {
    const kmId = 'test-km-1'
    const kmName = 'Test Knowledge Model 1'
    let knowledgeModelPackageUuid

    const searchKM = (value) => {
        cy.get(`#knowledgeModelPackageUuid`).click()
        cy.get(`#knowledgeModelPackageUuid_search`).type(value)
    }

    before(() => {
        cy.putDefaultAppConfig()

        cy.task('project:delete')
        cy.task('knowledgeModelPackage:delete', { km_id: kmId })
        cy.clearServerCache()

        cy.importKM('/test-km-1', (uuid) => {
            knowledgeModelPackageUuid = uuid
        })
    })

    it('set deprecated and restore', () => {
        cy.loginAs('datasteward')

        // set KM deprecated
        cy.visitApp(`/knowledge-models/${knowledgeModelPackageUuid}`)
        cy.clickDropdownAction('set-deprecated')

        // check it was set
        cy.get('.badge.bg-danger').contains('deprecated').should('exist')

        // check it is not suggested
        cy.visitApp('/projects/create')
        searchKM(kmId)

        cy.get('.typehints-empty').should('exist')

        // restore KM
        cy.visitApp(`/knowledge-models/${knowledgeModelPackageUuid}`)
        cy.clickDropdownAction('restore')

        // check it is suggested again
        cy.visitApp('/projects/create')
        cy.fillFields({ th_knowledgeModelPackageUuid: kmName })
    })
})
