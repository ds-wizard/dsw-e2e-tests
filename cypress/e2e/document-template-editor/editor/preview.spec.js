import * as dtEditor from '../../../support/dt-editor-helpers'
import * as project from '../../../support/project-helpers'

describe('Document Template Editor / Editor / Preview', () => {
    const projectName = 'My Project'
    const kmId = 'basic-questionnaire-test-km'
    let knowledgeModelPackageUuid

    before(() => {
        cy.task('knowledgeModelPackage:delete', { km_id: kmId })
        cy.putDefaultAppConfig()
        cy.clearServerCache()

        cy.importKM(kmId, (uuid) => {
            knowledgeModelPackageUuid = uuid
        })
    })

    beforeEach(() => {
        // prepare base document template
        cy.task('documentTemplate:delete')
        cy.task('project:delete')
        cy.clearServerCache()
        cy.importTemplate('templates/questionnaire-report.zip')

        // create project to use for preview
        cy.createProject({
            visibility: project.VisibleView,
            sharing: project.Restricted,
            name: projectName,
            knowledgeModelPackageUuid
        })

        // create document template editor
        cy.loginAs('datasteward')
        dtEditor.createEditor('dsw:questionnaire-report:1.4.0', 'dsw:questionnaire-report:1.5.0')
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
