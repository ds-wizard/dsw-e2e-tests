import * as project from '../../support/project-helpers'

describe('Knowledge Models / Preview', () => {
    const kmId = 'test-km-1'
    const questionUuid = 'd52ab630-2ef1-46fe-a6c0-6e4b93a9850f'
    const kmName = 'Test Knowledge Model 1'
    let knowledgeModelPackageUuid

    before(() => {
        cy.task('knowledgeModelPackage:delete', { km_id: kmId })
        cy.clearServerCache()

        cy.importKM('test-km-1', (uuid) => {
            knowledgeModelPackageUuid = uuid

            cy.loginAs('datasteward')
            cy.visitApp(`/knowledge-models/${knowledgeModelPackageUuid}`)
            cy.clickDropdownAction('set-public')
            cy.logout()
        })
    })

    const tests = [{
        anonymous: true,
        withQuestionUuid: false
    }, {
        anonymous: true,
        withQuestionUuid: true
    }, {
        anonymous: false,
        withQuestionUuid: false
    }, {
        anonymous: false,
        withQuestionUuid: true
    }]

    tests.forEach(({ anonymous, withQuestionUuid }) => {
        it(`${anonymous ? 'anonymous' : 'logged-in'} user${withQuestionUuid ? ' with question uuid' : ''}`, () => {
            if (!anonymous) {
                cy.loginAs('researcher')
            }

            cy.visitApp(`/knowledge-models/${knowledgeModelPackageUuid}/preview${withQuestionUuid ? `?questionUuid=${questionUuid}` : ''}`)
            cy.get('.top-header').contains(kmName).should('exist')

            if (withQuestionUuid) {
                project.checkAnswerChecked('Answer 2')
                project.checkAnswerChecked('Answer 3')
                cy.getCy('questionnaire_question-title').contains('Deep Nested Answer Item Question').should('exist')
            }
        })
    })
})
