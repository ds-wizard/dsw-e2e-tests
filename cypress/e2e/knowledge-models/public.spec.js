describe('Knowledge Models / Public', () => {
    const kmId = 'test-km-1'
    let knowledgeModelPackageUuid

    before(() => {
        cy.putDefaultAppConfig()

        cy.task('project:delete')
        cy.task('knowledgeModelPackage:delete', { km_id: kmId })
        cy.clearServerCache()

        cy.importKM('/test-km-1', (uuid) => {
            knowledgeModelPackageUuid = uuid
        })
    })

    it('set public and private', () => {
        // set KM public
        cy.loginAs('datasteward')
        cy.visitApp(`/knowledge-models/${knowledgeModelPackageUuid}`)
        cy.clickDropdownAction('set-public')

        // check it was set
        cy.get('.badge.bg-info').contains('public').should('exist')

        // check it can be open
        cy.logout()
        cy.visitApp(`/knowledge-models/${knowledgeModelPackageUuid}`)
        cy.get('.top-header').contains('Test Knowledge Model 1').should('exist')

        // set KM private
        cy.loginAs('datasteward')
        cy.visitApp(`/knowledge-models/${knowledgeModelPackageUuid}`)
        cy.clickDropdownAction('set-private')

        // check it was set
        cy.get('.badge.bg-info').should('not.exist')

        // check it cannot be open
        cy.logout()
        cy.visitApp(`/knowledge-models/${knowledgeModelPackageUuid}`)
        cy.getCy('illustrated-message_error').should('exist')
    })
})
