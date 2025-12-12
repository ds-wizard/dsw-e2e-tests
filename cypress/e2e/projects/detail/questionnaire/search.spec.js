import * as project from '../../../../support/project-helpers'


describe('Questionnaire Search', () => {
    const projectName = 'Test Project'
    const kmId = 'test-km-1'
    const knowledgeModelPackageId = 'dsw:test-km-1:1.0.0'


    const search = (term, open = true) => {
        if (open) {
            cy.getCy('questionnaire-search').click()
        }
        cy.get('#questionnaire-search-input').clear().type(term)
        cy.contains('Results for: ' + term).should('exist')
    }

    const getFirstResult = () => {
        return cy.get('.questionnaire__right-panel .list-group-item').first()
    }

    const expectNoResults = () => {
        cy.getCy('flash_alert-info').contains('No results')
    }

    before(() => {
        cy.task('knowledgeModelPackage:delete', { km_id: kmId })
        cy.clearServerCache()

        cy.importKM(kmId)
    })

    beforeEach(() => {
        cy.task('project:delete')
        cy.clearServerCache()

        cy.createProject({
            visibility: project.VisibleView,
            sharing: project.Restricted,
            name: projectName,
            knowledgeModelPackageId
        })
        cy.loginAs('researcher')
        project.open(projectName)
    })

    it('search in chapter title', () => {
        search('Chapter 1')
        getFirstResult().click()
        cy.get('.questionnaire__form').should('have.class', 'scroll-target-highlight')
    })

    it('search in chapter description', () => {
        search('chapter text')
        getFirstResult().click()
        cy.get('.questionnaire__form').should('have.class', 'scroll-target-highlight')
    })

    it('search in question title', () => {
        search('multi-choice question')
        getFirstResult().click()
        cy.get('#question-5def822c-4d94-40a3-94dc-d8569567357b').should('have.class', 'scroll-target-highlight')
    })

    it('search in question description', () => {
        search('cross-referencing')
        getFirstResult().click()
        cy.get('#question-18d8316d-a126-4b44-9c41-dafb8b37a127').should('have.class', 'scroll-target-highlight')
    })

    it('search in answer', () => {
        search('answer 1')
        getFirstResult().click()
        cy.get('#question-49cdf436-5de7-43d9-8226-a33dfabbce3e').should('have.class', 'scroll-target-highlight')
    })

    it('search in choice', () => {
        search('choice 2')
        getFirstResult().click()
        cy.get('#question-1d277ab7-d8dc-46d7-b42d-7b7e2dbf8cd1').should('have.class', 'scroll-target-highlight')
    })

    it('search in value question', () => {
        project.typeAnswer('Value Question 1', 'zebra')
        search('zebra')
        getFirstResult().click()
        cy.get('#question-0cfd88c9-13ea-41b2-b4e8-1a1ab98bac6c').should('have.class', 'scroll-target-highlight')
    })

    it('search in closed follow-up question', () => {
        // fill in the nested value question
        project.selectAnswer('Answer 1')
        project.typeAnswer('Follow-up Question 4', 'lion')

        // check we can find it
        search('lion')
        getFirstResult().should('exist')

        // also check we can find the follow-up question itself
        search('Follow-up Question 4', false)
        getFirstResult().should('exist')

        // clear the answer and search again
        project.clearAnswer('Answer 1')
        search('lion', false)
        expectNoResults()

        // also search for follow-up question that is no longer visible
        search('Follow-up Question 4', false)
        expectNoResults()
    })

    it('search in deleted item', () => {
        // add item and fill the value question
        cy.clickBtn('Add')
        project.typeAnswer('Answer Item Question 4', 'dolphin')

        // check we can find it
        search('dolphin')
        getFirstResult().should('exist')

        // also check we can find the question itself
        search('Answer Item Question 4', false)
        getFirstResult().should('exist')

        // delete the item and search again
        cy.getCy('item-delete').click()
        cy.clickModalAction()
        search('dolphin', false)
        expectNoResults()

        // also search for question that is no longer present
        search('Answer Item Question 4', false)
        expectNoResults()
    })
})
