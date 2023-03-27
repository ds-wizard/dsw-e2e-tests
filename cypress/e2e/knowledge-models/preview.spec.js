import * as project from '../../support/project-helpers'

describe('Knowledge Models / Preview', () => {
    const orgId = 'dsw'
    const kmId = 'test-km-1'
    const packageId = 'dsw:test-km-1:1.0.0'
    const questionUuid = 'd52ab630-2ef1-46fe-a6c0-6e4b93a9850f'
    const kmName = 'Test Knowledge Model 1'

    before(() => {
        cy.task('package:delete', { km_id: kmId })
        cy.clearServerCache()

        cy.importKM('test-km-1')

        cy.putDefaultAppConfig()

        // enable public km
        cy.loginAs('admin')
        cy.visitApp('/settings/knowledge-models')
        cy.checkToggle('publicEnabled')
        cy.getCy('form-group_list_add-button').contains('Add knowledge model').click()
        cy.fillFields({
            'publicPackages\\.0\\.orgId': orgId,
            'publicPackages\\.0\\.kmId': kmId
        })
        cy.clickBtn('Save')
        cy.logout()
    })

    after(() => {
        cy.putDefaultAppConfig()
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

            cy.visitApp(`/knowledge-models/${packageId}/preview${withQuestionUuid ? `?questionUuid=${questionUuid}` : ''}`)
            cy.get('.top-header').contains(kmName).should('exist')

            if (withQuestionUuid) {
                project.checkAnswerChecked('Answer 2')
                project.checkAnswerChecked('Answer 3')
                cy.get('label').contains('Deep Nested Answer Item Question').should('exist')
            }
        })
    })
})
