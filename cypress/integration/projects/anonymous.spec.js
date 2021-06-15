import * as project from '../../support/project-helpers'

describe('Anonymous projects', () => {
    const orgId = 'dsw'
    const kmId = 'test-km-1'
    const packageId = 'dsw:test-km-1:1.0.0'
    const questionUuid = 'd52ab630-2ef1-46fe-a6c0-6e4b93a9850f'
    const kmName = 'Test Knowledge Model 1'

    const enableAnonymousProjects = () => {
        cy.visitApp('/settings/projects')
        cy.checkToggle('questionnaireSharingAnonymousEnabled')
        cy.clickBtn('Save', true)
        cy.logout()
    }

    before(() => {
        cy.task('package:delete', { km_id: kmId })
        cy.clearServerCache()

        cy.importKM('test-km-1')
    })

    beforeEach(() => {
        cy.task('questionnaire:delete')
        cy.clearServerCache()
        cy.putDefaultAppConfig()

        // enable public km
        cy.loginAs('admin')
        cy.visitApp('/settings/knowledge-models')
        cy.checkToggle('publicEnabled')
        cy.get('.btn-secondary').contains('Add').click()
        cy.fillFields({
            'publicPackages\\.0\\.orgId': orgId,
            'publicPackages\\.0\\.kmId': kmId
        })
        cy.clickBtn('Save')
    })

    after(() => {
        cy.putDefaultAppConfig()
    })

    it('can be created', () => {
        // enable anonymous projects
        enableAnonymousProjects()

        // create project
        cy.visitApp(`/knowledge-models/${packageId}/preview`)
        cy.clickBtn('Create project')
        cy.url().should('contain', '/projects/')

        // edit something
        project.selectAnswer('Answer 1')

        // reopen and check answer was saved
        cy.reload()
        project.checkAnswerChecked('Answer 1')
    })

    it('can be created with question uuid', () => {
        // enable anonymous projects
        enableAnonymousProjects()

        // create project
        cy.visitApp(`/knowledge-models/${packageId}/preview?questionUuid=${questionUuid}`)
        cy.clickBtn('Create project')

        // check that the answer is selected
        project.checkAnswerChecked('Answer 2')
        project.checkAnswerChecked('Answer 3')
        cy.get('label').contains('Deep Nested Answer Item Question').should('exist')
    })

    it('can be added to user projects', () => {
        // enable anonymous projects
        enableAnonymousProjects()

        // create project
        cy.visitApp(`/knowledge-models/${packageId}/preview`)
        cy.clickBtn('Create project')

        cy.url().then((projectUrl) => {
            // login
            cy.loginAs('researcher')
            cy.visit(projectUrl)
            cy.get('.DetailNavigation')

            // add to user projects
            cy.clickBtn('Add to my projects')
            cy.contains('Add to my projects').should('not.exist')
            
            // disable sharing
            cy.get('.DetailNavigation')
            cy.clickBtn('Share')
            cy.uncheckToggle('sharingEnabled')
            cy.clickModalBtn('Save')

            // logout
            cy.logout()

            // check it is not available
            cy.visit(projectUrl)
            cy.get('.Public__Login').should('exist')
        })
    })
})