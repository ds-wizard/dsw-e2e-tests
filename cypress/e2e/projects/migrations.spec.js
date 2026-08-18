import * as packages from '../../support/packages-helpers'
import * as project from '../../support/project-helpers'

describe('Project Migrations', () => {
    const projectName = 'Test Project'
    const getKmFile = (km, minor) => `questionnaire-migration/dsw_${km}_1.${minor}.0.json`
    const getPackageUuid = (km, minor) => packages.getPackageUuid('dsw', km, `1.${minor}.0`)


    const createQuestionnaire = (km, minor) => {
        getPackageUuid(km, minor).then(packageUuid => {
            cy.createProject({
                visibility: project.VisibleView,
                sharing: project.Restricted,
                name: projectName,
                knowledgeModelPackageUuid: packageUuid
            })
        })
    }

    const createMigrationTo = (km, minor) => {
        getPackageUuid(km, minor).then(packageUuid => {
            cy.visitApp('/projects')
            cy.clickListingItemAction(projectName, 'create-migration')
            cy.fillFields({ s_knowledgeModelPackageUuid: packageUuid })
            cy.clickBtn('Migrate')
            cy.get('.Projects__Detail').should('exist')
        })
    }

    const importKM = (kmId, minorVersions) => {
        cy.task('knowledgeModelPackage:delete', { km_id: kmId })
        cy.importKM(getKmFile(kmId, minorVersions))
    }


    before(() => {
        importKM('vacation-planning', 11)
        importKM('move-test', 5)
    })


    beforeEach(() => {
        cy.task('project:delete')
        cy.clearServerCache()

        cy.loginAs('researcher')
    })

    it('can click "update available" badge', () => {
        createQuestionnaire('vacation-planning', 0)
        cy.visitApp('/projects')
        cy.getCy('badge_project_knowledge-model-update-available').click()
        cy.get('h2').contains('Migrate Project').should('exist')
    })

    it('question title change', () => {
        // initialize migration
        createQuestionnaire('vacation-planning', 0)
        createMigrationTo('vacation-planning', 1)

        // check migrated things
        cy.getCy('questionnaire_question-title').contains('How many people will go?').should('not.exist')
        cy.getCy('questionnaire_question-title').contains('How many people will be in your group?').should('exist')
    })


    it('question text change', () => {
        // initialize migration
        createQuestionnaire('vacation-planning', 1)
        createMigrationTo('vacation-planning', 2)

        // check migrated things
        project.openChapter('After you return')
        cy.getCy('questionnaire_question-text').contains('Also, think about how you share them with your friends.').should('exist')
    })


    it('question level change', () => {
        // initialize migration
        createQuestionnaire('vacation-planning', 2)
        createMigrationTo('vacation-planning', 3)

        // check migrated things
        cy.getCy('questionnaire_question-extra').contains('Desirable: Before Submitting the Proposal').should('exist')
    })


    it('answer change', () => {
        // initialize migration
        createQuestionnaire('vacation-planning', 3)
        createMigrationTo('vacation-planning', 4)

        // check migrated things
        cy.get('.questionnaireContent__option').contains('Car or motorbike').should('exist')
    })


    it('new question', () => {
        // initialize migration
        createQuestionnaire('vacation-planning', 4)
        createMigrationTo('vacation-planning', 5)

        // check migrated things
        project.openChapter('After you return')
        cy.getCy('questionnaire_question-title').contains('Will you organize a presentation about your vacation?').should('exist')
    })


    it('new nested question (not open)', () => {
        // initialize migration
        createQuestionnaire('vacation-planning', 5)
        createMigrationTo('vacation-planning', 6)

        // check correct version
        project.selectAnswer('Yes')
        cy.getCy('questionnaire_question-title').contains('Can you speak their language?').should('exist')
    })


    it('new nested question (open)', () => {
        // initialize questionnaire
        createQuestionnaire('vacation-planning', 5)

        // fill the answer, so the subtree is open
        project.open(projectName)
        project.selectAnswer('Yes')

        // initialize migration
        createMigrationTo('vacation-planning', 6)

        // check correct version
        cy.getCy('questionnaire_question-title').contains('Can you speak their language?').should('exist')
    })


    it('changed question (not open)', () => {
        // initialize migration
        createQuestionnaire('vacation-planning', 6)
        createMigrationTo('vacation-planning', 7)

        // check changes and finalize
        // cy.getCy('illustrated-message_no-changes').should('exist')
        // project.finalizeMigration()

        // check correct version
        project.selectAnswer('Yes')
        cy.getCy('questionnaire_question-title').contains('Can you speak any of the languages used in the destination?').should('exist')
        cy.getCy('questionnaire_question-title').contains('Can you speak their language?').should('not.exist')
    })


    it('changed question (open)', () => {
        // initialize questionnaire
        createQuestionnaire('vacation-planning', 6)

        // fill the answer, so the subtree is open
        project.open(projectName)
        project.selectAnswer('Yes')

        // initialize migration
        createMigrationTo('vacation-planning', 7)

        // check correct version
        cy.getCy('questionnaire_question-title').contains('Can you speak any of the languages used in the destination?').should('exist')
        cy.getCy('questionnaire_question-title').contains('Can you speak their language?').should('not.exist')
    })


    it('add choice', () => {
        // initialize questionnaire & migration
        createQuestionnaire('vacation-planning', 8)
        createMigrationTo('vacation-planning', 9)

        // check correct version
        cy.get('.questionnaireContent__option').contains('I will cook myself').should('exist')
    })


    it('edit choice', () => {
        // initialize questionnaire & migration
        createQuestionnaire('vacation-planning', 9)
        createMigrationTo('vacation-planning', 10)

        // check correct version
        cy.get('.questionnaireContent__option').contains('Restaurants or Hotels').should('exist')
    })


    it('delete choice', () => {
        // initialize questionnaire & migration
        createQuestionnaire('vacation-planning', 10)
        createMigrationTo('vacation-planning', 11)

        // check correct version
        cy.get('.questionnaireContent__option').contains('I will cook myself').should('not.exist')
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

        // check migrated things
        project.getQuestionContainer('Question 2').contains('Answer 1.1')
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
        project.getQuestionContainer('Question 7')
            .parents('.questionnaireContent__nest')
            .last()
            .next()
            .find('.btn')
            .contains('Add')
            .click()
        project.selectAnswer('Answer 8.2')
        project.typeAnswer('Question 9', 'Value')

        // initialize migration
        createMigrationTo('move-test', 3)

        // check migrated things
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
        project.getQuestionContainer('Question 7')
            .parents('.questionnaireContent__nest')
            .last()
            .next()
            .find('.btn')
            .contains('Add')
            .click()
        project.selectAnswer('Answer 8.2')
        project.typeAnswer('Question 9', 'Value')

        // initialize migration
        createMigrationTo('move-test', 4)

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

        // check migrated things
        project.checkAnswerNotChecked('Answer 1.1')
    })
})
