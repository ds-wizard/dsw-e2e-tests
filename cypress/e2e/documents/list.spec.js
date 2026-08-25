import * as project from '../../support/project-helpers'


describe('Document List', () => {
    const projectName = 'Documents test'
    const kmId = 'test-km-1'
    const documentTemplateId = 'questionnaire-report'
    const formatUuid = 'd3e98eb6-344d-481f-8e37-6a67b6cd1ad2'

    before(() => {
        // the tests check the whole document listing, so all documents left by other
        // specs have to go, not just the ones belonging to the template used here
        cy.task('document:delete')
        cy.task('project:delete')
        cy.task('knowledgeModelPackage:delete', { km_id: kmId })
        cy.task('documentTemplate:delete', { template_id: documentTemplateId })
        cy.clearServerCache()

        cy.importKM('test-km-1', (knowledgeModelPackageUuid) => {
            cy.importTemplate('templates/questionnaire-report.zip').then(documentTemplateUuid => {
                const projectData = {
                    visibility: project.Private,
                    name: projectName,
                    sharing: project.Restricted,
                    knowledgeModelPackageUuid
                }

                cy.createProject(projectData).then((resp) => {
                    const projectUuid = resp.body.uuid
                    const documents = []
                    for (let i = 1; i <= 40; i++) {
                        documents.push({
                            name: `Document ${('0' + i).slice(-2)}`,
                            formatUuid,
                            documentTemplateUuid,
                            projectUuid
                        })
                    }
                    cy.createDocuments(documents)
                })
            })
        })
    })

    beforeEach(() => {
        cy.loginAs('admin')
        cy.visitApp('/project-documents')
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
