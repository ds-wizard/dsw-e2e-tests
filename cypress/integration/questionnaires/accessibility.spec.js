describe('Questionnaires Accessibility', () => {
    const questionnaireName = 'My Accessibility Questionnaire'
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
        cy.get('.form-engine-form .form-group input[type=text]').should('not.be', 'disabled')
    }

    const expectCannotSee = () => {
        cy.expectEmptyListing()
    }

    const expectReadOnly = () => {
        cy.clickListingItemAction(questionnaireName, 'View questionnaire')
        cy.url().should('contain', '/questionnaires/detail/')
        cy.get('.form-engine-form .form-group input[type=text]').should('be', 'disabled')
    }

    const testCases = [{
        creator: 'researcher',
        viewer: 'researcher',
        visibility: 'PublicQuestionnaire',
        badge: 'public',
        expectResult: expectSeeAndFill
    }, {
        creator: 'researcher',
        viewer: 'researcher',
        visibility: 'PrivateQuestionnaire',
        badge: 'private',
        expectResult: expectSeeAndFill
    }, {
        creator: 'researcher',
        viewer: 'researcher',
        visibility: 'PublicReadOnlyQuestionnaire',
        badge: 'read-only',
        expectResult: expectSeeAndFill
    }, {
        creator: 'researcher',
        viewer: 'datasteward',
        visibility: 'PublicQuestionnaire',
        badge: 'public',
        expectResult: expectSeeAndFill
    }, {
        creator: 'researcher',
        viewer: 'datasteward',
        visibility: 'PrivateQuestionnaire',
        badge: 'private',
        expectResult: expectCannotSee
    }, {
        creator: 'researcher',
        viewer: 'datasteward',
        visibility: 'PublicReadOnlyQuestionnaire',
        badge: 'read-only',
        expectResult: expectReadOnly
    }, {
        creator: 'researcher',
        viewer: 'admin',
        visibility: 'PublicQuestionnaire',
        badge: 'public',
        expectResult: expectSeeAndFill
    }, {
        creator: 'researcher',
        viewer: 'admin',
        visibility: 'PrivateQuestionnaire',
        badge: 'private',
        expectResult: expectSeeAndFill
    }, {
        creator: 'researcher',
        viewer: 'admin',
        visibility: 'PublicReadOnlyQuestionnaire',
        badge: 'read-only',
        expectResult: expectSeeAndFill
    }]

    testCases.forEach(({ creator, viewer, visibility, badge, expectResult }) => {
        it(`works for ${visibility} created by ${creator} and viewd by ${viewer}`, () => {
            cy.loginAs(creator)
            cy.visitApp('/questionnaires/create')

            const questionnaire = {
                name: questionnaireName,
                s_packageId: packageId
            }
            cy.get(`#${visibility}`).check()
            cy.fillFields(questionnaire)
            cy.clickBtn('Save')
            cy.url().should('include', '/questionnaires/detail')

            cy.visitApp('/questionnaires')
            cy.getListingItem(questionnaireName).get('.badge').should('contain', badge)

            cy.logout()

            cy.loginAs(viewer)
            cy.visitApp('/questionnaires')
            expectResult()
        })
    })
})
