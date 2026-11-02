describe('Non-editable Document Template', () => {
    const templateId = 'questionnaire-report'
    const templateName = 'Questionnaire Report'
    let documentTemplateUuid

    before(() => {
        // all versions have to go, an editable one left behind by another spec
        // would be listed under the same name
        cy.task('documentTemplate:delete', { template_id: templateId })
        cy.clearServerCache()

        cy.importTemplate('templates/questionnaire-report.zip')
            .then(uuid => {
                documentTemplateUuid = uuid
            })
            .then(() => {
                cy.task('documentTemplate:setNonEditable', { uuid: documentTemplateUuid })
            })
    })

    beforeEach(() => {
        cy.loginAs('datasteward')
    })

    it('list view', () => {
        cy.visitApp('/document-templates')
        cy.get('.badge').contains('non-editable').should('exist')

        cy.expectListingItemAction(templateName, 'export', false)
        cy.expectListingItemAction(templateName, 'create-editor', false)
    })

    it('detail', () => {
        cy.visitApp(`/document-templates/${documentTemplateUuid}`)
        cy.get('.badge').contains('non-editable').should('exist')

        cy.expectDropdownAction('export', false)
        cy.expectDropdownAction('create-editor', false)
    })

    it('cannot create editor manually', () => {
        cy.visitApp(`/document-template-editors/create?selected=${documentTemplateUuid}&edit=true`)
        cy.submitForm()
        cy.getCy('flash_alert-danger').should('exist')
    })
})
