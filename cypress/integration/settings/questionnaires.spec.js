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

    it('questionnaire accessibility enabled', () => {
        cy.checkToggle('questionnaireAccessibilityEnabled')
        cy.clickBtn('Save', true)
        cy.visitApp('/questionnaires/create')
        cy.get('label').contains('Accessibility').should('exist')
    })

    it('questionnaire accessibility not enabled', () => {
        cy.uncheckToggle('questionnaireAccessibilityEnabled')
        cy.clickBtn('Save', true)
        cy.visitApp('/questionnaires/create')
        cy.get('label').contains('Accessibility').should('not.exist')
    })

    it('phases enabled', () => {
        // Enable phases
        cy.checkToggle('levelsEnabled')
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
        cy.get('.chapter-list .level-selection').should('exist')
    })

    it('phases not enabled', () => {
        // Disable phases
        cy.uncheckToggle('levelsEnabled')
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