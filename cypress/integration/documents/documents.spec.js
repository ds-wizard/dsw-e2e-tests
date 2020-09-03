import * as d from '../../support/document-helpers'
import * as q from '../../support/questionnaire-helpers'

describe('Documents', () => {
    const questionnaireName = 'Documents test'
    let questionnaireUuid = ''
    const kmId = 'test-documents'
    const packageId = 'dsw:test-documents:1.0.0'

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
        cy.task('mongo:delete', {
            collection: 'packages',
            args: { kmId }
        })
        cy.fixture(kmId).then((km) => {
            cy.importKM(km)
        })
        cy.task('mongo:delete', {
            collection: 'templates',
            args: { templateId: 'questionnaire-report' }
        })
        cy.task('mongo:delete', {
            collection: 'templates',
            args: { templateId: 'broken' }
        })
        cy.task('mongo:delete', {
            collection: 'templates',
            args: { templateId: 'not-allowed' }
        })
        cy.fixture('templates/questionnaire-report.json').then((template) => {
            cy.importTemplate(template)
        })
        cy.fixture('templates/broken.json').then((template) => {
            cy.importTemplate(template)
        })
        cy.fixture('templates/not-allowed.json').then((template) => {
            cy.importTemplate(template)
        })
    })

    beforeEach(() => {
        cy.task('mongo:delete', {
            collection: 'documents'
        })
        cy.task('mongo:delete', {
            collection: 'documentFs'
        })
        cy.task('mongo:delete', {
            collection: 'questionnaires',
            args: {}
        })
        cy.loginAs('researcher')
        
        const questionnaire = {
            visibility: q.Private,
            sharing: q.Restricted,
            name: questionnaireName,
            sharing: q.Restricted,
            packageId
        }
        
        cy.createQuestionnaire(questionnaire).then((resp) => {
            cy.fixture(`${kmId}-questionnaire`).then((req) => {
                cy.updateQuestionnaire(resp.body.uuid, req)
                questionnaireUuid = resp.body.uuid
            })
        })
    })

    formats.forEach((format) => {
        it(`Create (from Questionnaires) - ${format}`, () => {
            const documentName = `${questionnaireName} (${format})`
            cy.visitApp('/questionnaires')

            cy.get('.list-group-item .dropdown-toggle').click()
            cy.get('.list-group-item .dropdown-item').contains('Create Document').click()

            d.submitDocumentForm(documentName, templateName, format)
            d.checkDocument(documentName, true)
        })
    })

    it(`Create (from Questionnaire, prefill name)`, () => {
        cy.visitApp('/questionnaires')

        cy.get('.list-group-item .dropdown-toggle').click()
        cy.get('.list-group-item .dropdown-item').contains('Create Document').click()

        cy.get('#name').should('have.value', questionnaireName)
    })

    it(`Create, View, Delete`, () => {
        const documentName = `${questionnaireName} (${formats[0]})`
        d.createDocument(documentName, questionnaireUuid, templateName, formats[0])

        cy.visitApp('/questionnaires')

        cy.get('.list-group-item .dropdown-toggle').click()
        cy.get('.list-group-item .dropdown-item').contains('View Documents').click()

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
            const documentName = `${questionnaireName} (${brokenTemplateName} - ${format})`
            cy.visitApp('/documents')

            d.createDocument(documentName, questionnaireUuid, brokenTemplateName, format)

            cy.wait(1000) // Wait for document generation
            cy.get('span.badge-danger').contains('Error').should('be.visible')
        })
    })

    it(`Not Allowed Template`, () => {
        cy.visitApp(`/documents/create/${questionnaireUuid}`)
        cy.get('#templateId option').contains(templateName).should('exist')
        cy.get('#templateId option').contains(brokenTemplateName).should('exist')
        cy.get('#templateId option').contains(notAllowedTemplateName).should('not.exist')
    })
})
