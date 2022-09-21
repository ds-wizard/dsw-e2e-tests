import * as project from '../../support/project-helpers'

describe('Project Clone', () => {
    const projectName = 'Test Project'
    const kmId = 'basic-questionnaire-test-km'
    const packageId = 'dsw:basic-questionnaire-test-km:1.0.0'


    before(() => {
        cy.task('package:delete', { km_id: kmId })
        cy.clearServerCache()

        cy.importKM(kmId)
    })


    beforeEach(() => {
        cy.task('questionnaire:delete')
        cy.clearServerCache()
        
        cy.loginAs('researcher')
    })

    
    it('can clone project', () => {
        // create a new questionnaire
        cy.createQuestionnaire({
            visibility: project.VisibleView,
            sharing: project.Restricted,
            name: projectName,
            packageId
        })

        // fill in some answers
        project.open(projectName)
        project.selectAnswer('Answer 1.2')
        project.selectAnswer('Follow-up answer 1.1')
        project.typeAnswer('Value Question String', 'Some value')
        project.awaitSave()
        cy.visitApp('/projects')

        // clone questionnaire
        const copyName = `Copy of ${projectName}`
        cy.clickListingItemAction(projectName, 'clone')
        cy.get('.btn-primary').contains('Clone').click()

        // check filled answers
        project.expectTitle(copyName)
        project.checkAnswerChecked('Answer 1.2')
        project.checkAnswerChecked('Follow-up answer 1.1')
        project.checkAnswer('Value Question String', 'Some value')
    })
})
