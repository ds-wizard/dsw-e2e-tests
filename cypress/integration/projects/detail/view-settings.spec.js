import * as project from '../../../support/project-helpers'


describe('Questionnaire - View Settings', () => {
    const projectName = 'Test Questionnaire'
    const kmIdTags = 'km-with-tags'
    const kmIdPhases = 'test-phases'
    const packageIdTags = 'mto:km-with-tags:1.0.0'
    const packageIdPhases = 'dsw:test-phases:1.0.0'

    const clickViewMenu = (item) => {
        cy.get('.questionnaire__toolbar .btn').contains('View').click()
        cy.get('.questionnaire__toolbar .dropdown-item').contains(item).click()
    }

    const withQuestionnaire = (packageId, callback) => {
        cy.createQuestionnaire({
            visibility: project.VisibleEdit,
            sharing: project.AnyoneWithLinkEdit,
            name: projectName,
            packageId
        }).then(() => {
            cy.loginAs('researcher')
            project.open(projectName)
            callback()
        })
    }

    before(() => {
        cy.task('mongo:delete', {
            collection: 'packages',
            args: {}
        })
        cy.clearServerCache()

        cy.fixture(kmIdTags).then(cy.importKM)
        cy.fixture(kmIdPhases).then(cy.importKM)
    })

    beforeEach(() => {
        cy.task('mongo:delete', {
            collection: 'questionnaires',
            args: {}
        })
        cy.clearServerCache()
    })

    it('Answered by', () => {
        withQuestionnaire(packageIdPhases, () => {
            project.typeAnswer('Question 1', 'abcd')
            cy.get('.answered').should('exist')
            clickViewMenu('Answered by')
            cy.get('.answered').should('not.exist')
            clickViewMenu('Answered by')
            cy.get('.answered').should('exist')
        })

    })

    it('Phases', () => {
        withQuestionnaire(packageIdPhases, () => {
            cy.get('.extra-data').contains('Desirable').should('exist')
            clickViewMenu('Phases')
            cy.get('.extra-data').contains('Desirable').should('not.exist')
            clickViewMenu('Phases')
            cy.get('.extra-data').contains('Desirable').should('exist')
        })
    })

    it('Tags', () => {
        withQuestionnaire(packageIdTags, () => {
            cy.get('.tag-list').should('exist')
            clickViewMenu('Tags')
            cy.get('.tag-list').should('not.exist')
            clickViewMenu('Tags')
            cy.get('.tag-list').should('exist')
        })
    })
})
