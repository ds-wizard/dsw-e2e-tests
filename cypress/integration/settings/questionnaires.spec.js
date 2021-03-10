import * as project from '../../support/project-helpers'

describe('Settings / Questionnaires', () => {
    const projectName = 'Test Questionnaire'
    const kmId = 'test-km-1'
    const packageName = 'Test Knowledge Model 1'

    const createProject = () => {
        cy.visitApp('/projects/create')
        cy.fillFields({
            name: projectName,
            th_packageId: packageName
        })
        cy.clickBtn('Save')

        project.open(projectName)
    }

    const createProjectAndOpenShare = () => {
        createProject()
        cy.clickBtn('Share')
    }


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
        
        cy.putDefaultAppConfig()

        cy.loginAs('admin')

        cy.visitApp('/settings/questionnaires')
    })

    after(() => {
        cy.putDefaultAppConfig()
    })

    // questionnaire visibility

    it('questionnaire visibility enabled', () => {
        cy.checkToggle('questionnaireVisibilityEnabled')
        cy.clickBtn('Save', true)

        createProjectAndOpenShare()
        cy.get('label').contains('Visible by all other logged-in users').should('exist')
    })

    it('questionnaire visibility not enabled', () => {
        cy.uncheckToggle('questionnaireVisibilityEnabled')
        cy.clickBtn('Save', true)
        
        createProjectAndOpenShare()
        cy.get('label').contains('Visible by other logged-in users').should('not.exist')
    })

    it('default questionnaire visibility - Private', () => {
        cy.get(`#${project.Private}`).check()
        cy.clickBtn('Save', true)
        
        createProjectAndOpenShare()
        cy.get('#visibilityEnabled').should('not.be.checked')
    })

    it('default questionnaire visibility - VisibleView', () => {
        cy.get(`#${project.VisibleView}`).check()
        cy.clickBtn('Save', true)
        
        createProjectAndOpenShare()
        cy.get('#visibilityEnabled').should('be.checked')
        cy.checkFields({ s_visibilityPermission: 'view' })
    })

    it('default questionnaire visibility - VisibleEdit', () => {
        cy.get(`#${project.VisibleEdit}`).check()
        cy.clickBtn('Save', true)
        
        createProjectAndOpenShare()
        cy.get('#visibilityEnabled').should('be.checked')
        cy.checkFields({ s_visibilityPermission: 'edit' })
    })

    // questionnaire sharing

    it('questionnaire sharing enabled', () => {
        cy.checkToggle('questionnaireSharingEnabled')
        cy.clickBtn('Save', true)

        createProjectAndOpenShare()
        cy.get('label').contains('Public link').should('exist')
    })

    it('questionnaire sharing not enabled', () => {
        cy.uncheckToggle('questionnaireSharingEnabled')
        cy.clickBtn('Save', true)

        createProjectAndOpenShare()
        cy.get('label').contains('Public link').should('not.exist')
    })

    it('default questionnaire visibility - Restricted', () => {
        cy.get(`#${project.Restricted}`).check()
        cy.clickBtn('Save', true)

        createProjectAndOpenShare()
        cy.get('#sharingEnabled').should('not.be.checked')
    })

    it('default questionnaire visibility - AnyoneWithLinkView', () => {
        cy.get(`#${project.AnyoneWithLinkView}`).check()
        cy.clickBtn('Save', true)

        createProjectAndOpenShare()
        cy.get('#sharingEnabled').should('be.checked')
        cy.checkFields({ s_sharingPermission: 'view' })
    })

    it('default questionnaire visibility - AnyoneWithLinkEdit', () => {
        cy.get(`#${project.AnyoneWithLinkEdit}`).check()
        cy.clickBtn('Save', true)
        
        createProjectAndOpenShare()
        cy.get('#sharingEnabled').should('be.checked')
        cy.checkFields({ s_sharingPermission: 'edit' })
    })

    // questionnaire features

    it('phases enabled', () => {
        // Enable phases
        cy.checkToggle('levels')
        cy.clickBtn('Save', true)

        // Create a project
        createProject()

        // Check that phases are there
        cy.get('.questionnaire__left-panel__phase').should('exist')
    })

    it('phases not enabled', () => {
        // Disable phases
        cy.uncheckToggle('levels')
        cy.clickBtn('Save', true)

        // Create a project
        createProject()

        // Check that phases are not there
        cy.get('.chapter-list .level-selection').should('not.exist')
    })

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
        cy.clickBtn('Save', true)

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
        cy.clickBtn('Save', true)

        // Create a project
        createProject()

        // Check that feedback modal can be opened
        cy.getCy('feedback').first().click()
        cy.get('.modal-cover.visible .modal-title').contains('Feedback').should('exist')
    })

    it('feedback not enabled', () => {
        // Enable feedback
        cy.uncheckToggle('feedbackEnabled')
        cy.clickBtn('Save', true)

        // Create a project
        createProject()

        // Check that feedback modal can be opened
        cy.getCy('feedback').should('not.exist')
    })
})
