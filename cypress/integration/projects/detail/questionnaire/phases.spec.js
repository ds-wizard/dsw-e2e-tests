import * as project from '../../../../support/project-helpers'
import * as phases from '../../../../support/phases-helpers'


describe('Questionnaire Phases', () => {
    const projectName = 'Test of Phases'

    before(() => {
        cy.task('mongo:delete', {
            collection: 'packages',
            args: { kmId: phases.kmId }
        })
        cy.clearServerCache()

        cy.fixture(phases.kmId).then((km) => {
            cy.importKM(km)
        })
    })

    beforeEach(() => {
        cy.task('mongo:delete', {
            collection: 'questionnaires',
            args: {}
        })
        cy.clearServerCache()
        
        cy.loginAs('researcher')
        cy.createQuestionnaire({
            visibility: project.VisibleView,
            sharing: project.Restricted,
            name: projectName,
            packageId: phases.packageId
        })
        cy.loginAs('researcher')
        project.open(projectName)
    })

    phases.runCommonTests()
})
