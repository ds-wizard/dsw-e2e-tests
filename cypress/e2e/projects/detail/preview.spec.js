import * as project from '../../../support/project-helpers'

describe('Project - Preview', () => {
    const projectName = 'Preview test'
    const kmId = 'test-documents'
    const knowledgeModelPackageId = 'dsw:test-documents:1.0.0'
    const documentTemplateId = 'dsw:questionnaire-report:1.4.0'

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
        
        project.open(projectName)
        project.openPreview()
    }

    const expectPreview = () => {
        cy.get('iframe', { timeout: 10000 }).should('exist')
    }

    const expectDownload = () => {
        cy.get('h1').contains('Download preview').should('exist')
        cy.get('.btn').contains('Download').should('exist')
    }

    before(() => {
        cy.task('knowledgeModelPackage:delete', { km_id: kmId })
        cy.removeTemplate('dsw:questionnaire-report:1.4.0')
        cy.clearServerCache()
        
        cy.importKM(kmId)
        cy.importTemplate('templates/questionnaire-report.zip')
    })

    beforeEach(() => {
        cy.task('project:delete')
        cy.clearServerCache()

        cy.loginAs('researcher')
        
        cy.createProject({
            visibility: project.Private,
            sharing: project.Restricted,
            name: projectName,
            sharing: project.Restricted,
            knowledgeModelPackageId,
            documentTemplateId
        }).then((resp) => {
            cy.fixture(`${kmId}-questionnaire-content`).then((req) => {
                cy.updateProjectContent(resp.body.uuid, req)
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

    it('Document template not set', () => {
        project.open(projectName)
        project.openPreview()

        cy.get('h1').contains('Default document template is not set.').should('exist')
        cy.clickBtn('Go to settings')

        cy.url().should('match', /\/projects\/.+\/settings/)
    })
})
