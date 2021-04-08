import * as project from '../../../../support/project-helpers'
import * as phases from '../../../../support/phases-helpers'

describe('Questionnaire Versions', () => {
    const projectName = 'Test Project'
    const kmId = 'basic-questionnaire-test-km'
    const packageId = 'dsw:basic-questionnaire-test-km:1.0.0'

    const openVersionHistory = () => {
        cy.get('.questionnaire__toolbar .item').contains('Version history').click()
    }

    const expectEventCount = (count) => {
        cy.get('.history-event').should('have.length', count)
    }

    const clickEventAction = (action, lastChild = true) => {
        cy.get(`.history-event:${lastChild ? 'last' : 'first'}-child .dropdown-toggle`).click()
        cy.get('.dropdown-item').contains(action).click({ force: true })
    }

    const nameVersion = (name, lastChild = true) => {
        clickEventAction('Name this version', lastChild)
        cy.fillFields({ name })
        cy.clickBtn('Save')
    }

    before(() => {
        cy.task('mongo:delete', {
            collection: 'packages',
            args: { kmId }
        })
        cy.task('mongo:delete', {
            collection: 'templates',
            args: { templateId: 'questionnaire-report' }
        })
        cy.clearServerCache()

        cy.fixture('templates/questionnaire-report.json').then(cy.importTemplate)
        cy.fixture(kmId).then(cy.importKM)
    })

    beforeEach(() => {
        cy.task('mongo:delete', {
            collection: 'questionnaires'
        })
        cy.task('mongo:delete', {
            collection: 'documents'
        })
        cy.task('mongo:delete', {
            collection: 'documentFs'
        })
        cy.clearServerCache()
        
        cy.createQuestionnaire({
            visibility: project.VisibleView,
            sharing: project.Restricted,
            name: projectName,
            packageId
        })
        cy.loginAs('researcher')
        project.open(projectName)
    })

    it('view questionnaire changes', () => {
        openVersionHistory()

        // answer
        project.selectAnswer('Answer 1.1')
        cy.get('.history-event').then($event => {
            cy.wrap($event).find('em').contains('Options Question 1').should('exist')
            cy.wrap($event).find('li').contains('Answer 1.1').should('exist')
            cy.wrap($event).find('.user').contains('Isaac Newton').should('exist')
        })

        // clear reply
        cy.get('.clear-answer').click()
        cy.get('.history-event').then($event => {
            cy.wrap($event).find('em').contains('Cleared reply of').should('exist')
            cy.wrap($event).find('em').contains('Options Question 1').should('exist')
            cy.wrap($event).find('.user').contains('Isaac Newton').should('exist')
        })

        // change phase
        phases.switchPhase('Before Finishing the Project')
        cy.get('.history-event:first-child').then($event => {
            cy.wrap($event).find('em').contains('Set phase to Before Finishing the Project').should('exist')
            cy.wrap($event).find('.user').contains('Isaac Newton').should('exist')
        })
    })

    it('view only latest edit event', () => {
        openVersionHistory()
        expectEventCount(0)
        project.typeAnswer('Value Question String', 'a')
        expectEventCount(1)
        project.typeAnswer('Value Question String', 'abcde')
        expectEventCount(1)
        project.typeAnswer('Value Question String', 'abcdefghijkl')
        expectEventCount(1)
    })

    it('name, rename and delete a version', () => {
        project.typeAnswer('Value Question String', 'Answer')

        // name
        openVersionHistory()
        nameVersion('1.0.0')
        cy.get('.history-event .badge-secondary').contains('1.0.0').should('exist')

        // rename
        clickEventAction('Rename this version')
        cy.fillFields({ name: '2.0.0' })
        cy.clickModalBtn('Save')
        cy.get('.history-event .badge-secondary').contains('1.0.0').should('not.exist')
        cy.get('.history-event .badge-secondary').contains('2.0.0').should('exist')

        // delete
        clickEventAction('Delete this version')
        cy.clickModalBtn('Delete')
        cy.get('.history-event .badge-secondary').should('not.exist')
    })

    it('revert to a version', () => {
        project.typeAnswer('Value Question String', 'Answer')
        project.selectAnswer('Answer 1.1')
        openVersionHistory()
        expectEventCount(2)

        clickEventAction('Revert to this version')
        cy.clickModalBtn('Revert')

        project.checkAnswerNotChecked('Answer 1.1')
        openVersionHistory()
        expectEventCount(1)
    })

    it('view questionnaire in a version', () => {
        // fill in one answer
        openVersionHistory()
        project.typeAnswer('Value Question String', 'Answer')

        // name that as version 1.0.0
        nameVersion('1.0.0')

        // select another answer
        project.selectAnswer('Answer 1.1')
        
        // open original version
        clickEventAction('View questionnaire')

        // check it has opened correctly
        cy.get('.QuestionnaireVersionViewModal .modal-header .badge-secondary').contains('1.0.0').should('exist')
        cy.get('.QuestionnaireVersionViewModal .modal-content label').contains('Answer 1.1').find('input').should('not.be.checked')
        cy.get('.QuestionnaireVersionViewModal .modal-content label').contains('Value Question String').closest('.form-group').find('input').should('have.value', 'Answer')

    })

    it('view only named versions', () => {
        openVersionHistory()

        project.typeAnswer('Value Question String', 'Answer')
        nameVersion('1.0.0', false)
        project.selectAnswer('Answer 1.1')
        project.selectAnswer('Choice 1')
        nameVersion('2.0.0', false)
        project.typeAnswerText('Value Question Text', 'Answer')

        expectEventCount(4)
        cy.contains('Named versions only').click()
        expectEventCount(2)
    })

    it('create a document from a version', () => {
        openVersionHistory()
        project.typeAnswer('Value Question String', 'Answer')
        nameVersion('1.0.0')
        project.selectAnswer('Answer 1.1')
        clickEventAction('Create document')

        cy.get('h2').contains('New document').should('exist')
        cy.get('.alert-info').contains('You are creating a document for a project version from').should('exist')

        cy.fillFields({ th_templateId: 'Questionnaire Report' })
        cy.contains('JSON Data').click()
        cy.clickBtn('Create')

        cy.url().should('match', /\/projects\/.+\/documents$/)
        cy.get('.title-row').contains(projectName).should('exist')
        cy.get('.badge-secondary').contains('1.0.0').should('exist')
    })
})
