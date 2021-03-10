import * as project from '../../../../support/project-helpers'

describe('Share project with other user', () => {
    const projectName = 'My Questionnaire'
    const kmId = 'test-km-1'
    const packageName = 'Test Knowledge Model 1'

    before(() => {
        cy.task('mongo:delete', {
            collection: 'packages',
            args: { kmId }
        })
        cy.clearServerCache()

        cy.fixture('test-km-1').then((km) => {
            cy.importKM(km)
        })
    })

    beforeEach(() => {
        cy.task('mongo:delete', {
            collection: 'questionnaires',
            args: {}
        })
        cy.clearServerCache()
    })

    const testCases = [{
        perms: 'Viewer',
        expectResult: project.expectViewer
    }, {
        perms: 'Editor',
        expectResult: project.expectEditor
    }, {
        perms: 'Owner',
        expectResult: project.expectOwner
    }]

    testCases.forEach(({ perms, expectResult}) => {
        it(`Add user as ${perms}`, () => {
            // create project
            cy.loginAs('datasteward')
            project.create(projectName, packageName)
    
            // add other user
            cy.clickBtn('Share')
            cy.fillFields({ th_memberId: 'Isaac Newton' })
            cy.fillFields({ 's_permissions\\.1\\.perms': perms })
            cy.clickBtn('Save')
            cy.logout()
    
            // check result
            cy.loginAs('researcher')
            project.open(projectName)
            expectResult()
        })
    })

    it('Remove user', () => {
        // create project
        cy.loginAs('datasteward')
        project.create(projectName, packageName)

        // add other user
        cy.clickBtn('Share')
        cy.fillFields({ th_memberId: 'Isaac Newton' })
        cy.fillFields({ 's_permissions\\.1\\.perms': 'Editor' })
        cy.clickBtn('Save')
        cy.logout()

            
        // check other user can access the project
        cy.loginAs('researcher')
        project.open(projectName)
        project.expectEditor()
        cy.logout()

        // remove other user
        cy.loginAs('datasteward')
        project.open(projectName)
        cy.clickBtn('Share')
        cy.get('.user-row:first-child .text-danger').click()
        cy.clickBtn('Save')
        cy.logout()

        // check other user cannot acces the project
        cy.loginAs('researcher')
        cy.visitApp('/projects')
        cy.expectEmptyListing()
    })
})