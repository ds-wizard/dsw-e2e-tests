import * as project from '../../support/project-helpers'


describe('Questionnaire Migrations', () => {
    const projectName = 'Test Project'
    const getKM = (km, minor) => `questionnaire-migration/dsw_${km}_1.${minor}.0.json`
    const getPackageId = (km, minor) => `dsw:${km}:1.${minor}.0`

    const createQuestionnaire = (km, minor) => {
        cy.createQuestionnaire({
            visibility: project.VisibleView,
            sharing: project.Restricted,
            name: projectName,
            packageId: getPackageId(km, minor)
        })
    }

    const createMigrationTo = (km, minor) => {
        cy.visitApp('/projects')
        cy.clickListingItemAction(projectName, 'Create migration')
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
        importKM('vacation-planning', 11)
        importKM('move-test', 5)
    })


    beforeEach(() => {
        cy.task('mongo:delete', {
            collection: 'questionnaires',
            args: {}
        })
        cy.clearServerCache()
        
        cy.loginAs('researcher')
    })


    it('question title change', () => {
        // initialize migration
        createQuestionnaire('vacation-planning', 0)
        createMigrationTo('vacation-planning', 1)

        // check changes and finalize
        cy.get('.changes-view .list-group-item').contains('Question Changed')
        cy.get('#question-3b5f1365-20c2-4493-9768-2e2644597356').should('have.class', 'highlighted').and('be.visible')
        project.resolveAndFinalizeMigration()

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
        project.resolveAndFinalizeMigration()

        // check migrated things
        project.openChapter('After you return')
        cy.get('.form-group .form-text').contains('Also, think about how you share them with your friends.').should('exist')
    })


    it('question level change', () => {
        // initialize migration
        createQuestionnaire('vacation-planning', 2)
        createMigrationTo('vacation-planning', 3)

        // check changes and finalize
        cy.get('.changes-view .list-group-item').contains('Question Changed').click()
        cy.get('#question-045ff688-fdfa-4d9b-941f-df9c725e0f81').should('have.class', 'highlighted').and('be.visible')
        project.resolveAndFinalizeMigration()

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
        project.resolveAndFinalizeMigration()
        
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
        project.resolveAndFinalizeMigration()

        // check migrated things
        project.openChapter('After you return')
        cy.get('.form-group label').contains('Will you organize a presentation about your vacation?').should('exist')
    })


    it('new nested question (not open)', () => {
        // initialize migration
        createQuestionnaire('vacation-planning', 5)
        createMigrationTo('vacation-planning', 6)

        // check changes and finalize
        cy.get('.full-page-illustrated-message').contains('No changes to review')
        project.finalizeMigration()

        // check correct version
        project.selectAnswer('Yes')
        cy.get('.form-group label').contains('Can you speak their language?').should('exist')
    })


    it('new nested question (open)', () => {
        // initialize questionnaire
        createQuestionnaire('vacation-planning', 5)

        // fill the answer, so the subtree is open
        project.open(projectName)
        project.selectAnswer('Yes')

        // initialize migration
        createMigrationTo('vacation-planning', 6)

        // check changes and finalize
        cy.get('.changes-view .list-group-item').contains('New Question').click()
        cy.get('#question-bb34bf7c-ca61-4b69-8800-3be9d5f1e50c').should('have.class', 'highlighted').and('be.visible')
        cy.get('label .diff-added').contains('Can you speak their language?')
        project.resolveAndFinalizeMigration()
      
        // check correct version
        cy.get('.form-group label').contains('Can you speak their language?').should('exist')
    })


    it('changed question (not open)', () => {
        // initialize migration
        createQuestionnaire('vacation-planning', 6)
        createMigrationTo('vacation-planning', 7)

        // check changes and finalize
        cy.get('.full-page-illustrated-message').contains('No changes to review')
        project.finalizeMigration()

        // check correct version
        project.selectAnswer('Yes')
        cy.get('.form-group label').contains('Can you speak any of the languages used in the destination?').should('exist')
        cy.get('.form-group label').contains('Can you speak their language?').should('not.exist')
    })


    it('changed question (open)', () => {
        // initialize questionnaire
        createQuestionnaire('vacation-planning', 6)

        // fill the answer, so the subtree is open
        project.open(projectName)
        project.selectAnswer('Yes')

        // initialize migration
        createMigrationTo('vacation-planning', 7)

        // check changes and finalize
        cy.get('.changes-view .list-group-item').contains('Question Changed').click()
        cy.get('#question-bb34bf7c-ca61-4b69-8800-3be9d5f1e50c').should('have.class', 'highlighted').and('be.visible')
        project.resolveAndFinalizeMigration()

        // check correct version
        cy.get('.form-group label').contains('Can you speak any of the languages used in the destination?').should('exist')
        cy.get('.form-group label').contains('Can you speak their language?').should('not.exist')
    })


    it('add choice', () => {
        // initialize questionnaire & migration
        createQuestionnaire('vacation-planning', 8)
        createMigrationTo('vacation-planning', 9)
        
        // check changes and finalize
        cy.get('.changes-view .list-group-item').contains('Question Changed').click()
        cy.get('#question-4516b7ee-c757-4e86-92d7-8920c5d5a06c').should('have.class', 'highlighted').and('be.visible')
        project.resolveAndFinalizeMigration()

        // check correct version
        cy.get('.form-group .radio label').contains('I will cook myself').should('exist')
    })


    it('edit choice', () => {
        // initialize questionnaire & migration
        createQuestionnaire('vacation-planning', 9)
        createMigrationTo('vacation-planning', 10)
        
        // check changes and finalize
        cy.get('.changes-view .list-group-item').contains('Question Changed').click()
        cy.get('#question-4516b7ee-c757-4e86-92d7-8920c5d5a06c').should('have.class', 'highlighted').and('be.visible')
        project.resolveAndFinalizeMigration()

        // check correct version
        cy.get('.form-group .radio label').contains('Restaurants or Hotels').should('exist')
    })


    it('delete choice', () => {
        // initialize questionnaire & migration
        createQuestionnaire('vacation-planning', 10)
        createMigrationTo('vacation-planning', 11)
        
        // check changes and finalize
        cy.get('.full-page-illustrated-message').contains('No changes to review')
        project.finalizeMigration()

        // check correct version
        cy.get('.form-group .radio label').contains('I will cook myself').should('not.exist')
    })


    it('add todo', () => {
        // initialize migration
        createQuestionnaire('vacation-planning', 0)
        createMigrationTo('vacation-planning', 1)

        // add todo
        project.addTodoFor('How many people will be in your group?')

        // resolve
        project.resolveAndFinalizeMigration()

        // check todo
        project.expectTodoCount(1)
        project.expectTodoFor('How many people will be in your group?')
    })


    it('move answer with follow-ups', () => {
        // initialize questionnaire
        createQuestionnaire('move-test', 0)

        // fill in the answer subtree
        project.open(projectName)
        project.selectAnswer('Answer 1.1')
        project.selectAnswer('Answer 3.1')

        // initialize migration
        createMigrationTo('move-test', 1)

        // check changes and finalize
        cy.get('.full-page-illustrated-message').contains('No changes to review')
        project.finalizeMigration()

        // check migrated things
        cy.get('#question-f9ad8598-4789-4b8a-8254-39af6a8d7101').contains('Answer 1.1')
        project.checkAnswerNotChecked('Answer 1.1')
        project.selectAnswer('Answer 1.1')
        project.checkAnswerNotChecked('Answer 3.1')
    })


    it('move question with answers from chapter to chapter', () => {
        // initialize questionnaire
        createQuestionnaire('move-test', 1)

        // fill in the answers
        project.open(projectName)
        project.selectAnswer('Answer 1.1')
        project.selectAnswer('Answer 3.2')

        // initialize migration
        createMigrationTo('move-test', 2)

        // check changes and finalize
        cy.get('.changes-view .list-group-item').contains('Moved Question').click()
        cy.get('#question-f9ad8598-4789-4b8a-8254-39af6a8d7101').should('have.class', 'highlighted').and('be.visible')
        project.resolveAndFinalizeMigration()

        // check migrated things
        project.openChapter('Chapter 2')
        project.checkAnswerChecked('Answer 1.1')
        project.checkAnswerChecked('Answer 3.2')
    })


    it('move question within an item', () => {
        // initialize questionnaire
        createQuestionnaire('move-test', 2)

        // fill in the answers
        project.open(projectName)
        cy.clickBtn('Add')
        project.selectAnswer('Answer 5.1')
        project.selectAnswer('Answer 6.2')
        cy.get('#question-d2135066-b758-4e4a-bf0d-3f770426b67c .btn').contains('Add').click()
        project.selectAnswer('Answer 8.2')
        project.typeAnswer('Question 9', 'Value')

        // initialize migration
        createMigrationTo('move-test', 3)

        // check changes and finalize
        cy.get('.changes-view .list-group-item').contains('Moved Question').click()
        cy.get('#question-d2135066-b758-4e4a-bf0d-3f770426b67c').should('have.class', 'highlighted').and('be.visible')
        project.resolveAndFinalizeMigration()

        // check migrated things
        cy.get('#question-ff773f6b-b1b8-4d08-bffa-133736f8c850').contains('Question 7')
        project.checkAnswerChecked('Answer 5.1')
        project.checkAnswerChecked('Answer 6.2')
        project.checkAnswerChecked('Answer 8.2')
        project.checkAnswer('Question 9', 'Value')
    })


    it('move question out of an item', () => {
        // initialize questionnaire
        createQuestionnaire('move-test', 3)

        // fill in the answers
        project.open(projectName)
        cy.clickBtn('Add')
        project.selectAnswer('Answer 6.2')
        cy.get('#question-d2135066-b758-4e4a-bf0d-3f770426b67c .btn').contains('Add').click()
        project.selectAnswer('Answer 8.2')
        project.typeAnswer('Question 9', 'Value')

        // initialize migration
        createMigrationTo('move-test', 4)
    
        // check changes and finalize
        cy.get('.changes-view .list-group-item').contains('Moved Question').click()
        cy.get('#question-ff773f6b-b1b8-4d08-bffa-133736f8c850').should('have.class', 'highlighted').and('be.visible')
        project.resolveAndFinalizeMigration()

        // check migrated things
        project.openChapter('Chapter 2')
        project.checkAnswerNotChecked('Answer 6.2')
    })


    it('move question into an item', () => {
        // initialize questionnaire
        createQuestionnaire('move-test', 4)
    
        // fill in the answers 
        project.open(projectName)
        cy.clickBtn('Add')
        project.selectAnswer('Answer 5.1')
        project.openChapter('Chapter 2')
        project.selectAnswer('Answer 1.1')
        project.selectAnswer('Answer 3.1')

        // initialize migration
        createMigrationTo('move-test', 5)

        // check changes and finalize
        cy.get('.changes-view .list-group-item').contains('Moved Question').click()
        cy.get('#question-f9ad8598-4789-4b8a-8254-39af6a8d7101').should('have.class', 'highlighted').and('be.visible')
        project.resolveAndFinalizeMigration()

        // check migrated things
        cy.get('#question-538f78ec-dded-4b6e-9c85-825a0c2b09bc').contains('Question 2')
        project.checkAnswerNotChecked('Answer 1.1')
    })
})
