import * as project from '../../../../support/project-helpers'


describe('Project Sharing', () => {
    const projectName = 'My Shared Questionnaire'
    const kmId = 'test-km-1'
    const packageName = 'Test Knowledge Model 1'

    before(() => {
        cy.task('package:delete', { km_id: kmId })
        cy.clearServerCache()

        cy.importKM('test-km-1')
    })

    beforeEach(() => {
        cy.task('questionnaire:delete')
        cy.clearServerCache()
    })

    const expectUserCannotSee = () => {
        cy.expectError()
    }

    const expectAnonCannotSee = () => {
        cy.url().should('contain', '/?originalUrl=')
    }

    const testCases = [{
        visibility: project.Private,
        sharing: project.Restricted,
        expectUser: expectUserCannotSee,
        expectAnon: expectAnonCannotSee
    }, {
        visibility: project.Private,
        sharing: project.AnyoneWithLinkView,
        expectUser: project.expectViewer,
        expectAnon: project.expectViewer
    }, {
        visibility: project.Private,
        sharing: project.AnyoneWithLinkComment,
        expectUser: project.expectCommenter,
        expectAnon: project.expectCommenter
    }, {
        visibility: project.Private,
        sharing: project.AnyoneWithLinkEdit,
        expectUser: project.expectEditor,
        expectAnon: project.expectEditor
    }, {
        visibility: project.VisibleView,
        sharing: project.Restricted,
        expectUser: project.expectViewer,
        expectAnon: expectAnonCannotSee
    }, {
        visibility: project.VisibleView,
        sharing: project.AnyoneWithLinkView,
        expectUser: project.expectViewer,
        expectAnon: project.expectViewer
    }, {
        visibility: project.VisibleView,
        sharing: project.AnyoneWithLinkComment,
        expectUser: project.expectCommenter,
        expectAnon: project.expectCommenter
    }, {
        visibility: project.VisibleView,
        sharing: project.AnyoneWithLinkEdit,
        expectUser: project.expectEditor,
        expectAnon: project.expectEditor
    }, {
        visibility: project.VisibleComment,
        sharing: project.Restricted,
        expectUser: project.expectCommenter,
        expectAnon: expectAnonCannotSee
    }, {
        visibility: project.VisibleComment,
        sharing: project.AnyoneWithLinkView,
        expectUser: project.expectCommenter,
        expectAnon: project.expectViewer
    }, {
        visibility: project.VisibleComment,
        sharing: project.AnyoneWithLinkComment,
        expectUser: project.expectCommenter,
        expectAnon: project.expectCommenter
    }, {
        visibility: project.VisibleComment,
        sharing: project.AnyoneWithLinkEdit,
        expectUser: project.expectEditor,
        expectAnon: project.expectEditor
    }, {
        visibility: project.VisibleEdit,
        sharing: project.Restricted,
        expectUser: project.expectEditor,
        expectAnon: expectAnonCannotSee
    }, {
        visibility: project.VisibleEdit,
        sharing: project.AnyoneWithLinkView,
        expectUser: project.expectEditor,
        expectAnon: project.expectViewer
    }, {
        visibility: project.VisibleEdit,
        sharing: project.AnyoneWithLinkComment,
        expectUser: project.expectEditor,
        expectAnon: project.expectCommenter
    }, {
        visibility: project.VisibleEdit,
        sharing: project.AnyoneWithLinkEdit,
        expectUser: project.expectEditor,
        expectAnon: project.expectEditor
    }]

    it('public link visible', () => {
        cy.loginAs('researcher')

        project.create(projectName, packageName)
        
        cy.clickBtn('Share')
        cy.checkToggle('sharingEnabled')

        cy.url().then(url => {
            cy.get('#public-link').should('have.value', url)
        })
    })

    testCases.forEach(({ visibility, sharing, expectUser, expectAnon}) => {
        it(`works for ${visibility} and ${sharing}`, () => {
            cy.loginAs('researcher')

            // Create project
            project.create(projectName, packageName)

            // Share modal
            cy.clickBtn('Share')

            // Share modal -- set visibility
            if (visibility !== project.Private) {
                cy.checkToggle('visibilityEnabled')
                cy.fillFields({
                    s_visibilityPermission: project.visibilityToPerm(visibility)
                })
            }

            // Share modal -- set sharing
            if (sharing !== project.Restricted) {
                cy.checkToggle('sharingEnabled')
                cy.fillFields({
                    s_sharingPermission: project.sharingToPerm(sharing)
                })
            }

            // Share modal -- save
            cy.clickModalAction()

            // Test as another user
            cy.url().then(url => {
                const projectId = url.split('/').pop()
                cy.logout()

                // Test user access
                cy.loginAs('datasteward')
                cy.visitApp(`/projects/${projectId}`)
                expectUser()

                // Test anonymous access
                cy.logout()
                cy.visitApp(`/projects/${projectId}`)
                expectAnon()
            })
        })
    })
})
