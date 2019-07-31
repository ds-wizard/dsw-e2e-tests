import * as questionnaire from '../../support/questionnaire-helpers'


describe('Questionnaire Migrations', () => {
    const questionnaireName = 'Test Questionnaire'
    const getKM = (minor) => `questionnaire-migration/dsw_vacation-planning_1.${minor}.0.json`
    const getPackageId = (minor) => `dsw:vacation-planning:1.${minor}.0`


    const createQuestionnaire = (minor) => {
        cy.createQuestionnaire({
            accessibility: questionnaire.PublicReadOnly,
            name: questionnaireName,
            packageId: getPackageId(minor)
        })
    }


    const createMigrationTo = (minor) => {
        cy.visitApp('/questionnaires')
        cy.clickListingItemAction(questionnaireName, 'Create Migration')
        cy.fillFields({ s_packageId: getPackageId(minor) })
        cy.clickBtn('Create')
        cy.get('.Questionnaire__Migration').should('exist')
    }


    before(() => {
        cy.task('mongo:delete', {
            collection: 'packages',
            args: { kmId: 'vacation-planning' }
        })

        for (let i = 0; i < 8; i++) {
            cy.fixture(getKM(i)).then((km) => {
                cy.importKM(km)
            })
        }
    })


    beforeEach(() => {
        cy.task('mongo:delete', {
            collection: 'questionnaires',
            args: { name: questionnaireName }
        })
        cy.loginAs('researcher')
    })


    it('question title change', () => {
        // initialize migration
        createQuestionnaire(0)
        createMigrationTo(1)

        // check changes
        cy.get('.changes-view .list-group-item').contains('Question Changed')
        cy.get('#question-3b5f1365-20c2-4493-9768-2e2644597356').should('have.class', 'highlighted').and('be.visible')

        // resolve
        cy.clickBtn('Resolve')
        cy.clickBtn('Finalize Migration')

        // check correct version
        cy.get('.top-header-title').contains('1.1.0')

        // check migrated things
        cy.get('.form-group label').contains('How many people will go?').should('not.exist')
        cy.get('.form-group label').contains('How many people will be in your group?').should('exist')
    })


    it('question text change', () => {
        // initialize migration
        createQuestionnaire(1)
        createMigrationTo(2)

        // check changes
        cy.get('.changes-view .list-group-item').contains('Question Changed').click()
        cy.get('#question-c0964b2e-b5b2-48ac-94f2-7d11e3626a94').should('have.class', 'highlighted').and('be.visible')

        // resolve
        cy.clickBtn('Resolve')
        cy.clickBtn('Finalize Migration')

        // check correct version
        cy.get('.top-header-title').contains('1.2.0')

        // check migrated things
        cy.get('.chapter-list .nav-link').contains('After you return').click()
        cy.get('.form-group .form-text').contains('Also, think about how you share them with your friends.').should('exist')
    })


    it('question level change', () => {
        // initialize migration
        createQuestionnaire(2)
        createMigrationTo(3)

        // check changes
        cy.get('.changes-view .list-group-item').contains('Question Changed').click()
        cy.get('#question-045ff688-fdfa-4d9b-941f-df9c725e0f81').should('have.class', 'highlighted').and('be.visible')

        // resolve
        cy.clickBtn('Resolve')
        cy.clickBtn('Finalize Migration')

        // check correct version
        cy.get('.top-header-title').contains('1.3.0')

        // check migrated things
        cy.get('.form-group .extra-data').contains('Desirable: Before Submitting the Proposal').should('exist')
    })


    it('answer change', () => {
        // initialize migration
        createQuestionnaire(3)
        createMigrationTo(4)

        // check changes
        cy.get('.changes-view .list-group-item').contains('Question Changed').click()
        cy.get('#question-59b4c6e8-ac0d-40b9-9865-e2c5b86f2dba').should('have.class', 'highlighted').and('be.visible')
        cy.get('.radio .diff-added').contains(' or motorbike')

        // resolve
        cy.clickBtn('Resolve')
        cy.clickBtn('Finalize Migration')

        // check correct version
        cy.get('.top-header-title').contains('1.4.0')

        // check migrated things
        cy.get('.radio').contains('Car or motorbike').should('exist')
    })


    it('new question', () => {
        // initialize migration
        createQuestionnaire(4)
        createMigrationTo(5)

        // check changes
        cy.get('.changes-view .list-group-item').contains('New Question').click()
        cy.get('#question-66c327ea-39fe-402a-9a7c-b5ab349ccebe').should('have.class', 'highlighted').and('be.visible')
        cy.get('label .diff-added').contains('Will you organize a presentation about your vacation?')

        // resolve
        cy.clickBtn('Resolve')
        cy.clickBtn('Finalize Migration')

        // check correct version
        cy.get('.top-header-title').contains('1.5.0')

        // check migrated things
        cy.get('.chapter-list .nav-link').contains('After you return').click()
        cy.get('.form-group label').contains('Will you organize a presentation about your vacation?').should('exist')
    })


    it('new nested question (not open)', () => {
        // initialize migration
        createQuestionnaire(5)
        createMigrationTo(6)

        // check changes
        cy.get('.full-page-illustrated-message').contains('No changes to review')
        cy.clickBtn('Finalize Migration')

        // check correct version
        cy.get('.top-header-title').contains('1.6.0')
        questionnaire.selectAnswer('Yes')
        cy.get('.form-group label').contains('Can you speak their language?').should('exist')
    })


    it('new nested question (open)', () => {
        // initialize questionnaire
        createQuestionnaire(5)

        // fill the answer, so the subtree is open
        cy.visitApp('/questionnaires')
        cy.clickListingItemAction(questionnaireName, 'Fill questionnaire')
        questionnaire.selectAnswer('Yes')
        cy.clickBtn('Save')

        // initialize migration
        createMigrationTo(6)

        // check changes
        cy.get('.changes-view .list-group-item').contains('New Question').click()
        cy.get('#question-bb34bf7c-ca61-4b69-8800-3be9d5f1e50c').should('have.class', 'highlighted').and('be.visible')
        cy.get('label .diff-added').contains('Can you speak their language?')

        // resolve
        cy.clickBtn('Resolve')
        cy.clickBtn('Finalize Migration')

        // check correct version
        cy.get('.top-header-title').contains('1.6.0')
        cy.get('.form-group label').contains('Can you speak their language?').should('exist')
    })


    it('changed question (not open)', () => {
        // initialize migration
        createQuestionnaire(6)
        createMigrationTo(7)

        // check changes
        cy.get('.full-page-illustrated-message').contains('No changes to review')
        cy.clickBtn('Finalize Migration')

        // check correct version
        cy.get('.top-header-title').contains('1.7.0')
        questionnaire.selectAnswer('Yes')
        cy.get('.form-group label').contains('Can you speak any of the languages used in the destination?').should('exist')
        cy.get('.form-group label').contains('Can you speak their language?').should('not.exist')
    })


    it('changed question (open)', () => {
        // initialize questionnaire
        createQuestionnaire(6)

        // fill the answer, so the subtree is open
        cy.visitApp('/questionnaires')
        cy.clickListingItemAction(questionnaireName, 'Fill questionnaire')
        questionnaire.selectAnswer('Yes')
        cy.clickBtn('Save')

        // initialize migration
        createMigrationTo(7)

        // check changes
        cy.get('.changes-view .list-group-item').contains('Question Changed').click()
        cy.get('#question-bb34bf7c-ca61-4b69-8800-3be9d5f1e50c').should('have.class', 'highlighted').and('be.visible')

        // resolve
        cy.clickBtn('Resolve')
        cy.clickBtn('Finalize Migration')

        // check correct version
        cy.get('.top-header-title').contains('1.7.0')
        cy.get('.form-group label').contains('Can you speak any of the languages used in the destination?').should('exist')
        cy.get('.form-group label').contains('Can you speak their language?').should('not.exist')
    })


    it('add todo', () => {
        // initialize migration
        createQuestionnaire(0)
        createMigrationTo(1)

        // add todo
        questionnaire.addTodoFor('How many people will be in your group?')

        // resolve
        cy.clickBtn('Resolve')
        cy.clickBtn('Finalize Migration')

        // check correct version
        cy.get('.top-header-title').contains('1.1.0')

        // check todo
        questionnaire.expectTodoCount(1)
        questionnaire.expectTodoFor('How many people will be in your group?')
    })
})
