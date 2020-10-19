import * as project from '../../../support/project-helpers'

describe('Project - Preview', () => {
    const projectName = 'Preview test'
    const kmId = 'test-documents'
    const packageId = 'dsw:test-documents:1.0.0'
    const templateId = 'dsw:questionnaire-report:1.1.0'

    const browserFormats = [
        'JSON Data',
        'HTML Document',
        'Markdown Document',
    ]
    
    const downloadFormats = [
        'MS Word Document',
        'OpenDocument Text',
        'LaTeX Document',
    ]

    const setFormatAndOpenPreview = (format) => {
        project.open(projectName)
        project.openSettings()
        cy.contains(format).click()
        cy.clickBtn('Save')
        project.openPreview()
    }

    const expectPreview = () => {
        cy.get('iframe').should('exist')
    }

    const expectDownload = () => {
        cy.get('h1').contains('Download preview').should('exist')
        cy.get('.btn').contains('Download').should('exist')
    }

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
        cy.fixture('templates/questionnaire-report.json').then((template) => {
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
        
        cy.createQuestionnaire({
            visibility: project.Private,
            sharing: project.Restricted,
            name: projectName,
            sharing: project.Restricted,
            packageId,
            templateId
        }).then((resp) => {
            cy.fixture(`${kmId}-questionnaire-content`).then((req) => {
                cy.updateQuestionnaireContent(resp.body.uuid, req)
            })
        })
    })


    browserFormats.forEach((format) => {
        it(`Broswer format ${format}`, () => {
            setFormatAndOpenPreview(format)
            expectPreview()
        })
    })

    downloadFormats.forEach((format) => {
        it(`Download format ${format}`, () => {
            setFormatAndOpenPreview(format)
            expectDownload()
        })
    })

    it('PDF', () => {
        setFormatAndOpenPreview('PDF Document')

        function getPdfSupport() {
            function hasAcrobatInstalled() {
                function getActiveXObject(name) {
                    try { return new ActiveXObject(name); } catch(e) {}
                }
        
                return getActiveXObject('AcroPDF.PDF') || getActiveXObject('PDF.PdfCtrl')
            }
        
            function isIos() {
                return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream
            }
        
            return !!(navigator.mimeTypes['application/pdf'] || hasAcrobatInstalled() || isIos())
        }

        if (getPdfSupport()) {
            expectPreview()
        } else {
            expectDownload()
        }
    })

    it('Template not set', () => {
        project.open(projectName)
        project.openPreview()

        cy.get('h1').contains('Default template not set').should('exist')
        cy.clickBtn('Go to settings')

        cy.url().should('match', /\/projects\/.+\/settings/)
    })
})
