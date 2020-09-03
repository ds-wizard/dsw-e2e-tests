import * as questionnaire from '../../support/questionnaire-helpers'


describe('Questionnaires Sharing', () => {
    const questionnaireName = 'My Shared Questionnaire'
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


    const expectUserCannotSee = () => {
        cy.expectError()
    }

    const expectAnonCannotSee = () => {
        cy.url().should('contain', '/?originalUrl=')
    }

    const expectView = () => {
        cy.url().should('contain', '/questionnaires/detail/')
        cy.get('.questionnaire__form .form-group input[type=text]').should('be.disabled')
        cy.get('.questionnaire__panel__phase select').should('be.disabled')
    }

    const expectEdit = () => {
        cy.url().should('contain', '/questionnaires/detail/')
        cy.get('.questionnaire__form .form-group input[type=text]').should('not.be.disabled')
        cy.get('.questionnaire__panel__phase select').should('not.be.disabled')
    }

    const testCases = [{
        visibility: questionnaire.Private,
        sharing: questionnaire.Restricted,
        expectUser: expectUserCannotSee,
        expectAnon: expectAnonCannotSee
    }, {
        visibility: questionnaire.Private,
        sharing: questionnaire.AnyoneWithLinkView,
        expectUser: expectView,
        expectAnon: expectView
    }, {
        visibility: questionnaire.Private,
        sharing: questionnaire.AnyoneWithLinkEdit,
        expectUser: expectEdit,
        expectAnon: expectEdit
    }, {
        visibility: questionnaire.VisibleView,
        sharing: questionnaire.Restricted,
        expectUser: expectView,
        expectAnon: expectAnonCannotSee
    }, {
        visibility: questionnaire.VisibleView,
        sharing: questionnaire.AnyoneWithLinkView,
        expectUser: expectView,
        expectAnon: expectView
    }, {
        visibility: questionnaire.VisibleEdit,
        sharing: questionnaire.Restricted,
        expectUser: expectEdit,
        expectAnon: expectAnonCannotSee
    }, {
        visibility: questionnaire.VisibleEdit,
        sharing: questionnaire.AnyoneWithLinkView,
        expectUser: expectEdit,
        expectAnon: expectView
    }, {
        visibility: questionnaire.VisibleEdit,
        sharing: questionnaire.AnyoneWithLinkEdit,
        expectUser: expectEdit,
        expectAnon: expectEdit
    }]

    testCases.forEach(({ visibility, sharing, expectUser, expectAnon}) => {
        it(`works for ${visibility} and ${sharing}`, () => {
            cy.loginAs('researcher')
            cy.visitApp('/questionnaires/create')

            // Create questionnaire -- set visibility
            console.log(visibility, questionnaire.Private, visibility !== questionnaire.Private)
            if (visibility !== questionnaire.Private) {
                cy.checkToggle('visibilityEnabled')
                cy.fillFields({
                    s_visibilityPermission: visibility === questionnaire.VisibleView ? 'view' : 'edit'
                })
            }

            // Create questionnaire -- set sharing
            if (sharing !== questionnaire.Restricted) {
                cy.checkToggle('sharingEnabled')
                cy.fillFields({
                    s_sharingPermission: sharing === questionnaire.AnyoneWithLinkView ? 'view' : 'edit'
                })
            }

            // Create questionnaire -- fill data and save
            cy.fillFields({
                name: questionnaireName,
                s_packageId: packageId
            })
            cy.clickBtn('Save')
            cy.url().should('include', '/questionnaires/detail')
            cy.url().then(url => {
                const questionnaireId = url.split('/').pop()
                cy.logout()

                // Test user access
                cy.loginAs('datasteward')
                cy.visitApp(`/questionnaires/detail/${questionnaireId}`)
                expectUser()

                cy.logout()
                cy.visitApp(`/questionnaires/detail/${questionnaireId}`)
            })

        })
    })
})