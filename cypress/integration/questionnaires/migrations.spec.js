import * as questionnaire from '../../support/questionnaire-helpers'


describe('Questionnaire Migrations', () => {
    const questionnaireName = 'Test Questionnaire'
    const getKM = (km, minor) => `questionnaire-migration/dsw_${km}_1.${minor}.0.json`
    const getPackageId = (km, minor) => `dsw:${km}:1.${minor}.0`

    const createQuestionnaire = (km, minor) => {
        cy.createQuestionnaire({
            visibility: questionnaire.VisibleView,
            sharing: questionnaire.Restricted,
            name: questionnaireName,
            packageId: getPackageId(km, minor)
        })
    }

    const createMigrationTo = (km, minor) => {
        cy.visitApp('/questionnaires')
        cy.clickListingItemAction(questionnaireName, 'Create Migration')
        cy.fillFields({ s_packageId: getPackageId(km, minor) })
        cy.clickBtn('Create')
        cy.get('.Questionnaire__Migration').should('exist')
    }

    const importKM = (kmId, minorVersions) => {
        cy.task('mongo:delete', {
            collection: 'packages',
            args: { kmId }
        })

        cy.fixture(getKM(kmId, minorVersions)).then((km) => {
            cy.importKM(km)
        })
    }


    before(() => {
        importKM('vacation-planning', 7)
        importKM('move-test', 5)
    })


    beforeEach(() => {
        cy.task('mongo:delete', {
            collection: 'questionnaires',
            args: {}
        })
        cy.loginAs('researcher')
    })


    it('question title change', () => {
        // initialize migration
        createQuestionnaire('vacation-planning', 0)
        createMigrationTo('vacation-planning', 1)

        // check changes and finalize
        cy.get('.changes-view .list-group-item').contains('Question Changed')
        cy.get('#question-3b5f1365-20c2-4493-9768-2e2644597356').should('have.class', 'highlighted').and('be.visible')
        questionnaire.resolveAndFinalizeMigration()

        // check migrated things
        cy.get('.form-group label').contains('How many people will go?').should('not.exist')
        cy.get('.form-group label').contains('How many people will be in your group?').should('exist')
    })


    it('question text change', () => {
        // initialize migration
        createQuestionnaire('vacation-planning', 1)
        createMigrationTo('vacation-planning', 2)

        // check changes and finalize
        cy.get('.changes-view .list-group-item').contains('Question Changed').click()
        cy.get('#question-c0964b2e-b5b2-48ac-94f2-7d11e3626a94').should('have.class', 'highlighted').and('be.visible')
        questionnaire.resolveAndFinalizeMigration()

        // check migrated things
        questionnaire.openChapter('After you return')
        cy.get('.form-group .form-text').contains('Also, think about how you share them with your friends.').should('exist')
    })


    it('question level change', () => {
        // initialize migration
        createQuestionnaire('vacation-planning', 2)
        createMigrationTo('vacation-planning', 3)

        // check changes and finalize
        cy.get('.changes-view .list-group-item').contains('Question Changed').click()
        cy.get('#question-045ff688-fdfa-4d9b-941f-df9c725e0f81').should('have.class', 'highlighted').and('be.visible')
        questionnaire.resolveAndFinalizeMigration()

        // check migrated things
        cy.get('.form-group .extra-data').contains('Desirable: Before Submitting the Proposal').should('exist')
    })


    it('answer change', () => {
        // initialize migration
        createQuestionnaire('vacation-planning', 3)
        createMigrationTo('vacation-planning', 4)

        // check changes and finalize
        cy.get('.changes-view .list-group-item').contains('Question Changed').click()
        cy.get('#question-59b4c6e8-ac0d-40b9-9865-e2c5b86f2dba').should('have.class', 'highlighted').and('be.visible')
        cy.get('.radio .diff-added').contains(' or motorbike')
        questionnaire.resolveAndFinalizeMigration()
        
        // check migrated things
        cy.get('.radio').contains('Car or motorbike').should('exist')
    })


    it('new question', () => {
        // initialize migration
        createQuestionnaire('vacation-planning', 4)
        createMigrationTo('vacation-planning', 5)

        // check changes and finalize
        cy.get('.changes-view .list-group-item').contains('New Question').click()
        cy.get('#question-66c327ea-39fe-402a-9a7c-b5ab349ccebe').should('have.class', 'highlighted').and('be.visible')
        cy.get('label .diff-added').contains('Will you organize a presentation about your vacation?')
        questionnaire.resolveAndFinalizeMigration()

        // check migrated things
        questionnaire.openChapter('After you return')
        cy.get('.form-group label').contains('Will you organize a presentation about your vacation?').should('exist')
    })


    it('new nested question (not open)', () => {
        // initialize migration
        createQuestionnaire('vacation-planning', 5)
        createMigrationTo('vacation-planning', 6)

        // check changes and finalize
        cy.get('.full-page-illustrated-message').contains('No changes to review')
        questionnaire.finalizeMigration()

        // check correct version
        questionnaire.selectAnswer('Yes')
        cy.get('.form-group label').contains('Can you speak their language?').should('exist')
    })


    it('new nested question (open)', () => {
        // initialize questionnaire
        createQuestionnaire('vacation-planning', 5)

        // fill the answer, so the subtree is open
        cy.visitApp('/questionnaires')
        cy.clickListingItemAction(questionnaireName, 'Fill questionnaire')
        questionnaire.selectAnswer('Yes')

        // initialize migration
        createMigrationTo('vacation-planning', 6)

        // check changes and finalize
        cy.get('.changes-view .list-group-item').contains('New Question').click()
        cy.get('#question-bb34bf7c-ca61-4b69-8800-3be9d5f1e50c').should('have.class', 'highlighted').and('be.visible')
        cy.get('label .diff-added').contains('Can you speak their language?')
        questionnaire.resolveAndFinalizeMigration()
      
        // check correct version
        cy.get('.form-group label').contains('Can you speak their language?').should('exist')
    })


    it('changed question (not open)', () => {
        // initialize migration
        createQuestionnaire('vacation-planning', 6)
        createMigrationTo('vacation-planning', 7)

        // check changes and finalize
        cy.get('.full-page-illustrated-message').contains('No changes to review')
        questionnaire.finalizeMigration()

        // check correct version
        questionnaire.selectAnswer('Yes')
        cy.get('.form-group label').contains('Can you speak any of the languages used in the destination?').should('exist')
        cy.get('.form-group label').contains('Can you speak their language?').should('not.exist')
    })


    it('changed question (open)', () => {
        // initialize questionnaire
        createQuestionnaire('vacation-planning', 6)

        // fill the answer, so the subtree is open
        cy.visitApp('/questionnaires')
        cy.clickListingItemAction(questionnaireName, 'Fill questionnaire')
        questionnaire.selectAnswer('Yes')

        // initialize migration
        createMigrationTo('vacation-planning', 7)

        // check changes and finalize
        cy.get('.changes-view .list-group-item').contains('Question Changed').click()
        cy.get('#question-bb34bf7c-ca61-4b69-8800-3be9d5f1e50c').should('have.class', 'highlighted').and('be.visible')
        questionnaire.resolveAndFinalizeMigration()

        // check correct version
        cy.get('.form-group label').contains('Can you speak any of the languages used in the destination?').should('exist')
        cy.get('.form-group label').contains('Can you speak their language?').should('not.exist')
    })


    it('add todo', () => {
        // initialize migration
        createQuestionnaire('vacation-planning', 0)
        createMigrationTo('vacation-planning', 1)

        // add todo
        questionnaire.addTodoFor('How many people will be in your group?')

        // resolve
        questionnaire.resolveAndFinalizeMigration()

        // check todo
        questionnaire.expectTodoCount(1)
        questionnaire.expectTodoFor('How many people will be in your group?')
    })

    it('move answer with follow-ups', () => {
        // initialize questionnaire
        createQuestionnaire('move-test', 0)

        // fill in the answer subtree
        cy.visitApp('/questionnaires')
        cy.clickListingItemAction(questionnaireName, 'Fill questionnaire')
        questionnaire.selectAnswer('Answer 1.1')
        questionnaire.selectAnswer('Answer 3.1')

        // initialize migration
        createMigrationTo('move-test', 1)

        // check changes and finalize
        cy.get('.full-page-illustrated-message').contains('No changes to review')
        questionnaire.finalizeMigration()

        // check migrated things
        cy.get('#question-f9ad8598-4789-4b8a-8254-39af6a8d7101').contains('Answer 1.1')
        questionnaire.checkAnswerNotChecked('Answer 1.1')
        questionnaire.selectAnswer('Answer 1.1')
        questionnaire.checkAnswerNotChecked('Answer 3.1')
    })

    it('move question with answers from chapter to chapter', () => {
        // initialize questionnaire
        createQuestionnaire('move-test', 1)

        // fill in the answers
        cy.visitApp('/questionnaires')
        cy.clickListingItemAction(questionnaireName, 'Fill questionnaire')
        questionnaire.selectAnswer('Answer 1.1')
        questionnaire.selectAnswer('Answer 3.2')

        // initialize migration
        createMigrationTo('move-test', 2)

        // check changes and finalize
        cy.get('.changes-view .list-group-item').contains('Moved Question').click()
        cy.get('#question-f9ad8598-4789-4b8a-8254-39af6a8d7101').should('have.class', 'highlighted').and('be.visible')
        questionnaire.resolveAndFinalizeMigration()

        // check migrated things
        questionnaire.openChapter('Chapter 2')
        questionnaire.checkAnswerChecked('Answer 1.1')
        questionnaire.checkAnswerChecked('Answer 3.2')
    })

    it('move question within an item', () => {
        // initialize questionnaire
        createQuestionnaire('move-test', 2)

        // fill in the answers
        questionnaire.open(questionnaireName)
        cy.clickBtn('Add')
        questionnaire.selectAnswer('Answer 5.1')
        questionnaire.selectAnswer('Answer 6.2')
        cy.get('#question-d2135066-b758-4e4a-bf0d-3f770426b67c .btn').contains('Add').click()
        questionnaire.selectAnswer('Answer 8.2')
        questionnaire.typeAnswer('Question 9', 'Value')

        // initialize migration
        createMigrationTo('move-test', 3)

        // check changes and finalize
        cy.get('.changes-view .list-group-item').contains('Moved Question').click()
        cy.get('#question-d2135066-b758-4e4a-bf0d-3f770426b67c').should('have.class', 'highlighted').and('be.visible')
        questionnaire.resolveAndFinalizeMigration()

        // check migrated things
        cy.get('#question-ff773f6b-b1b8-4d08-bffa-133736f8c850').contains('Question 7')
        questionnaire.checkAnswerChecked('Answer 5.1')
        questionnaire.checkAnswerChecked('Answer 6.2')
        questionnaire.checkAnswerChecked('Answer 8.2')
        questionnaire.checkAnswer('Question 9', 'Value')
    })

    it('move question out of an item', () => {
        // initialize questionnaire
        createQuestionnaire('move-test', 3)

        // fill in the answers
        questionnaire.open(questionnaireName)
        cy.clickBtn('Add')
        questionnaire.selectAnswer('Answer 6.2')
        cy.get('#question-d2135066-b758-4e4a-bf0d-3f770426b67c .btn').contains('Add').click()
        questionnaire.selectAnswer('Answer 8.2')
        questionnaire.typeAnswer('Question 9', 'Value')

        // initialize migration
        createMigrationTo('move-test', 4)
    
        // check changes and finalize
        cy.get('.changes-view .list-group-item').contains('Moved Question').click()
        cy.get('#question-ff773f6b-b1b8-4d08-bffa-133736f8c850').should('have.class', 'highlighted').and('be.visible')
        questionnaire.resolveAndFinalizeMigration()

        // check migrated things
        questionnaire.openChapter('Chapter 2')
        questionnaire.checkAnswerNotChecked('Answer 6.2')
    })

    it('move question into an item', () => {
        // initialize questionnaire
        createQuestionnaire('move-test', 4)
    
        // fill in the answers 
        questionnaire.open(questionnaireName)
        cy.clickBtn('Add')
        questionnaire.selectAnswer('Answer 5.1')
        questionnaire.openChapter('Chapter 2')
        questionnaire.selectAnswer('Answer 1.1')
        questionnaire.selectAnswer('Answer 3.1')

        // initialize migration
        createMigrationTo('move-test', 5)

        // check changes and finalize
        cy.get('.changes-view .list-group-item').contains('Moved Question').click()
        cy.get('#question-f9ad8598-4789-4b8a-8254-39af6a8d7101').should('have.class', 'highlighted').and('be.visible')
        questionnaire.resolveAndFinalizeMigration()

        // check migrated things
        cy.get('#question-538f78ec-dded-4b6e-9c85-825a0c2b09bc').contains('Question 2')
        questionnaire.checkAnswerNotChecked('Answer 1.1')
    })
})
