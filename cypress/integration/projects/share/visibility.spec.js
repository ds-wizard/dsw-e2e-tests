import * as project from '../../../support/project-helpers'


describe('Project Visibility', () => {
    const projectName = 'My Visibility Questionnaire'
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
        project.open(projectName)
        cy.get('.questionnaire__form .form-group input[type=text]').should('not.be', 'disabled')
    }

    const expectCannotSee = () => {
        cy.expectEmptyListing()
    }

    const expectReadOnly = () => {
        project.open(projectName)
        cy.get('.questionnaire__form .form-group input[type=text]').should('be', 'disabled')
    }

    const testCases = [{
        creator: 'researcher',
        viewer: 'researcher',
        visibility: project.VisibleEdit,
        expectResult: expectSeeAndFill
    }, {
        creator: 'researcher',
        viewer: 'researcher',
        visibility: project.Private,
        expectResult: expectSeeAndFill
    }, {
        creator: 'researcher',
        viewer: 'researcher',
        visibility: project.VisibleView,
        expectResult: expectSeeAndFill
    }, {
        creator: 'researcher',
        viewer: 'datasteward',
        visibility: project.VisibleEdit,
        expectResult: expectSeeAndFill
    }, {
        creator: 'researcher',
        viewer: 'datasteward',
        visibility: project.Private,
        expectResult: expectCannotSee
    }, {
        creator: 'researcher',
        viewer: 'datasteward',
        visibility: project.VisibleView,
        expectResult: expectReadOnly
    }, {
        creator: 'researcher',
        viewer: 'admin',
        visibility: project.VisibleEdit,
        expectResult: expectSeeAndFill
    }, {
        creator: 'researcher',
        viewer: 'admin',
        visibility: project.Private,
        expectResult: expectSeeAndFill
    }, {
        creator: 'researcher',
        viewer: 'admin',
        visibility: project.VisibleView,
        expectResult: expectSeeAndFill
    }]

    testCases.forEach(({ creator, viewer, visibility, expectResult }) => {
        it(`works for ${visibility} created by ${creator} and viewed by ${viewer}`, () => {
            cy.loginAs(creator)

            // Create project
            cy.visitApp('/projects/create')
            cy.fillFields({
                name: projectName,
                s_packageId: packageId
            })
            cy.clickBtn('Save')
            cy.url().should('match', /\/projects\/.+/)
            project.expectTitle(projectName)

            // Set visibility
            cy.clickBtn('Share')

            if (visibility !== project.Private) {
                cy.checkToggle('visibilityEnabled')
                cy.fillFields({
                    s_visibilityPermission: visibility === project.VisibleView ? 'view' : 'edit'
                })
            }
            cy.clickBtn('Save')
            
            // Log out and test as a viewer
            cy.logout()
            cy.loginAs(viewer)
            cy.visitApp('/projects')
            expectResult()
        })
    })
})
