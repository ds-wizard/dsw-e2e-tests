import * as project from '../../../../support/project-helpers'


describe('Project Sharing', () => {
    const projectName = 'My Shared Questionnaire'
    const kmId = 'test-km-1'
    const packageName = 'Test Knowledge Model 1'

    before(() => {
        cy.task('mongo:delete', {
            collection: 'packages',
            args: { kmId }
        })
        cy.clearServerCache()

        cy.fixture('test-km-1').then((km) => {
            cy.importKM(km)
        })
    })

    beforeEach(() => {
        cy.task('mongo:delete', {
            collection: 'questionnaires',
            args: {}
        })
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
                    s_visibilityPermission: visibility === project.VisibleView ? 'view' : 'edit'
                })
            }

            // Share modal -- set sharing
            if (sharing !== project.Restricted) {
                cy.checkToggle('sharingEnabled')
                cy.fillFields({
                    s_sharingPermission: sharing === project.AnyoneWithLinkView ? 'view' : 'edit'
                })
            }

            // Share modal -- save
            cy.clickModalBtn('Save')

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
