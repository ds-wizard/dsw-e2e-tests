import * as q from '../../support/questionnaire-helpers'

describe('Settings / Questionnaires', () => {
    const questionnaireName = 'Test Questionnaire'
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
        cy.visitApp('/questionnaires/create')
        cy.get('label').contains('Visible by other logged users').should('exist')
    })

    it('questionnaire visibility not enabled', () => {
        cy.uncheckToggle('questionnaireVisibilityEnabled')
        cy.clickBtn('Save', true)
        cy.visitApp('/questionnaires/create')
        cy.get('label').contains('Visible by other logged users').should('not.exist')
    })

    it('default questionnaire visibility - Private', () => {
        cy.get(`#${q.Private}`).check()
        cy.clickBtn('Save', true)
        cy.visitApp('/questionnaires/create')
        cy.get('#visibilityEnabled').should('not.be.checked')
    })

    it('default questionnaire visibility - VisibleView', () => {
        cy.get(`#${q.VisibleView}`).check()
        cy.clickBtn('Save', true)
        cy.visitApp('/questionnaires/create')
        cy.get('#visibilityEnabled').should('be.checked')
        cy.checkFields({ s_visibilityPermission: 'view' })
    })

    it('default questionnaire visibility - VisibleEdit', () => {
        cy.get(`#${q.VisibleEdit}`).check()
        cy.clickBtn('Save', true)
        cy.visitApp('/questionnaires/create')
        cy.get('#visibilityEnabled').should('be.checked')
        cy.checkFields({ s_visibilityPermission: 'edit' })
    })

    // questionnaire sharing

    it('questionnaire sharing enabled', () => {
        cy.checkToggle('questionnaireSharingEnabled')
        cy.clickBtn('Save', true)
        cy.visitApp('/questionnaires/create')
        cy.get('label').contains('Public link').should('exist')
    })

    it('questionnaire sharing not enabled', () => {
        cy.uncheckToggle('questionnaireSharingEnabled')
        cy.clickBtn('Save', true)
        cy.visitApp('/questionnaires/create')
        cy.get('label').contains('Public link').should('not.exist')
    })

    it('default questionnaire visibility - Restricted', () => {
        cy.get(`#${q.Restricted}`).check()
        cy.clickBtn('Save', true)
        cy.visitApp('/questionnaires/create')
        cy.get('#sharingEnabled').should('not.be.checked')
    })

    it('default questionnaire visibility - AnyoneWithLinkView', () => {
        cy.get(`#${q.AnyoneWithLinkView}`).check()
        cy.clickBtn('Save', true)
        cy.visitApp('/questionnaires/create')
        cy.get('#sharingEnabled').should('be.checked')
        cy.checkFields({ s_sharingPermission: 'view' })
    })

    it('default questionnaire visibility - AnyoneWithLinkEdit', () => {
        cy.get(`#${q.AnyoneWithLinkEdit}`).check()
        cy.clickBtn('Save', true)
        cy.visitApp('/questionnaires/create')
        cy.get('#sharingEnabled').should('be.checked')
        cy.checkFields({ s_sharingPermission: 'edit' })
    })

    // questionnaire features

    it('phases enabled', () => {
        // Enable phases
        cy.checkToggle('levels')
        cy.clickBtn('Save', true)

        // Create a questionnaire
        const questionnaire = {
            name: questionnaireName,
            s_packageId: packageId
        }
        cy.visitApp('/questionnaires/create')
        cy.fillFields(questionnaire)
        cy.clickBtn('Save')
        cy.url().should('contain', '/questionnaires/detail/')

        // Check that phases are there
        cy.get('.questionnaire__panel__phase').should('exist')
    })

    it('phases not enabled', () => {
        // Disable phases
        cy.uncheckToggle('levels')
        cy.clickBtn('Save', true)

        // Create a questionnaire
        const questionnaire = {
            name: questionnaireName,
            s_packageId: packageId
        }
        cy.visitApp('/questionnaires/create')
        cy.fillFields(questionnaire)
        cy.clickBtn('Save')
        cy.url().should('contain', '/questionnaires/detail/')

        // Check that phases are not there
        cy.get('.chapter-list .level-selection').should('not.exist')
    })

    it('summary report enabled', () => {
        // Enable summary report
        cy.checkToggle('summaryReport')
        cy.clickBtn('Save', true)

        // Create a questionnaire
        const questionnaire = {
            name: questionnaireName,
            s_packageId: packageId
        }
        cy.visitApp('/questionnaires/create')
        cy.fillFields(questionnaire)
        cy.clickBtn('Save')
        cy.url().should('contain', '/questionnaires/detail/')

        // Check that summary report is there
        cy.get('.nav-link').contains('Summary Report').should('exist')
    })

    it('summary report not enabled', () => {
        // Enable summary report
        cy.uncheckToggle('summaryReport')
        cy.clickBtn('Save', true)

        // Create a questionnaire
        const questionnaire = {
            name: questionnaireName,
            s_packageId: packageId
        }
        cy.visitApp('/questionnaires/create')
        cy.fillFields(questionnaire)
        cy.clickBtn('Save')
        cy.url().should('contain', '/questionnaires/detail/')

        // Check that summary report is not there
        cy.get('.nav-link').contains('Summary Report').should('not.exist')
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

        // Create a questionnaire
        const questionnaire = {
            name: questionnaireName,
            s_packageId: packageId
        }
        cy.visitApp('/questionnaires/create')
        cy.fillFields(questionnaire)
        cy.clickBtn('Save')
        cy.url().should('contain', '/questionnaires/detail/')

        // Check that feedback modal can be opened
        cy.getCy('feedback').first().click()
        cy.get('.modal-cover.visible .modal-title').contains('Feedback').should('exist')
    })

    it('feedback not enabled', () => {
        // Enable feedback
        cy.uncheckToggle('feedbackEnabled')
        cy.clickBtn('Save', true)

        // Create a questionnaire
        const questionnaire = {
            name: questionnaireName,
            s_packageId: packageId
        }
        cy.visitApp('/questionnaires/create')
        cy.fillFields(questionnaire)
        cy.clickBtn('Save')
        cy.url().should('contain', '/questionnaires/detail/')

        // Check that feedback modal can be opened
        cy.getCy('feedback').should('not.exist')
    })
})