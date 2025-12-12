import * as project from '../../../../support/project-helpers'
import * as phases from '../../../../support/phases-helpers'


describe('Questionnaire Phases', () => {
    const projectName = 'Test of Phases'

    before(() => {
        cy.task('knowledgeModelPackage:delete', { km_id: phases.kmId })
        cy.clearServerCache()

        cy.importKM(phases.kmId)
    })

    beforeEach(() => {
        cy.task('project:delete')
        cy.clearServerCache()
        
        cy.loginAs('researcher')
        cy.createProject({
            visibility: project.VisibleView,
            sharing: project.Restricted,
            name: projectName,
            knowledgeModelPackageId: phases.packageId
        })
        cy.loginAs('researcher')
        project.open(projectName)
    })

    phases.runCommonTests()
})
