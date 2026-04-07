import * as kmEditor from '../../../support/editor-helpers'
import * as dtEditor from '../../../support/dt-editor-helpers'
import * as project from '../../../support/project-helpers'
import { dataCy } from '../../../support/utils'

describe('Document Template Editor / Editor / Preview with KM Editor', () => {
    const kmName = 'Test Knowledge Model'
    const kmId = 'test-km'

    const createKmEditor = () => {
        cy.visitApp('/knowledge-model-editors/create')
        cy.fillFields({
            name: kmName,
            kmId,
            'version-major': '1',
            'version-minor': '0',
            'version-patch': '0'
        })
        cy.submitForm()
        cy.url().should('contain', '/knowledge-model-editors/editor/')

        const chapter = { title: 'Chapter 1' }
        const question = { 
            s_type: 'Value',
            title: 'Question 1',
        }
        kmEditor.createChildren([
            ['chapter', chapter],
            ['question', question]
        ])
    }

    const createDocumentTemplateEditor = () => {
        cy.loginAs('datasteward')
        dtEditor.createEditor('dsw:questionnaire-report:1.4.0', 'dsw:questionnaire-report:1.5.0')
    }
    
    const validateReplies = (validate) => {
        cy.frameLoaded(dataCy('document-preview'))
        cy.iframe().find('pre').then($pre => {
            const templateJson = JSON.parse($pre.text())
            validate(templateJson['project']['replies'])
        })
    }
    
    beforeEach(() => {
        cy.task('knowledgeModelEditor:delete')
        cy.task('documentTemplate:delete')
        cy.putDefaultAppConfig()
        cy.clearServerCache()
        cy.importTemplate('templates/questionnaire-report.zip')

        cy.loginAs('datasteward')
    })


    it('preview in browser', () => {
        // Create KM Editor and Document Template Editor
        createKmEditor()
        createDocumentTemplateEditor()

        // Set preview in Document Template Editor
        cy.getCy('dt-editor_nav_preview').click()
        cy.getCy('dt-editor_preview-mode_km-editor').click()
        cy.fillFields({
            th_uuid: kmName,
            s_format: 'JSON Data'
        })

        // Ensure empty replies
        validateReplies(replies => {
            cy.wrap(replies).should('be.empty')
        })

        // Go back to the KM Editor and edit replies
        cy.visitApp('/knowledge-model-editors')
        kmEditor.open(kmId)
        kmEditor.openPreview()
        project.typeAnswer('Question 1', 'This is the question answer')
        cy.getCy('km-editor_preview_save-values').click()
        kmEditor.awaitSave()

        // Go back to the Document Template Editor
        cy.visitApp('/document-template-editors')
        cy.clickListingItemAction('dsw:questionnaire-report:1.5.0', 'view')
        cy.getCy('dt-editor_nav_preview').click()

        validateReplies(replies => {
            cy.wrap(Object.keys(replies)).should('have.length', 1)

            const value = Object.values(replies)[0].value
            cy.wrap(value.type).should('eq', 'StringReply')
            cy.wrap(value.value).should('eq', 'This is the question answer')
        })

        // Back to KM Editor
        cy.visitApp('/knowledge-model-editors')
        kmEditor.open(kmId)
        kmEditor.openPreview()
        project.clearAnswer('Question 1')
        cy.getCy('km-editor_preview_save-values').click()
        kmEditor.awaitSave()

        // Back to Document Template Editor and check replies are empty again
        cy.visitApp('/document-template-editors')
        cy.clickListingItemAction('dsw:questionnaire-report:1.5.0', 'view')
        cy.getCy('dt-editor_nav_preview').click()

        validateReplies(replies => {
            cy.wrap(replies).should('be.empty')
        })
    })
})
