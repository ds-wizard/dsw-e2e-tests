import * as project from '../../support/project-helpers'
import { dataCy } from '../../support/utils'

describe('Project Tagging', () => {

    const defaultProjectName = 'Test Project'
    const kmId = 'test-km-1'
    const packageId = 'dsw:test-km-1:1.0.0'
    const packageName = 'Test Knowledge Model 1'

    before(() => {
        cy.task('package:delete', { km_id: kmId })
        cy.clearServerCache()

        cy.importKM('test-km-1')
    })

    beforeEach(() => {
        cy.task('questionnaire:delete')
        cy.putDefaultAppConfig()
    })

    const createProject = () => {
        project.create(defaultProjectName, packageName)
    }

    const createProjectWithTags = (projectName, projectTags) => {
        project.create(projectName, packageName)
        project.openSettings()
        projectTags.forEach(project.addProjectTag)
        project.saveSettings()
    }


    it('add and remove project tags', () => {
        cy.loginAs('researcher')
        createProject()

        // add some tags and save
        project.openSettings()
        project.addProjectTag('Biology')
        project.addProjectTag('Physics')
        project.addProjectTag('Chemistry')
        project.addProjectTag('Math')
        project.addProjectTag('History')
        project.saveSettings()


        // go back to setting and check that the tags are there
        project.open(defaultProjectName)
        project.openSettings()
        project.expectProjectTag('Biology')
        project.expectProjectTag('Physics')
        project.expectProjectTag('Chemistry')
        project.expectProjectTag('Math')
        project.expectProjectTag('History')


        // remove some tags and save
        project.removeProjectTag('Biology')
        project.removeProjectTag('History')
        project.saveSettings()

        // go back to setting and check that the tags are saved correctly
        project.open(defaultProjectName)
        project.openSettings()
        project.expectProjectTag('Physics')
        project.expectProjectTag('Chemistry')
        project.expectProjectTag('Math')
        project.expectProjectTag('Biology', false)
        project.expectProjectTag('History', false)
    })


    it('suggest settings tags', () => {
        // add some tags to settings
        cy.loginAs('admin')
        cy.visitApp('/settings/projects')
        cy.fillFields({ projectTaggingTags: 'Electrical Engineering\nIndustrial Engineering\nAncient History' })
        cy.submitForm()
        cy.logout()

        // check that it suggest tags from settings
        cy.loginAs('researcher')
        createProject()
        project.openSettings()
        cy.get('#projectTag').focus()
        project.expectProjectTagSuggestion('Electrical Engineering')
        project.expectProjectTagSuggestion('Industrial Engineering')
        project.expectProjectTagSuggestion('Ancient History')

        // type something and check it filters the suggestions
        cy.get('#projectTag').type('Engineering')
        project.expectProjectTagSuggestion('Electrical Engineering')
        project.expectProjectTagSuggestion('Industrial Engineering')
        project.expectProjectTagSuggestion('Ancient History', false)

        // add some and check that they are no longer suggested
        project.pickProjectTagSuggestion('Electrical Engineering')
        project.expectProjectTag('Electrical Engineering')
        cy.get('#projectTag').focus()
        project.expectProjectTagSuggestion('Electrical Engineering', false)
        project.expectProjectTagSuggestion('Industrial Engineering')
        project.expectProjectTagSuggestion('Ancient History')
    })


    it('suggest tags from other projects', () => {
        // create projects with some tags
        cy.loginAs('researcher')
        createProjectWithTags('Project 1', ['Abstract Algebra', 'Linear Algebra'])
        createProjectWithTags('Project 2', ['Organic Chemistry'])

        // create a different project and check that it suggest tags from the previous one
        createProject()
        project.openSettings()
        cy.get('#projectTag').focus()
        project.expectProjectTagSuggestion('Abstract Algebra')
        project.expectProjectTagSuggestion('Linear Algebra')
        project.expectProjectTagSuggestion('Organic Chemistry')


        // type something and check it filters the suggestions
        cy.get('#projectTag').type('Algebra')
        project.expectProjectTagSuggestion('Abstract Algebra')
        project.expectProjectTagSuggestion('Linear Algebra')
        project.expectProjectTagSuggestion('Organic Chemistry', false)

        // add some and check that they are no longer suggested
        project.pickProjectTagSuggestion('Linear Algebra')
        project.expectProjectTag('Linear Algebra')
        cy.get('#projectTag').focus()
        project.expectProjectTagSuggestion('Abstract Algebra')
        project.expectProjectTagSuggestion('Linear Algebra', false)
        project.expectProjectTagSuggestion('Organic Chemistry')
    })


    const filterTests = [{
        operator: 'OR',
        projects: [{
            name: 'Project 1',
            tags: ['Abstract Algebra', 'Electrical Engineering']
        }, {
            name: 'Project 2',
            tags: ['Organic Chemistry', 'Industrial Engineering']
        }, {
            name: 'Project 3',
            tags: ['Abstract Algebra', 'Linear Algebra', 'Industrial Engineering']
        }, {
            name: 'Project 4',
            tags: ['Industrial Engineering']
        }, {
            name: 'Project 5',
            tags: ['Abstract Algebra', 'Linear Algebra']
        }, {
            name: 'Project 6',
            tags: []
        }],
        systemTags: [
            'Electrical Engineering',
            'Industrial Engineering',
            'Ancient History'
        ],
        testCases: [{
            tags: [],
            visibleProjects: ['Project 1', 'Project 2', 'Project 3', 'Project 4', 'Project 5', 'Project 6'],
            hiddenProjects: []
        }, {
            tags: ['Ancient History'],
            visibleProjects: [],
            hiddenProjects: ['Project 1', 'Project 2', 'Project 3', 'Project 4', 'Project 5', 'Project 6']
        }, {
            tags: ['Industrial Engineering'],
            visibleProjects: ['Project 2', 'Project 3', 'Project 4'],
            hiddenProjects: ['Project 1', 'Project 5', 'Project 6']
        }, {
            tags: ['Abstract Algebra', 'Linear Algebra'],
            visibleProjects: ['Project 1', 'Project 3', 'Project 5'],
            hiddenProjects: ['Project 2', 'Project 4', 'Project 6']
        }, {
            tags: ['Abstract Algebra', 'Linear Algebra', 'Industrial Engineering'],
            visibleProjects: ['Project 1', 'Project 2', 'Project 3', 'Project 4', 'Project 5'],
            hiddenProjects: ['Project 6']
        }]
    }, {
        operator: 'AND',
        projects: [{
            name: 'Project 1',
            tags: ['Abstract Algebra', 'Electrical Engineering']
        }, {
            name: 'Project 2',
            tags: ['Organic Chemistry', 'Industrial Engineering']
        }, {
            name: 'Project 3',
            tags: ['Abstract Algebra', 'Linear Algebra', 'Industrial Engineering']
        }, {
            name: 'Project 4',
            tags: ['Ancient History', 'Industrial Engineering']
        }, {
            name: 'Project 5',
            tags: ['Abstract Algebra', 'Linear Algebra']
        }, {
            name: 'Project 6',
            tags: []
        }],
        systemTags: [
            'Electrical Engineering',
            'Industrial Engineering',
            'Ancient History'
        ],
        testCases: [{
            tags: [],
            visibleProjects: ['Project 1', 'Project 2', 'Project 3', 'Project 4', 'Project 5', 'Project 6'],
            hiddenProjects: []
        }, {
            tags: ['Ancient History', 'Linear Algebra'],
            visibleProjects: [],
            hiddenProjects: ['Project 1', 'Project 2', 'Project 3', 'Project 4', 'Project 5', 'Project 6']
        }, {
            tags: ['Industrial Engineering'],
            visibleProjects: ['Project 2', 'Project 3', 'Project 4'],
            hiddenProjects: ['Project 1', 'Project 5', 'Project 6']
        }, {
            tags: ['Abstract Algebra', 'Linear Algebra'],
            visibleProjects: ['Project 3', 'Project 5'],
            hiddenProjects: ['Project 1', 'Project 2', 'Project 4', 'Project 6']
        }, {
            tags: ['Abstract Algebra', 'Linear Algebra', 'Industrial Engineering'],
            visibleProjects: ['Project 3'],
            hiddenProjects: ['Project 1', 'Project 2', 'Project 4', 'Project 5', 'Project 6']
        }]
    }]

    filterTests.forEach(({ operator, projects, systemTags, testCases }) => {
        it.only(`filter by tags using ${operator}`, () => {
            // create some system tags
            cy.loginAs('admin')
            cy.visitApp('/settings/projects')
            cy.fillFields({ projectTaggingTags: systemTags.join('\n') })
            cy.submitForm()
            cy.logout()

            // create a handful of projects with different tags and system tags
            cy.loginAs('researcher')
            projects.forEach((project) => createProjectWithTags(project.name, project.tags))

            // try some filtering combinations and check the correct projects are returned
            testCases.forEach((testCase) => {
                cy.visitApp('/projects')

                cy.get('#filter-projectTags').click()
                cy.getCy(`filter_projectTags_operator_${operator}`).click()
                cy.url().should('contain', encodeURIComponent(operator))

                testCase.tags.forEach((tag) => {
                    cy.get('#filter-projectTags').click()
                    cy.get('#filter-projectTags').find(dataCy('project_filter_tags_option')).contains(tag).click()
                    cy.url().should('contain', encodeURIComponent(tag))
                })

                cy.wait(1000)

                if (testCase.visibleProjects.length > 0) {
                    cy.get('.list-group-item').its('length').should('eq', testCase.visibleProjects.length)

                    testCase.visibleProjects.forEach((project) => {
                        cy.get('.list-group-item').contains(project).should('exist')
                    })

                    testCase.hiddenProjects.forEach((project) => {
                        cy.get('.list-group-item').contains(project).should('not.exist')
                    })
                } else {
                    cy.expectEmptyListing()
                }
            })
        })
    })
})
