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

    const clickEventAction = (action, child = 'last-child') => {
        const parentSelector = `.history-event:${child}`
        cy.get(`${parentSelector} .dropdown-toggle`).click()
        cy.get(`${parentSelector} .dropdown-item`).contains(action).click({ force: true })
    }

    const nameVersion = (name, child = 'last-child') => {
        clickEventAction('Name this version', child)
        cy.fillFields({ name })
        cy.clickBtn('Save')
    }

    before(() => {
        cy.task('package:delete', { km_id: kmId })
        cy.removeTemplate('dsw:questionnaire-report:1.4.0')
        cy.clearServerCache()

        cy.importKM(kmId)
        cy.importTemplate('templates/questionnaire-report.zip')
    })

    beforeEach(() => {
        cy.clearLocalStorage()

        cy.task('questionnaire:delete')
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
        expectEventCount(1)
        project.typeAnswer('Value Question String', 'a')
        expectEventCount(2)
        project.typeAnswer('Value Question String', 'abcde')
        expectEventCount(2)
        project.typeAnswer('Value Question String', 'abcdefghijkl')
        expectEventCount(2)
    })

    it('name, rename and delete a version', () => {
        project.typeAnswer('Value Question String', 'Answer')

        // name
        openVersionHistory()
        nameVersion('1.0.0')
        cy.get('.history-event .badge.bg-secondary').contains('1.0.0').should('exist')

        // rename
        clickEventAction('Rename this version')
        cy.fillFields({ name: '2.0.0' })
        cy.clickModalAction()
        cy.get('.history-event .badge.bg-secondary').contains('1.0.0').should('not.exist')
        cy.get('.history-event .badge.bg-secondary').contains('2.0.0').should('exist')

        // delete
        clickEventAction('Delete this version')
        cy.clickModalAction()
        cy.get('.history-event .badge.bg-secondary').should('not.exist')
    })

    it('revert to a version', () => {
        project.typeAnswer('Value Question String', 'Answer')
        project.selectAnswer('Answer 1.1')
        openVersionHistory()
        expectEventCount(3)

        clickEventAction('Revert to this version', 'nth-child(2)')
        cy.clickModalAction()

        cy.expectModalOpen('project-version', false)
        cy.get('.history').should('not.exist')
        expectEventCount(2)
        project.checkAnswerNotChecked('Answer 1.1')
    })

    it('view questionnaire in a version', () => {
        // fill in one answer
        openVersionHistory()
        project.typeAnswer('Value Question String', 'Answer')
        project.awaitSave()

        // name that as version 1.0.0
        nameVersion('1.0.0', 'first-child')

        // select another answer
        project.selectAnswer('Answer 1.1')

        cy.wait(10000)

        // open original version
        clickEventAction('View questionnaire', 'nth-child(2)')

        // check it has opened correctly
        cy.get('.QuestionnaireVersionViewModal .modal-header .badge.bg-secondary').contains('1.0.0').should('exist')
        cy.get('.QuestionnaireVersionViewModal .modal-content label').contains('Answer 1.1').find('input').should('not.be.checked')
        cy.get('.QuestionnaireVersionViewModal .modal-content label').contains('Value Question String').closest('.form-group').find('input').should('have.value', 'Answer')

    })

    it('view only named versions', () => {
        openVersionHistory()

        project.typeAnswer('Value Question String', 'Answer')
        project.awaitSave()
        nameVersion('1.0.0', 'first-child')
        project.selectAnswer('Answer 1.1')
        project.selectAnswer('Choice 1')
        project.awaitSave()
        nameVersion('2.0.0', 'first-child')
        project.typeAnswerText('Value Question Text', 'Answer')

        expectEventCount(5)
        cy.contains('Named versions only').click()
        expectEventCount(2)
    })

    it('create a document from a version', () => {
        openVersionHistory()
        project.typeAnswer('Value Question String', 'Answer')
        nameVersion('1.0.0')
        project.selectAnswer('Answer 1.1')
        clickEventAction('Create document')

        cy.get('h2').contains('New Document').should('exist')
        cy.get('.alert-info').contains('You are creating a document for a project version from').should('exist')

        cy.fillFields({ th_documentTemplateId: 'Questionnaire Report' })
        cy.contains('JSON Data').click()
        cy.clickBtn('Create')

        cy.url().should('match', /\/projects\/.+\/documents$/)
        cy.get('.title-row').contains(projectName).should('exist')
        cy.get('.badge.bg-secondary').contains('1.0.0').should('exist')
    })
})
