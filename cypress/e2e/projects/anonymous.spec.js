import * as project from '../../support/project-helpers'

describe('Anonymous projects', () => {
    const kmId = 'test-km-1'
    const questionUuid = 'd52ab630-2ef1-46fe-a6c0-6e4b93a9850f'
    let knowledgeModelPackageUuid

    const enableAnonymousProjects = () => {
        cy.loginAs('admin')
        cy.visitApp('/settings/projects')
        cy.checkToggle('questionnaireSharingAnonymousEnabled')
        cy.clickBtn('Save', true)
        cy.logout()
    }

    before(() => {
        cy.task('knowledgeModelPackage:delete', { km_id: kmId })
        cy.clearServerCache()

        cy.loginAs('admin')
        cy.importKM('test-km-1', (uuid) => {
            knowledgeModelPackageUuid = uuid
            
            cy.loginAs('datasteward')
            cy.visitApp(`/knowledge-models/${knowledgeModelPackageUuid}`)
            cy.clickDropdownAction('set-public')
            cy.logout()
        })
    })

    beforeEach(() => {
        cy.task('project:delete')
        cy.clearServerCache()
        cy.putDefaultAppConfig()
    })

    after(() => {
        cy.putDefaultAppConfig()
    })

    it('can be created', () => {
        // enable anonymous projects
        enableAnonymousProjects()

        // create project
        cy.visitApp(`/knowledge-models/${knowledgeModelPackageUuid}/preview`)
        cy.clickBtn('Create project')
        cy.url().should('contain', '/projects/')
        cy.get('.DetailNavigation__Row').should('exist')

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
        cy.visitApp(`/knowledge-models/${knowledgeModelPackageUuid}/preview?questionUuid=${questionUuid}`)
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
        cy.visitApp(`/knowledge-models/${knowledgeModelPackageUuid}/preview`)
        cy.clickBtn('Create project')
        cy.url().should('not.contain', 'preview')

        cy.url().then((projectUrl) => {
            // login
            cy.loginAs('researcher')
            cy.visit(projectUrl)
            cy.get('.DetailNavigation')

            // add to user projects
            cy.clickBtn('Add to my projects')
            cy.wait(1000)
            cy.contains('Add to my projects').should('not.exist')

            // disable sharing
            cy.get('.DetailNavigation')
            cy.clickBtn('Share')
            cy.uncheckToggle('sharingEnabled')
            cy.clickModalAction()

            // logout
            cy.logout()

            // check it is not available
            cy.visit(projectUrl)
            cy.get('.Public__Login').should('exist')
        })
    })
})