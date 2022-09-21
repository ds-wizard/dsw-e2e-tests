import * as project from '../../../../support/project-helpers'
import * as phases from '../../../../support/phases-helpers'


describe('Questionnaire Phases', () => {
    const projectName = 'Test of Phases'

    before(() => {
        cy.task('package:delete', { km_id: phases.kmId })
        cy.clearServerCache()

        cy.importKM(phases.kmId)
    })

    beforeEach(() => {
        cy.task('questionnaire:delete')
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
