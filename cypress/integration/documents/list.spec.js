import * as project from '../../support/project-helpers'


describe('Document List', () => {
    const questionnaireName = 'Documents test'
    const kmId = 'test-km-1'
    const packageId = 'dsw:test-km-1:1.0.0'
    const templateId = 'dsw:questionnaire-report:1.4.0'
    const formatUuid = 'd3e98eb6-344d-481f-8e37-6a67b6cd1ad2'

    before(() => {
        cy.task('questionnaire:delete')
        cy.task('package:delete', { km_id: kmId })
        cy.removeTemplate(templateId)
        cy.clearServerCache()

        cy.importKM('test-km-1')
        cy.importTemplate('templates/questionnaire-report.zip')
        
        const questionnaire = {
            visibility: project.Private,
            name: questionnaireName,
            sharing: project.Restricted,
            packageId
        }
        
        cy.createQuestionnaire(questionnaire).then((resp) => {
            const questionnaireUuid = resp.body.uuid
            const documents = []
            for (let i = 1; i <= 40; i++) {
                documents.push({
                    name: `Document ${('0' + i).slice(-2)}`,
                    formatUuid,
                    templateId,
                    questionnaireUuid
                })
            }
            cy.createDocuments(documents)
        })
    })

    beforeEach(() => {
        cy.loginAs('admin')
        cy.visitApp('/documents')
    })

    it('default sort', () => {
        cy.getCy('documents_state-badge').should('not.exist')
        
        cy.getCy('listing_item').contains('Document 40').should('exist')
        cy.getCy('listing_item').contains('Document 32').should('exist')
        cy.getCy('listing_item').contains('Document 21').should('exist')
        cy.getCy('listing_item').contains('Document 20').should('not.exist')
        cy.getCy('listing_item').contains('Document 06').should('not.exist')

        cy.getCy('listing_page-link_next').click()
        cy.getCy('listing_item').contains('Document 32').should('not.exist')
        cy.getCy('listing_item').contains('Document 21').should('not.exist')
        cy.getCy('listing_item').contains('Document 20').should('exist')
        cy.getCy('listing_item').contains('Document 14').should('exist')
        cy.getCy('listing_item').contains('Document 01').should('exist')
    })

    it('reverse sort', () => {
        cy.getCy('documents_state-badge').should('not.exist')
        cy.getCy('listing_toolbar_sort-direction').click()

        cy.getCy('listing_item').contains('Document 01').should('exist')
        cy.getCy('listing_item').contains('Document 14').should('exist')
        cy.getCy('listing_item').contains('Document 20').should('exist')
        cy.getCy('listing_item').contains('Document 21').should('not.exist')
        cy.getCy('listing_item').contains('Document 32').should('not.exist')

        cy.getCy('listing_page-link_next').click()
        cy.getCy('listing_item').contains('Document 06').should('not.exist')
        cy.getCy('listing_item').contains('Document 20').should('not.exist')
        cy.getCy('listing_item').contains('Document 21').should('exist')
        cy.getCy('listing_item').contains('Document 32').should('exist')
        cy.getCy('listing_item').contains('Document 40').should('exist')
    })

    it('filter', () => {
        cy.getCy('documents_state-badge').should('not.exist')
        cy.fillFields({ filter: '4' })
        cy.getCy('listing_page-link').should('not.exist')
        
        cy.getCy('listing_item').contains('Document 04').should('exist')
        cy.getCy('listing_item').contains('Document 14').should('exist')
        cy.getCy('listing_item').contains('Document 24').should('exist')
        cy.getCy('listing_item').contains('Document 34').should('exist')
        cy.getCy('listing_item').contains('Document 40').should('exist')
    })
})
