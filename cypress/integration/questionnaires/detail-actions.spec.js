import * as questionnaire from '../../support/questionnaire-helpers'

describe('Questionnaire detail actions', () => {
    const questionnaireName = 'Test Questionnaire'
    const kmId = 'basic-questionnaire-test-km'
    const packageId = 'dsw:basic-questionnaire-test-km:1.0.0'

    before(() => {
        cy.task('mongo:delete', {
            collection: 'packages',
            args: { kmId }
        })
        cy.fixture(kmId).then((km) => {
            cy.importKM(km)
        })
    })

    beforeEach(() => {
        cy.task('mongo:delete', {
            collection: 'questionnaires',
            args: {}
        })
        cy.createQuestionnaire({
            visibility: questionnaire.PublicReadOnly,
            name: questionnaireName,
            packageId
        })
        cy.loginAs('researcher')
        cy.visitApp('/questionnaires')
        cy.clickListingItemAction(questionnaireName, 'Fill questionnaire')
        cy.get('.top-header').should('exist')
    })

    it('close', () => {
        cy.get('.top-header-actions .link-with-icon').contains('Close').click()
        cy.url().should('match', /\/questionnaires$/)
    })

    it('create document', () => {
        questionnaire.selectAnswer('Answer 1.1')
        questionnaire.typeAnswer('Value Question String', 'Some string')
        cy.clickBtn('Save')

        cy.get('.top-header-actions .link-with-icon').contains('Create Document').click()
        cy.url().should('contain', '/documents/create?selected=')

        cy.get('.indication-table .indication').contains('Answered (current phase): 0/0')
        cy.get('.indication-table .indication').contains('Answered: 2/7')
    })

    it('edit', () => {
        cy.get('.top-header-actions .dropdown-toggle').contains('More').click()
        cy.get('.top-header-actions .dropdown-item').contains('Edit').click()
        cy.url().should('contain', '/questionnaires/edit')
    })

    it('view documents', () => {
        cy.get('.top-header-actions .dropdown-toggle').contains('More').click()
        cy.get('.top-header-actions .dropdown-item').contains('View Documents').click()
        cy.url().should('contain', '/documents?questionnaireUuid=')
        cy.get('.listing-toolbar .questionnaire-name').should('contain', questionnaireName)
    })

    it('clone', () => {
        cy.get('.top-header-actions .dropdown-toggle').contains('More').click()
        cy.get('.top-header-actions .dropdown-item').contains('Clone').click()
        cy.get('.top-header-title').should('contain', `Copy of ${questionnaireName}`)
    })

    it('create migration', () => {
        cy.get('.top-header-actions .dropdown-toggle').contains('More').click()
        cy.get('.top-header-actions .dropdown-item').contains('Create Migration').click()
        cy.url().should('contain', '/questionnaires/create-migration/')
    })

    it('delete', () => {
        cy.get('.top-header-actions .dropdown-toggle').contains('More').click()
        cy.get('.top-header-actions .dropdown-item').contains('Delete').click()
        cy.get('.btn-danger').contains('Delete').click()
        cy.url().should('match', /\/questionnaires$/)
        cy.get('.full-page-illustrated-message').should('contain', 'No data')
    })
})
