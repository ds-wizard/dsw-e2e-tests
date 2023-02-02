import * as editor from '../../../support/dt-editor-helpers'

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
        cy.visitApp('/document-template-editors/create?selected=dsw:questionnaire-report:1.4.0&edit=true')
        cy.submitForm()
        cy.url().should('contain', '/document-template-editors/dsw:questionnaire-report:1.5.0')
        cy.getCy('dt-editor_publish').click()
        cy.clickModalAction()
        cy.url().should('contain', '/document-templates/dsw:questionnaire-report:1.5.0')

        cy.visitApp('/document-templates')
        cy.getListingItem('dsw:questionnaire-report:1.5.0').should('contain', 'Questionnaire Report')
    })
})
