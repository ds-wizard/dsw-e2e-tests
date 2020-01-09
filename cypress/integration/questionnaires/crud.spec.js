import * as q from '../../support/questionnaire-helpers'

describe('Questionnaires CRUD', () => {
    const questionnaireName = 'Test Questionnaire'
    const otherQuestionnaireName = 'Original Test Questionnaire'
    const kmId = 'test-km-1'
    const packageId = 'dsw:test-km-1:1.0.0'


    before(() => {
        cy.task('mongo:delete', {
            collection: 'packages',
            args: { kmId }
        })
        cy.fixture('test-km-1').then((km) => {
            cy.importKM(km)
        })
    })


    beforeEach(() => {
        cy.task('mongo:delete', {
            collection: 'questionnaires',
            args: {}
        })

        cy.loginAs('researcher')
    })


    it('create questionnaire', () => {
        const questionnaire = {
            name: questionnaireName,
            s_packageId: packageId
        }

        cy.visitApp('/questionnaires')

        cy.clickBtn('Create')
        cy.fillFields(questionnaire)
        cy.clickBtn('Save')
        cy.url().should('contain', '/questionnaires/detail/')

        cy.visitApp('/questionnaires')
        cy.getListingItem(questionnaireName).should('contain', packageId)
    })


    it('update questionnaire', () => {
        const questionnaire = {
            accessibility: q.PublicReadOnly,
            name: otherQuestionnaireName,
            packageId
        }
        cy.createQuestionnaire(questionnaire)
        cy.visitApp('/questionnaires')

        cy.clickListingItemAction(questionnaire.name, 'Edit')
        cy.fillFields({ name: questionnaireName })
        cy.clickBtn('Save')

        cy.url().should('contain', '/questionnaires')
        cy.expectListingItemNotExist(questionnaire.name)
        cy.getListingItem(questionnaireName).should('contain', packageId)
    })


    it('delete questionnaire', () => {
        const questionnaire = {
            accessibility: q.PublicReadOnly,
            name: questionnaireName,
            packageId
        }
        cy.createQuestionnaire(questionnaire)
        cy.visitApp('/questionnaires')

        cy.clickListingItemAction(questionnaire.name, 'Delete')
        cy.get('.modal-title').should('be.visible').and('contain', 'Delete questionnaire')
        cy.clickBtn('Delete')

        cy.expectEmptyListing(questionnaire.name)
        cy.expectAlert('success', 'Questionnaire was successfully deleted.')
    })
})
