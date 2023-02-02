import * as project from '../../support/project-helpers'

describe('Project Template', () => {
    const templateProjectName = 'Template Project'
    const projectName = 'Test Project'
    const kmId = 'test-km-1'
    const packageName = 'Test Knowledge Model 1'
    const packageId = 'dsw:test-km-1:1.0.0'
    const templateName = 'Questionnaire Report'

    before(() => {
        cy.task('package:delete', { km_id: kmId })
        cy.removeTemplate('dsw:questionnaire-report:1.4.0')
        cy.clearServerCache()

        cy.importKM('test-km-1')
        cy.importTemplate('templates/questionnaire-report.zip')
    })

    beforeEach(() => {
        cy.task('questionnaire:delete')
        cy.clearServerCache()
    })

    it('can create project template and use it for project', () => {
        // Create a new project
        cy.loginAs('datasteward')
        cy.visitApp('/projects')
        cy.getCy('projects_create-button').click()
        cy.get('.nav-link').contains('Custom').click()
        cy.fillFields({
            name: templateProjectName,
            th_packageId: packageName
        })
        cy.clickBtn('Create')
        project.awaitOpen()

        // Fill in an answer and create a todo
        project.selectAnswer('Answer 1')
        project.addTodoFor('Value Question 1')
        
        // Configure document template and enable template project
        project.openSettings()
        cy.fillFields({
            description: 'This is my template project',
            th_documentTemplateId: templateName
        })
        cy.checkToggle('isTemplate')
        cy.contains('JSON Data').click()
        cy.clickBtn('Save')
        project.awaitOpen()

        // check it is now a template project
        cy.get('.DetailNavigation__Row__Section .badge').contains('Template').should('exist')

        // set project public
        cy.clickBtn('Share')
        cy.checkToggle('visibilityEnabled')
        cy.get('.modal-content .btn').contains('Save').click()

        cy.logout()


        // Use the new template project
        cy.loginAs('researcher')
        cy.visitApp('/projects')
        cy.getCy('projects_create-button').click()
        cy.fillFields({
            name: projectName,
            th_uuid: templateProjectName
        })
        cy.clickBtn('Create')
        cy.url().should('contain', '/projects/')

        // Check it is not a template
        cy.get('.DetailNavigation__Row__Section .badge').should('not.exist')

        // Check prefilled things
        cy.contains('Chapter 1')
        project.checkAnswerChecked('Answer 1')
        project.expectTodoFor('Value Question 1')

        // Check preview working
        project.openPreview()
        cy.get('iframe').should('exist')
    })
})