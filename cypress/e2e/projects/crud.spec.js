import * as packages from '../../support/packages-helpers'
import * as project from '../../support/project-helpers'

describe('Project CRUD', () => {
    const projectName = 'Test Project'
    const otherProjectName = 'Original Test Project'
    const kmId = 'test-km-1'
    const packageName = 'Test Knowledge Model 1'
    const knowledgeModelPackageId = 'dsw:test-km-1:1.0.0'
    let knowledgeModelPackageUuid


    before(() => {
        cy.task('knowledgeModelPackage:delete', { km_id: kmId })
        cy.clearServerCache()

        cy.importKM('test-km-1')
        packages.getPackageUuid(knowledgeModelPackageId).then((uuid) => {
            knowledgeModelPackageUuid = uuid
        })
    })


    beforeEach(() => {
        cy.task('project:delete')
        cy.clearServerCache()

        cy.loginAs('researcher')
    })


    it('create project', () => {
        cy.visitApp('/projects')
        cy.getCy('projects_create-button').click()
        cy.fillFields({
            name: projectName,
            th_knowledgeModelPackageUuid: packageName
        })

        cy.clickBtn('Create')
        cy.url().should('contain', '/projects/')

        cy.visitApp('/projects')
        cy.getListingItem(projectName).should('contain', packageName)
    })


    it('update project', () => {
        const p = {
            visibility: project.VisibleView,
            sharing: project.Restricted,
            name: otherProjectName,
            knowledgeModelPackageUuid
        }
        
        cy.createProject(p)
        project.open(otherProjectName)
        project.openSettings()


        cy.fillFields({ name: projectName })
        cy.clickBtn('Save')

        cy.visitApp('/projects')
        cy.expectListingItemNotExist(p.name)
        cy.getListingItem(projectName).should('contain', packageName)
    })


    it('delete project', () => {
        const p = {
            visibility: project.VisibleView,
            sharing: project.Restricted,
            name: projectName,
            knowledgeModelPackageUuid
        }
        cy.createProject(p)
        project.open(projectName)
        project.openSettings()

        cy.clickBtn('Delete this project', true)
        cy.get('.modal-title').should('be.visible').and('contain', 'Delete Project')
        cy.get('.btn-danger').contains('Delete').click()

        cy.expectEmptyListing(p.name)
    })
})
