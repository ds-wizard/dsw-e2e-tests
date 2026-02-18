import * as dtEditor from '../../../support/dt-editor-helpers'


describe('Document Template Editor / Editor / Publish', () => {
    before(() => {
        cy.putDefaultAppConfig()
        cy.clearServerCache()
    })

    beforeEach(() => {
        // prepare base document template
        cy.task('documentTemplate:delete')
        cy.importTemplate('templates/questionnaire-report.zip')
    })

    it('publish', () => {
        cy.loginAs('datasteward')
        dtEditor
            .createEditor('dsw:questionnaire-report:1.4.0', 'dsw:questionnaire-report:1.5.0')
            .then((documentTemplateUuid) => {
                cy.url().should('contain', `/document-template-editors/${documentTemplateUuid}`)
                cy.getCy('dt-editor_publish').click()
                cy.clickModalAction()
                cy.url().should('contain', `/document-templates/${documentTemplateUuid}`)
            })

        cy.visitApp('/document-templates')
        cy.getListingItem('dsw:questionnaire-report:1.5.0').should('contain', 'Questionnaire Report')
    })
})
