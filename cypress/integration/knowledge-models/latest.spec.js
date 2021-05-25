import * as project from '../../support/project-helpers'

describe('Latest version', () => {
    const orgId = 'dsw'
    const kmId = 'parent-km'
    const latest = '1.11.0'

    before(() => {
        cy.task('package:delete', { km_id: kmId })
        cy.task('questionnaire:delete')
        cy.clearServerCache()

        cy.importKM('km-migration/dsw_parent-km_1.11.0')
    })

    it('knowledge model detail', () => {
        cy.loginAs('researcher')
        cy.visitApp(`/knowledge-models/${orgId}:${kmId}:latest`)
        cy.get('dd').contains(latest).should('exist')
    })

    it('knowledge model preview', () => {
        cy.loginAs('researcher')
        cy.visitApp(`/knowledge-models/${orgId}:${kmId}:latest/preview`)
        cy.get('.top-header-title').contains(latest).should('exist')
    })

    it('project create', () => {
        cy.loginAs('researcher')
        cy.visitApp(`/projects/create?selected=${orgId}:${kmId}:latest`)
        
        cy.fillFields({ name: 'My Project'})
        cy.clickBtn('Save')

        project.openSettings()
        cy.get('.package-link .badge').contains(latest).should('exist')
    })
})