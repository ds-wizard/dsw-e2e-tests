import * as editor from '../../../support/dt-editor-helpers'
import { dataCy } from '../../../support/utils'

describe('Document Template Editor / Editor / Template', () => {
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
        cy.get('.file-tree').should('exist')
        cy.getCy('dt-editor_nav_settings').click()
    })

    it('simple edit', () => {
        const name = 'My New Template'
        const description = 'This is my new template'
        const readme = '# My New Template\n\nThis is my new template.'

        // change fields and save
        cy.fillFields({
            name,
            description,
            readme
        })
        editor.save()

        // reopen and check fields
        cy.visitApp('/document-template-editors/dsw:questionnaire-report:1.5.0')
        cy.getCy('dt-editor_nav_settings').click()
        cy.checkFields({
            name,
            description,
            readme
        })
    })

    it('change template id', () => {
        const templateId = 'my-template'
        cy.fillFields({ templateId })
        editor.save()

        cy.url().should('contain', `/document-template-editors/dsw:${templateId}:1.5.0`)
    })

    it('change version', () => {
        cy.fillFields({ 
            'version-major': '2',
            'version-minor': '4',
            'version-patch': '8' })
            editor.save()

        cy.url().should('contain', `/document-template-editors/dsw:questionnaire-report:2.4.8`)
    })

    it('add format', () => {
        cy.getCy('dt_template-nav_formats').click()
        cy.get(`.DocumentTemplateEditor__MetadataEditor__Content > div > .form-group > ${dataCy('form-group_list_add-button')}`).click()

        cy.fillFields({
            'formats\\.7\\.name': 'My Format',
            'formats\\.7\\.icon': 'fas fa-home'
        })

        editor.save()

        cy.getCy('dt-editor_nav_preview').click()
        cy.get(`#format option`).contains('My Format').should('exist')
    })
})
