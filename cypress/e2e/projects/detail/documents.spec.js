import * as d from '../../../support/document-helpers'
import * as project from '../../../support/project-helpers'


describe('Documents', () => {
    const projectName = 'Documents test'
    let projectUuid = ''
    const kmId = 'test-documents'
    const packageId = 'dsw:test-documents:1.0.0'
    const documentTemplateId = 'dsw:questionnaire-report:1.4.0'

    const templateName = 'Questionnaire Report'
    const brokenTemplateName = 'Broken Template'
    const notAllowedTemplateName = 'Not Allowed Template'
    const formats = [
        'JSON Data',
        'HTML Document',
        'PDF Document',
        'LaTeX Document',
        'MS Word Document',
        'OpenDocument Text',
        'Markdown Document',
    ]
    const brokenFormats = formats.slice(2, formats.length)

    before(() => {
        cy.task('package:delete', { km_id: kmId })
        cy.removeTemplate(documentTemplateId)
        cy.removeTemplate('dsw:broken:0.1.0')
        cy.removeTemplate('dsw:not-allowed:0.1.0')
        cy.clearServerCache()

        cy.importKM(kmId)
        cy.importTemplate('templates/questionnaire-report.zip')
        cy.importTemplate('templates/broken.zip')
        cy.importTemplate('templates/not-allowed.zip')
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
            documentTemplateId
        }).then((resp) => {
            cy.fixture(`${kmId}-questionnaire-content`).then((req) => {
                cy.updateQuestionnaireContent(resp.body.uuid, req)
                projectUuid = resp.body.uuid
            })
        })
    })

    formats.forEach((format) => {
        it(`Create - ${format}`, () => {
            const documentName = `${projectName} (${format})`
            project.open(projectName)
            project.openDocuments()

            cy.clickBtn('New document')

            d.submitDocumentForm(documentName, format)
            d.checkDocument(documentName, true)
        })
    })

    it('Create (prefill name)', () => {
        project.open(projectName)
        project.openDocuments()
        cy.clickBtn('New document')
        cy.get('#name').should('have.value', projectName)
    })

    it('Create, View, Delete', () => {
        const documentName = `${projectName} (${formats[0]})`
        d.createDocument(documentName, projectUuid, formats[0])

        cy.visitApp(`/projects/${projectUuid}/documents`)

        cy.get('.list-group-item').should('have.length', 1)
        cy.get('.list-group-item').contains(documentName)
        cy.get('.list-group-item .dropdown-toggle').click()
        cy.get('.list-group-item .dropdown-item').contains('Delete').click()
        cy.get('.modal-dialog button').contains('Delete').click()
        cy.get('.list-group-item').should('not.exist')
        cy.expectAlert('success', 'Document was successfully deleted.')
    })

    brokenFormats.forEach((format) => {
        it(`Broken Template - ${format}`, () => {
            project.open(projectName)
            project.openSettings()
            cy.fillFields({ th_documentTemplateId: brokenTemplateName })
            cy.clickBtn('Save')

            const documentName = `${projectName} (${brokenTemplateName} - ${format})`
            d.createDocument(documentName, projectUuid, format)

            cy.wait(1000) // Wait for document generation
            cy.get('span.badge.bg-danger').contains('Error').should('be.visible')
        })
    })

    it('Not Allowed Template', () => {
        cy.visitApp(`/projects/${projectUuid}/settings`)
        cy.get('#documentTemplateId').click()

        cy.get('#documentTemplateId-search').clear().type(templateName)
        cy.get('#documentTemplateId .TypeHintInput__TypeHints ul li a').contains(templateName).should('exist')
        
        cy.get('#documentTemplateId-search').clear().type(brokenTemplateName)
        cy.get('#documentTemplateId .TypeHintInput__TypeHints ul li a').contains(brokenTemplateName).should('exist')
        
        cy.get('#documentTemplateId-search').clear().type(notAllowedTemplateName)
        cy.get('#documentTemplateId .TypeHintInput__TypeHints ul li a').should('not.exist')
    })

    it('Default template not set', () => {
        const documentName = 'Test document'
        
        // unset the default template
        project.open(projectName)
        project.openSettings()
        cy.clearTypeHintInput('documentTemplateId')
        cy.clickBtn('Save')

        project.openDocuments()
        cy.clickBtn('New document')

        // no format id when tempalte is not selected
        cy.get('#documentTemplateId').should('exist')
        cy.get('#formatId').should('not.exist')

        // select template and submit document
        cy.fillFields({ th_documentTemplateId: templateName })
        d.submitDocumentForm(documentName, 'PDF Document')
        d.checkDocument(documentName, true)
    })
})
