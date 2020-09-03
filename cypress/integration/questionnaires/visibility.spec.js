import * as questionnaire from '../../support/questionnaire-helpers'


describe('Questionnaires Visibility', () => {
    const questionnaireName = 'My Visibility Questionnaire'
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
    })

    const expectSeeAndFill = () => {
        cy.clickListingItemAction(questionnaireName, 'Fill questionnaire')
        cy.url().should('contain', '/questionnaires/detail/')
        cy.get('.questionnaire__form .form-group input[type=text]').should('not.be', 'disabled')
    }

    const expectCannotSee = () => {
        cy.expectEmptyListing()
    }

    const expectReadOnly = () => {
        cy.clickListingItemAction(questionnaireName, 'View questionnaire')
        cy.url().should('contain', '/questionnaires/detail/')
        cy.get('.questionnaire__form .form-group input[type=text]').should('be', 'disabled')
    }

    const testCases = [{
        creator: 'researcher',
        viewer: 'researcher',
        visibility: questionnaire.VisibleEdit,
        expectResult: expectSeeAndFill
    }, {
        creator: 'researcher',
        viewer: 'researcher',
        visibility: questionnaire.Private,
        expectResult: expectSeeAndFill
    }, {
        creator: 'researcher',
        viewer: 'researcher',
        visibility: questionnaire.VisibleView,
        expectResult: expectSeeAndFill
    }, {
        creator: 'researcher',
        viewer: 'datasteward',
        visibility: questionnaire.VisibleEdit,
        expectResult: expectSeeAndFill
    }, {
        creator: 'researcher',
        viewer: 'datasteward',
        visibility: questionnaire.Private,
        expectResult: expectCannotSee
    }, {
        creator: 'researcher',
        viewer: 'datasteward',
        visibility: questionnaire.VisibleView,
        expectResult: expectReadOnly
    }, {
        creator: 'researcher',
        viewer: 'admin',
        visibility: questionnaire.VisibleEdit,
        expectResult: expectSeeAndFill
    }, {
        creator: 'researcher',
        viewer: 'admin',
        visibility: questionnaire.Private,
        expectResult: expectSeeAndFill
    }, {
        creator: 'researcher',
        viewer: 'admin',
        visibility: questionnaire.VisibleView,
        expectResult: expectSeeAndFill
    }]

    testCases.forEach(({ creator, viewer, visibility, expectResult }) => {
        it(`works for ${visibility} created by ${creator} and viewed by ${viewer}`, () => {
            cy.loginAs(creator)
            cy.visitApp('/questionnaires/create')

            if (visibility !== questionnaire.Private) {
                cy.checkToggle('visibilityEnabled')
                cy.fillFields({
                    s_visibilityPermission: visibility === questionnaire.VisibleView ? 'view' : 'edit'
                })
            }

            cy.fillFields({
                name: questionnaireName,
                s_packageId: packageId
            })
            cy.clickBtn('Save')
            cy.url().should('include', '/questionnaires/detail')

            cy.logout()

            cy.loginAs(viewer)
            cy.visitApp('/questionnaires')
            expectResult()
        })
    })
})
