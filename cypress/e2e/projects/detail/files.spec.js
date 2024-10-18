import * as project from '../../../support/project-helpers'

describe('Project Files', () => {
    const projectName = 'Files test'
    const kmId = 'file-km'
    const packageId = 'myorg:file-km:1.0.0'

    before(() => {
        cy.task('package:delete', { km_id: kmId })
        cy.clearServerCache()

        cy.importKM(kmId)
    })

    beforeEach(() => {
        cy.task('questionnaire:delete')
        cy.clearServerCache()

        cy.loginAs('researcher')

        cy.createQuestionnaire({
            visibility: project.Private,
            sharing: project.Restricted,
            name: projectName,
            sharing: project.Restricted,
            packageId,
            documentTemplateId: null
        })
    })

    it('Add file', () => {
        project.open(projectName)

        cy.getCy('file-upload').click()
        cy.get('.dropzone').selectFile('cypress/fixtures/questionnaire-files/users.csv', {
            action: 'drag-drop'
        })
        cy.clickModalAction()

        cy.get('.questionnaire-file').contains('users.csv').should('exist')

        project.openFiles()
        cy.getListingItem('users.csv').should('exist')
    })

    it('Add file warnings', () => {
        project.open(projectName)

        cy.getCy('file-upload').click()
        cy.get('.dropzone').selectFile('cypress/fixtures/questionnaire-files/screenshot.png', {
            action: 'drag-drop'
        })

        cy.get('.alert-danger').contains('The file type is not allowed').should('exist')
        cy.get('.alert-danger').contains('The file cannot be larger than').should('exist')
    })

    it('Delete file from question', () => {
        project.open(projectName)

        cy.getCy('file-upload').click()
        cy.get('.dropzone').selectFile('cypress/fixtures/questionnaire-files/users.csv', {
            action: 'drag-drop'
        })
        cy.clickModalAction()
        cy.getCy('project_nav_files').should('exist')

        cy.getCy('file-delete').click()
        cy.clickModalAction()

        cy.get('.questionnaire-file').should('not.exist')
    })

    it('Delete file from question', () => {
        project.open(projectName)

        cy.getCy('file-upload').click()
        cy.get('.dropzone').selectFile('cypress/fixtures/questionnaire-files/users.csv', {
            action: 'drag-drop'
        })
        cy.clickModalAction()
        project.openFiles()

        cy.clickListingItemAction('users.csv', 'delete')
        cy.clickModalAction()

        project.openQuestionnaire()
        project.expectWarningFor('Choose your file')
        project.expectWarningCount(1)
    })

    it('Delete file from question by admin', () => {
        // open project as researcher and upload a file
        project.open(projectName)
        cy.getCy('file-upload').click()
        cy.get('.dropzone').selectFile('cypress/fixtures/questionnaire-files/users.csv', {
            action: 'drag-drop'
        })
        cy.clickModalAction()
        cy.logout()

        // login as admin and delete that file
        cy.loginAs('admin')
        cy.visitApp('/project-files')
        cy.clickListingItemAction('users.csv', 'delete')
        cy.clickModalAction()
        cy.logout()

        // login as researcher and check that there is a warning
        cy.loginAs('researcher')
        project.open(projectName)
        project.expectWarningFor('Choose your file')
        project.expectWarningCount(1)
    })
})
