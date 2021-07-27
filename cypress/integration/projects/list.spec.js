import * as project from '../../support/project-helpers'


describe('Project List', () => {
    const kmId = 'test-km-1'
    const packageId = 'dsw:test-km-1:1.0.0'

    before(() => {
        cy.task('package:delete', { km_id: kmId })
        cy.task('questionnaire:delete')
        cy.clearServerCache()

        cy.importKM('test-km-1')

        const projects = []
        for (let i = 1; i <= 60; i++) {
            projects.push({
                visibility: project.VisibleEdit,
                sharing: project.Restricted,
                name: `Questionnaire ${('0' + i).slice(-2)}`,
                packageId
            })
        }
        cy.createQuestionnaires(projects)
    })

    beforeEach(() => {
        cy.loginAs('researcher')
        cy.visitApp('/projects?page=1&sort=name,asc')
    })

    it('default sort', () => {
        cy.get('.list-group-item').contains('Questionnaire 01').should('exist')
        cy.get('.list-group-item').contains('Questionnaire 14').should('exist')
        cy.get('.list-group-item').contains('Questionnaire 20').should('exist')
        cy.get('.list-group-item').contains('Questionnaire 21').should('not.exist')
        cy.get('.list-group-item').contains('Questionnaire 45').should('not.exist')

        cy.get('.page-link').contains('Next').click()
        cy.get('.list-group-item').contains('Questionnaire 06').should('not.exist')
        cy.get('.list-group-item').contains('Questionnaire 20').should('not.exist')
        cy.get('.list-group-item').contains('Questionnaire 21').should('exist')
        cy.get('.list-group-item').contains('Questionnaire 32').should('exist')
        cy.get('.list-group-item').contains('Questionnaire 40').should('exist')
        cy.get('.list-group-item').contains('Questionnaire 41').should('not.exist')
        cy.get('.list-group-item').contains('Questionnaire 55').should('not.exist')

        cy.get('.page-link').contains('Next').click()
        cy.get('.list-group-item').contains('Questionnaire 12').should('not.exist')
        cy.get('.list-group-item').contains('Questionnaire 40').should('not.exist')
        cy.get('.list-group-item').contains('Questionnaire 41').should('exist')
        cy.get('.list-group-item').contains('Questionnaire 48').should('exist')
        cy.get('.list-group-item').contains('Questionnaire 60').should('exist')
    })

    it('reverse sort', () => {
        cy.getCy('listing_toolbar_sort-direction').click()

        cy.get('.list-group-item').contains('Questionnaire 60').should('exist')
        cy.get('.list-group-item').contains('Questionnaire 48').should('exist')
        cy.get('.list-group-item').contains('Questionnaire 41').should('exist')
        cy.get('.list-group-item').contains('Questionnaire 40').should('not.exist')
        cy.get('.list-group-item').contains('Questionnaire 12').should('not.exist')

        cy.get('.page-link').contains('Next').click()
        cy.get('.list-group-item').contains('Questionnaire 55').should('not.exist')
        cy.get('.list-group-item').contains('Questionnaire 41').should('not.exist')
        cy.get('.list-group-item').contains('Questionnaire 40').should('exist')
        cy.get('.list-group-item').contains('Questionnaire 32').should('exist')
        cy.get('.list-group-item').contains('Questionnaire 21').should('exist')
        cy.get('.list-group-item').contains('Questionnaire 20').should('not.exist')
        cy.get('.list-group-item').contains('Questionnaire 06').should('not.exist')

        cy.get('.page-link').contains('Next').click()
        cy.get('.list-group-item').contains('Questionnaire 45').should('not.exist')
        cy.get('.list-group-item').contains('Questionnaire 21').should('not.exist')
        cy.get('.list-group-item').contains('Questionnaire 20').should('exist')
        cy.get('.list-group-item').contains('Questionnaire 14').should('exist')
        cy.get('.list-group-item').contains('Questionnaire 01').should('exist')
    })

    it('filter', () => {
        cy.fillFields({ filter: '2' })
        cy.get('.page-link').should('not.exist')

        cy.get('.list-group-item').contains(`Questionnaire 02`).should('exist')
        cy.get('.list-group-item').contains(`Questionnaire 12`).should('exist')
        cy.get('.list-group-item').contains(`Questionnaire 20`).should('exist')
        cy.get('.list-group-item').contains(`Questionnaire 21`).should('exist')
        cy.get('.list-group-item').contains(`Questionnaire 22`).should('exist')
        cy.get('.list-group-item').contains(`Questionnaire 23`).should('exist')
        cy.get('.list-group-item').contains(`Questionnaire 24`).should('exist')
        cy.get('.list-group-item').contains(`Questionnaire 25`).should('exist')
        cy.get('.list-group-item').contains(`Questionnaire 26`).should('exist')
        cy.get('.list-group-item').contains(`Questionnaire 27`).should('exist')
        cy.get('.list-group-item').contains(`Questionnaire 28`).should('exist')
        cy.get('.list-group-item').contains(`Questionnaire 29`).should('exist')
        cy.get('.list-group-item').contains(`Questionnaire 32`).should('exist')
        cy.get('.list-group-item').contains(`Questionnaire 42`).should('exist')
        cy.get('.list-group-item').contains(`Questionnaire 52`).should('exist')
    })
})
