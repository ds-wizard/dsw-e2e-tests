import * as dtEditor from '../../../support/dt-editor-helpers'

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
        dtEditor.createEditor('dsw:questionnaire-report:1.4.0', 'dsw:questionnaire-report:1.5.0')
        cy.getCy('dt-editor_nav_files').click()
    })

    it('create file simple', () => {
        dtEditor.addFile()
        cy.fillFields({ 'file-name': 'index.html' })
        cy.clickModalAction()
        cy.getCy('dt-editor_file-tree_file').contains('index.html').should('exist')
    })

    it('create folder and file', () => {
        dtEditor.addFolder()
        cy.fillFields({ 'folder-name': 'src' })
        cy.clickModalAction()
        cy.getCy('dt-editor_file-tree_folder').contains('src').click()
        
        dtEditor.addFile()
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

    it('rename file', () => {
        cy.getCy('dt-editor_file-tree_file').contains('default.css').click()
        cy.getCy('dt-editor_file-tree_rename').click()
        cy.fillFields( { 'new-file-name': 'main.css' })
        cy.clickModalAction()
        cy.getCy('dt-editor_file-tree_file').contains('default.css').should('not.exist')
        cy.getCy('dt-editor_file-tree_file').contains('main.css').should('exist')
    })

    it('rename folder', () => {
        // create file and folder
        dtEditor.addFolder()
        cy.fillFields({ 'folder-name': 'src' })
        cy.clickModalAction()
        cy.getCy('dt-editor_file-tree_folder').contains('src').click()
        dtEditor.addFile()
        cy.fillFields({ 'file-name': 'index.html' })
        cy.clickModalAction()

        // rename folder
        cy.getCy('dt-editor_file-tree_folder').contains('src').click()
        cy.getCy('dt-editor_file-tree_rename').click()
        cy.fillFields( { 'new-file-name': 'scripts' })
        cy.clickModalAction()

        // check that the folder was renamed
        cy.getCy('dt-editor_file-tree_folder').contains('src').should('not.exist')
        cy.getCy('dt-editor_file-tree_folder').contains('scripts').should('exist')
    })

    it('move file', () => {
        // create a folder
        dtEditor.addFolder()
        cy.fillFields({ 'folder-name': 'src' })
        cy.clickModalAction()

        // move file to the folder
        cy.getCy('dt-editor_file-tree_file').contains('default.css').click()
        cy.getCy('dt-editor_file-tree_move').click()
        cy.get('.move-modal-tree').contains('src').click()
        cy.clickModalAction()

        // check that file is still visible
        cy.getCy('dt-editor_file-tree_file').contains('default.css').should('exist')
        
        // collapse the folder and check that the file is no longer visible
        cy.getCy('dt-editor_file-tree_folder').contains('src').closest('a').prev().click()
        cy.getCy('dt-editor_file-tree_file').contains('default.css').should('not.exist')
    })

    it('move folder', () => {
        // create a folder
        dtEditor.addFolder()
        cy.fillFields({ 'folder-name': 'src' })
        cy.clickModalAction()

        // create another folder
        cy.getCy('dt-editor_file-tree_folder').contains('Questionnaire Report').click()
        dtEditor.addFolder()
        cy.fillFields({ 'folder-name': 'css' })
        cy.clickModalAction()

        // move file to the second folder
        cy.getCy('dt-editor_file-tree_file').contains('default.css').click()
        cy.getCy('dt-editor_file-tree_move').click()
        cy.get('.move-modal-tree').contains('css').click()
        cy.clickModalAction()

        // move the second folder to the first
        cy.getCy('dt-editor_file-tree_folder').contains('css').click()
        cy.getCy('dt-editor_file-tree_move').click()
        cy.get('.move-modal-tree').contains('src').click()
        cy.clickModalAction()

        // check that both, the file and the folder are visible
        cy.getCy('dt-editor_file-tree_file').contains('default.css').should('exist')
        cy.getCy('dt-editor_file-tree_folder').contains('css').should('exist')

        // collapse the folder and check that the file and the folder are no longer visible
        cy.getCy('dt-editor_file-tree_folder').contains('src').closest('a').prev().click()
        cy.getCy('dt-editor_file-tree_file').contains('default.css').should('not.exist')
        cy.getCy('dt-editor_file-tree_folder').contains('css').should('not.exist')
    })

    it('upload image asset', () => {
        dtEditor.addAsset()
        cy.get('.dropzone').selectFile('cypress/fixtures/dt-editor/image.svg', {
            action: 'drag-drop'
        })
        cy.clickModalAction()
        cy.getCy('dt-editor_file-tree_asset').contains('image.svg').click()
        cy.get('.DocumentTemplateEditor__Asset--Image').should('exist')
    })

    it('upload docx asset', () => {
        dtEditor.addAsset()
        cy.get('.dropzone').selectFile('cypress/fixtures/dt-editor/document.docx', {
            action: 'drag-drop'
        })
        cy.clickModalAction()
        cy.getCy('dt-editor_file-tree_asset').contains('document.docx').click()
        cy.get('.DocumentTemplateEditor__Asset--Other').should('exist')
    })

    it('upload MD file', () => {
        dtEditor.addAsset()
        cy.get('.dropzone').selectFile('cypress/fixtures/dt-editor/readme.md', {
            action: 'drag-drop'
        })
        cy.clickModalAction()
        cy.getCy('dt-editor_file-tree_file').contains('readme.md').click()
        cy.get('code-editor').should('exist')
    })
})
