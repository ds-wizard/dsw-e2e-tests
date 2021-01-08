import * as project from '../../../support/project-helpers'


describe('Project Visibility', () => {
    const projectName = 'My Visibility Questionnaire'
    const kmId = 'test-km-1'
    const packageName = 'Test Knowledge Model 1'

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

    const testCases = [{
        creator: 'researcher',
        viewer: 'researcher',
        visibility: project.VisibleEdit,
        open: true,
        expectResult: project.expectOwner
    }, {
        creator: 'researcher',
        viewer: 'researcher',
        visibility: project.Private,
        open: true,
        expectResult: project.expectOwner
    }, {
        creator: 'researcher',
        viewer: 'researcher',
        visibility: project.VisibleView,
        open: true,
        expectResult: project.expectOwner
    }, {
        creator: 'researcher',
        viewer: 'datasteward',
        visibility: project.VisibleEdit,
        open: true,
        expectResult: project.expectEditor
    }, {
        creator: 'researcher',
        viewer: 'datasteward',
        visibility: project.Private,
        open: false
    }, {
        creator: 'researcher',
        viewer: 'datasteward',
        visibility: project.VisibleView,
        open: true,
        expectResult: project.expectViewer
    }, {
        creator: 'researcher',
        viewer: 'admin',
        visibility: project.VisibleEdit,
        open: true,
        expectResult: project.expectOwner
    }, {
        creator: 'researcher',
        viewer: 'admin',
        visibility: project.Private,
        open: true,
        expectResult: project.expectOwner
    }, {
        creator: 'researcher',
        viewer: 'admin',
        visibility: project.VisibleView,
        open: true,
        expectResult: project.expectOwner
    }]

    testCases.forEach(({ creator, viewer, visibility, open, expectResult }) => {
        it(`works for ${visibility} created by ${creator} and viewed by ${viewer}`, () => {
            cy.loginAs(creator)

            // Create project
            project.create(projectName, packageName)

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

            if (open) {
                project.open(projectName)
                expectResult()
            } else {
                cy.visitApp('/projects')
                cy.expectEmptyListing()
            }
        })
    })
})
