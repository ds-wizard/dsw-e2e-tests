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
            visibility: questionnaire.VisibleView,
            sharing: questionnaire.Restricted,
            name: questionnaireName,
            packageId
        })
        cy.loginAs('researcher')
        questionnaire.open(questionnaireName)
    })

    it('create document', () => {
        questionnaire.selectAnswer('Answer 1.1')
        questionnaire.typeAnswer('Value Question String', 'Some string')
        questionnaire.awaitSave()

        cy.get('.questionnaire-header__actions .link-with-icon').contains('Create Document').click()
        cy.url().should('contain', '/documents/create/')

        cy.get('.indication-table .indication').contains('Answered (current phase): 0/0')
        cy.get('.indication-table .indication').contains('Answered: 2/7')
    })

    it('edit', () => {
        cy.get('.questionnaire-header__actions .dropdown-toggle').contains('More').click()
        cy.get('.questionnaire-header__actions .dropdown-item').contains('Edit').click()
        cy.url().should('contain', '/questionnaires/edit')
    })

    it('view documents', () => {
        cy.get('.questionnaire-header__actions .dropdown-toggle').contains('More').click()
        cy.get('.questionnaire-header__actions .dropdown-item').contains('View Documents').click()
        cy.url().should('contain', '/documents?questionnaireUuid=')
        cy.get('.listing-toolbar .questionnaire-name').should('contain', questionnaireName)
    })

    it('clone', () => {
        cy.get('.questionnaire-header__actions .dropdown-toggle').contains('More').click()
        cy.get('.questionnaire-header__actions .dropdown-item').contains('Clone').click()
        cy.get('.btn-primary').contains('Clone').click()
        cy.get('.questionnaire-header__title').should('contain', `Copy of ${questionnaireName}`)
    })

    it('create migration', () => {
        cy.get('.questionnaire-header__actions .dropdown-toggle').contains('More').click()
        cy.get('.questionnaire-header__actions .dropdown-item').contains('Create Migration').click()
        cy.url().should('contain', '/questionnaires/create-migration/')
    })

    it('delete', () => {
        cy.get('.questionnaire-header__actions .dropdown-toggle').contains('More').click()
        cy.get('.questionnaire-header__actions .dropdown-item').contains('Delete').click()
        cy.get('.btn-danger').contains('Delete').click()
        cy.url().should('match', /\/questionnaires$/)
        cy.get('.full-page-illustrated-message').should('contain', 'No data')
    })
})
