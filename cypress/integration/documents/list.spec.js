import * as q from '../../support/questionnaire-helpers'


describe('Document List', () => {
    const questionnaireName = 'Documents test'
    const kmId = 'test-km-1'
    const packageId = 'dsw:test-km-1:1.0.0'
    const templateUuid = '43a3fdd1-8535-42e0-81a7-5edbff296e65'
    const formatUuid = 'd3e98eb6-344d-481f-8e37-6a67b6cd1ad2'

    before(() => {
        cy.task('mongo:delete', {
            collection: 'packages',
            args: { kmId }
        })

        cy.fixture('test-km-1').then((km) => {
            cy.importKM(km)
        })

        cy.task('mongo:delete', { collection: 'documents' })
        cy.task('mongo:delete', { collection: 'documentFs' })
        cy.task('mongo:delete', { collection: 'questionnaires' })
        
        const questionnaire = {
            visibility: q.Private,
            name: questionnaireName,
            packageId
        }
        
        cy.createQuestionnaire(questionnaire).then((resp) => {
            const questionnaireUuid = resp.body.uuid
            const documents = []
            for (let i = 1; i <= 40; i++) {
                documents.push({
                    name: `Document ${('0' + i).slice(-2)}`,
                    formatUuid,
                    templateUuid,
                    questionnaireUuid
                })
            }
            cy.createDocuments(documents)
        })
    })

    beforeEach(() => {
        cy.loginAs('researcher')
        cy.visitApp('/documents')
    })

    it('default sort', () => {
        cy.get('.badge').should('not.exist')

        cy.get('.list-group-item').contains('Document 01').should('exist')
        cy.get('.list-group-item').contains('Document 14').should('exist')
        cy.get('.list-group-item').contains('Document 20').should('exist')
        cy.get('.list-group-item').contains('Document 21').should('not.exist')
        cy.get('.list-group-item').contains('Document 32').should('not.exist')

        cy.get('.page-link').contains('Next').click()
        cy.get('.list-group-item').contains('Document 06').should('not.exist')
        cy.get('.list-group-item').contains('Document 20').should('not.exist')
        cy.get('.list-group-item').contains('Document 21').should('exist')
        cy.get('.list-group-item').contains('Document 32').should('exist')
        cy.get('.list-group-item').contains('Document 40').should('exist')
    })

    it('reverse sort', () => {
        cy.get('.badge').should('not.exist')
        cy.getCy('sort-direction').click()
        
        cy.get('.list-group-item').contains('Document 40').should('exist')
        cy.get('.list-group-item').contains('Document 32').should('exist')
        cy.get('.list-group-item').contains('Document 21').should('exist')
        cy.get('.list-group-item').contains('Document 20').should('not.exist')
        cy.get('.list-group-item').contains('Document 06').should('not.exist')

        cy.get('.page-link').contains('Next').click()
        cy.get('.list-group-item').contains('Document 32').should('not.exist')
        cy.get('.list-group-item').contains('Document 21').should('not.exist')
        cy.get('.list-group-item').contains('Document 20').should('exist')
        cy.get('.list-group-item').contains('Document 14').should('exist')
        cy.get('.list-group-item').contains('Document 01').should('exist')
    })

    it('filter', () => {
        cy.get('.badge').should('not.exist')
        cy.fillFields({ filter: '4' })
        cy.get('.page-link').should('not.exist')
        
        cy.get('.list-group-item').contains('Document 04').should('exist')
        cy.get('.list-group-item').contains('Document 14').should('exist')
        cy.get('.list-group-item').contains('Document 24').should('exist')
        cy.get('.list-group-item').contains('Document 34').should('exist')
        cy.get('.list-group-item').contains('Document 40').should('exist')
    })
})
