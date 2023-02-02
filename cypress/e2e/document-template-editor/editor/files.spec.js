import * as editor from '../../../support/dt-editor-helpers'

describe('Document Template Editor / Editor / Files', () => {
    before(() => {
        cy.putDefaultAppConfig()
        cy.clearServerCache()
    })

    beforeEach(() => {
        // prepare base document template
        cy.task('documentTemplate:delete')
        cy.importTemplate('templates/questionnaire-report.zip')
        
        // create document template editor
        cy.loginAs('datasteward')
        cy.visitApp('/document-template-editors/create?selected=dsw:questionnaire-report:1.4.0&edit=true')
        cy.submitForm()
        cy.url().should('contain', '/document-template-editors/dsw:questionnaire-report:1.5.0')
        cy.getCy('dt-editor_nav_files').click()
    })

    it('create file simple', () => {
        editor.addFile()
        cy.fillFields({ 'file-name': 'index.html' })
        cy.clickModalAction()
        cy.getCy('dt-editor_file-tree_file').contains('index.html').should('exist')
    })

    it('create folder and file', () => {
        editor.addFolder()
        cy.fillFields({ 'folder-name': 'src' })
        cy.clickModalAction()
        cy.getCy('dt-editor_file-tree_folder').contains('src').click()
        
        editor.addFile()
        cy.fillFields({ 'file-name': 'index.html' })
        cy.clickModalAction()
        cy.getCy('dt-editor_file-tree_file').contains('index.html').should('exist')
    })

    it('delete file', () => {
        cy.getCy('dt-editor_file-tree_file').contains('default.css').click()
        cy.getCy('dt-editor_file-tree_delete').click()
        cy.clickModalAction()
        cy.getCy('dt-editor_file-tree_file').contains('default.css').should('not.exist')
    })

    it('upload image asset', () => {
        editor.addAsset()
        cy.get('.dropzone').selectFile('cypress/fixtures/dt-editor/image.svg', {
            action: 'drag-drop'
        })
        cy.clickModalAction()
        cy.getCy('dt-editor_file-tree_asset').contains('image.svg').click()
        cy.get('.DocumentTemplateEditor__Asset--Image').should('exist')
    })

    it('upload docx asset', () => {
        editor.addAsset()
        cy.get('.dropzone').selectFile('cypress/fixtures/dt-editor/document.docx', {
            action: 'drag-drop'
        })
        cy.clickModalAction()
        cy.getCy('dt-editor_file-tree_asset').contains('document.docx').click()
        cy.get('.DocumentTemplateEditor__Asset--Other').should('exist')
    })
})
