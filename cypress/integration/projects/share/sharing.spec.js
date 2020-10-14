import * as project from '../../../support/project-helpers'


describe('Project Sharing', () => {
    const projectName = 'My Shared Questionnaire'
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

    const expectUserCannotSee = () => {
        cy.expectError()
    }

    const expectAnonCannotSee = () => {
        cy.url().should('contain', '/?originalUrl=')
    }

    const expectView = () => {
        cy.url().should('match', /\/projects\/.+/)
        cy.get('.questionnaire__form .form-group input[type=text]').should('be.disabled')
        cy.get('.questionnaire__panel__phase select').should('be.disabled')
    }

    const expectEdit = () => {
        cy.url().should('match', /\/projects\/.+/)
        cy.get('.questionnaire__form .form-group input[type=text]').should('not.be.disabled')
        cy.get('.questionnaire__panel__phase select').should('not.be.disabled')
    }

    const testCases = [{
        visibility: project.Private,
        sharing: project.Restricted,
        expectUser: expectUserCannotSee,
        expectAnon: expectAnonCannotSee
    }, {
        visibility: project.Private,
        sharing: project.AnyoneWithLinkView,
        expectUser: expectView,
        expectAnon: expectView
    }, {
        visibility: project.Private,
        sharing: project.AnyoneWithLinkEdit,
        expectUser: expectEdit,
        expectAnon: expectEdit
    }, {
        visibility: project.VisibleView,
        sharing: project.Restricted,
        expectUser: expectView,
        expectAnon: expectAnonCannotSee
    }, {
        visibility: project.VisibleView,
        sharing: project.AnyoneWithLinkView,
        expectUser: expectView,
        expectAnon: expectView
    }, {
        visibility: project.VisibleEdit,
        sharing: project.Restricted,
        expectUser: expectEdit,
        expectAnon: expectAnonCannotSee
    }, {
        visibility: project.VisibleEdit,
        sharing: project.AnyoneWithLinkView,
        expectUser: expectEdit,
        expectAnon: expectView
    }, {
        visibility: project.VisibleEdit,
        sharing: project.AnyoneWithLinkEdit,
        expectUser: expectEdit,
        expectAnon: expectEdit
    }]

    testCases.forEach(({ visibility, sharing, expectUser, expectAnon}) => {
        it(`works for ${visibility} and ${sharing}`, () => {
            cy.loginAs('researcher')

            // Create project
            cy.visitApp('/projects/create')
            cy.fillFields({
                name: projectName,
                th_packageId: packageName
            })
            cy.clickBtn('Save')
            cy.url().should('match', /\/projects\/.+/)
            project.expectTitle(projectName)

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
            cy.clickBtn('Save')

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
