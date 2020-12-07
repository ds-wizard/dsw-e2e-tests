import * as project from '../../support/project-helpers'

describe('Project CRUD', () => {
    const projectName = 'Test Project'
    const otherProjectName = 'Original Test Project'
    const kmId = 'test-km-1'
    const packageName = 'Test Knowledge Model 1'
    const packageId = 'dsw:test-km-1:1.0.0'


    before(() => {
        cy.task('mongo:delete', {
            collection: 'packages',
            args: { kmId }
        })
        cy.fixture('test-km-1').then((km) => {
            cy.importKM(km)
        })
    })


    beforeEach(() => {
        cy.task('mongo:delete', {
            collection: 'questionnaires',
            args: {}
        })

        cy.loginAs('researcher')
    })


    it('create project', () => {
        cy.visitApp('/projects')

        cy.clickBtn('Create')
        cy.fillFields({
            name: projectName,
            th_packageId: packageName
        })

        cy.clickBtn('Save')
        cy.url().should('contain', '/projects/')

        cy.visitApp('/projects')
        cy.getListingItem(projectName).should('contain', packageId)
    })


    it('update questionnaire', () => {
        const p = {
            visibility: project.VisibleView,
            sharing: project.Restricted,
            name: otherProjectName,
            packageId
        }
        
        cy.createQuestionnaire(p)
        project.open(otherProjectName)
        project.openSettings()


        cy.fillFields({ name: projectName })
        cy.clickBtn('Save')

        cy.visitApp('/projects')
        cy.expectListingItemNotExist(p.name)
        cy.getListingItem(projectName).should('contain', packageId)
    })


    it('delete questionnaire', () => {
        const p = {
            visibility: project.VisibleView,
            sharing: project.Restricted,
            name: projectName,
            packageId
        }
        cy.createQuestionnaire(p)
        project.open(projectName)
        project.openSettings()

        cy.clickBtn('Delete this Project')
        cy.get('.modal-title').should('be.visible').and('contain', 'Delete Project')
        cy.get('.btn-danger').contains('Delete').click()

        cy.expectEmptyListing(p.name)
    })
})
