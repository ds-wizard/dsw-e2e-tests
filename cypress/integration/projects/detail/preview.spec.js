import * as project from '../../../support/project-helpers'

describe('Project - Preview', () => {
    const projectName = 'Preview test'
    const kmId = 'test-documents'
    const packageId = 'dsw:test-documents:1.0.0'
    const templateId = 'dsw:questionnaire-report:1.3.0'

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
        cy.task('package:delete', { km_id: kmId })
        cy.removeTemplate('dsw:questionnaire-report:1.3.0')
        cy.clearServerCache()
        
        cy.importKM(kmId)
        cy.importTemplate('templates/questionnaire-report.zip')
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

        cy.get('h1').contains('Default template is not set.').should('exist')
        cy.clickBtn('Go to settings')

        cy.url().should('match', /\/projects\/.+\/settings/)
    })
})
