import * as project from '../../../support/project-helpers'

describe('Document Template Editor / Editor / Preview', () => {
    const projectName = 'My Project'
    const kmId = 'basic-questionnaire-test-km'
    const packageId = 'dsw:basic-questionnaire-test-km:1.0.0'

    before(() => {
        cy.task('package:delete', { km_id: kmId })
        cy.putDefaultAppConfig()
        cy.clearServerCache()

        cy.importKM(kmId)
    })

    beforeEach(() => {
        // prepare base document template
        cy.task('documentTemplate:delete')
        cy.task('questionnaire:delete')
        cy.clearServerCache()
        cy.importTemplate('templates/questionnaire-report.zip')

        // create project to use for preview
        cy.createQuestionnaire({
            visibility: project.VisibleView,
            sharing: project.Restricted,
            name: projectName,
            packageId
        })

        // create document template editor
        cy.loginAs('datasteward')
        cy.visitApp('/document-template-editors/create?selected=dsw:questionnaire-report:1.4.0&edit=true')
        cy.submitForm()
        cy.url().should('contain', '/document-template-editors/dsw:questionnaire-report:1.5.0')
        cy.getCy('dt-editor_nav_preview').click()
    })

    it('preview in browser', () => {
        cy.fillFields({
            th_uuid: projectName,
            s_format: 'JSON Data'
        })
        cy.getCy('document-preview').should('exist')
    })

    it('preview download', () => {
        cy.fillFields({
            th_uuid: projectName,
            s_format: 'MS Word Document'
        })
        cy.wait(2000)
        cy.getCy('illustrated-message_format-not-supported').should('exist')
    })
})
