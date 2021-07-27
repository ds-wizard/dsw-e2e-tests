import * as project from '../../support/project-helpers'

describe('Settings / Projects', () => {
    const projectName = 'Test Project'
    const kmId = 'test-km-1'
    const packageId = 'dsw:test-km-1:1.0.0'
    const packageName = 'Test Knowledge Model 1'

    const createProject = () => {
        project.create(projectName, packageName)
    }

    const createProjectAndOpenShare = () => {
        createProject()
        cy.getCy('project_detail_share-button').click()
    }


    before(() => {
        cy.task('package:delete', { km_id: kmId })
        cy.clearServerCache()

        cy.importKM('test-km-1')
    })

    beforeEach(() => {
        cy.task('questionnaire:delete')
        cy.putDefaultAppConfig()
        
        cy.loginAs('admin')
        cy.visitApp('/settings/projects')
    })

    after(() => {
        cy.putDefaultAppConfig()
    })

    // questionnaire visibility

    it('questionnaire visibility enabled', () => {
        cy.checkToggle('questionnaireVisibilityEnabled')
        cy.submitForm()

        createProjectAndOpenShare()
        cy.get('#visibilityEnabled').should('exist')
    })

    it('questionnaire visibility not enabled', () => {
        cy.uncheckToggle('questionnaireVisibilityEnabled')
        cy.submitForm()

        createProjectAndOpenShare()
        cy.get('#visibilityEnabled').should('not.exist')
    })

    it('default questionnaire visibility - Private', () => {
        cy.get(`#${project.Private}`).check()
        cy.submitForm()

        createProjectAndOpenShare()
        cy.get('#visibilityEnabled').should('not.be.checked')
    })

    it('default questionnaire visibility - VisibleView', () => {
        cy.get(`#${project.VisibleView}`).check()
        cy.submitForm()

        createProjectAndOpenShare()
        cy.get('#visibilityEnabled').should('be.checked')
        cy.checkFields({ s_visibilityPermission: 'view' })
    })

    it('default questionnaire visibility - VisibleEdit', () => {
        cy.get(`#${project.VisibleEdit}`).check()
        cy.submitForm()

        createProjectAndOpenShare()
        cy.get('#visibilityEnabled').should('be.checked')
        cy.checkFields({ s_visibilityPermission: 'edit' })
    })

    // questionnaire sharing

    it('questionnaire sharing enabled', () => {
        cy.checkToggle('questionnaireSharingEnabled')
        cy.submitForm()

        createProjectAndOpenShare()
        cy.get('#sharingEnabled').should('exist')
    })

    it('questionnaire sharing not enabled', () => {
        cy.uncheckToggle('questionnaireSharingEnabled')
        cy.submitForm()

        createProjectAndOpenShare()
        cy.get('#sharingEnabled').should('not.exist')
    })

    it('default questionnaire visibility - Restricted', () => {
        cy.get(`#${project.Restricted}`).check()
        cy.submitForm()

        createProjectAndOpenShare()
        cy.get('#sharingEnabled').should('not.be.checked')
    })

    it('default questionnaire visibility - AnyoneWithLinkView', () => {
        cy.get(`#${project.AnyoneWithLinkView}`).check()
        cy.submitForm()

        createProjectAndOpenShare()
        cy.get('#sharingEnabled').should('be.checked')
        cy.checkFields({ s_sharingPermission: 'view' })
    })

    it('default questionnaire visibility - AnyoneWithLinkEdit', () => {
        cy.get(`#${project.AnyoneWithLinkEdit}`).check()
        cy.submitForm()

        createProjectAndOpenShare()
        cy.get('#sharingEnabled').should('be.checked')
        cy.checkFields({ s_sharingPermission: 'edit' })
    })

    // project creation

    const expectBothEnabled =() => {
        cy.getCy('project_create_nav_template').should('exist')
        cy.getCy('project_create_nav_custom').should('exist')

        expectCreateProjectButton(true)
    }

    const expectCustomOnlyEnabled = () => {
        cy.getCy('project_create_nav_template').should('not.exist')
        cy.getCy('project_create_nav_custom').should('not.exist')
        cy.get('#packageId').should('exist')

        expectCreateProjectButton(true)
    }

    const expectTemplateOnlyEnabled = () => {
        cy.getCy('project_create_nav_template').should('not.exist')
        cy.getCy('project_create_nav_custom').should('not.exist')
        cy.get('#uuid').should('exist')
        
        expectCreateProjectButton(false)
    }

    const expectCreateProjectButton = (visible) => {
        cy.visitApp(`/knowledge-models/${packageId}`)
        cy.get('.top-header-actions .link-with-icon').contains('Create project').should(visible ? 'exist' : 'not.exist')
    }

    const creationTest = (projectCreation, role, expect) => {
        it(`project creation ${projectCreation} for ${role}`, () => {
            cy.get(`#${projectCreation}`).check({ force: true })
            cy.submitForm()
            cy.logout()

            cy.loginAs(role)
            cy.visitApp('/projects')
            cy.getCy('projects_create-button').click()

            expect()
        })
    }

    const tests = [{
        projectCreation: project.TemplateAndCustomQuestionnaireCreation,
        researcher: expectBothEnabled,
        datasteward: expectBothEnabled
    }, {
        projectCreation: project.TemplateQuestionnaireCreation,
        researcher: expectTemplateOnlyEnabled,
        datasteward: expectBothEnabled
    }, {
        projectCreation: project.CustomQuestionnaireCreation,
        researcher: expectCustomOnlyEnabled,
        datasteward: expectBothEnabled
    }]

    tests.forEach(({projectCreation, researcher, datasteward}) => {
        creationTest(projectCreation, 'researcher', researcher)
        creationTest(projectCreation, 'datasteward', datasteward)
    })


    // questionnaire features

    it('summary report enabled', () => {
        // Enable summary report
        cy.checkToggle('summaryReport')
        cy.clickBtn('Save', true)

        // Create a project
        createProject()

        // Check that summary report is there
        cy.get('.nav-link').contains('Metrics').should('exist')
    })

    it('summary report not enabled', () => {
        // Enable summary report
        cy.uncheckToggle('summaryReport')
        cy.submitForm()

        // Create a project
        createProject()

        // Check that summary report is not there
        cy.get('.nav-link').contains('Metrics').should('not.exist')
    })

    it('feedback enabled', () => {
        // Enable feedback
        cy.checkToggle('feedbackEnabled')
        cy.fillFields({
            feedbackOwner: 'exampleOwner',
            feedbackRepo: 'exampleRepository',
            feedbackToken: 'zxcvbnm'
        })
        cy.submitForm()

        // Create a project
        createProject()

        // Check that feedback modal can be opened
        cy.getCy('feedback').first().click()
        cy.get('.modal-cover.visible .modal-title').contains('Feedback').should('exist')
    })

    it('feedback not enabled', () => {
        // Enable feedback
        cy.uncheckToggle('feedbackEnabled')
        cy.submitForm()

        // Create a project
        createProject()

        // Check that feedback modal can be opened
        cy.getCy('feedback').should('not.exist')
    })
})
