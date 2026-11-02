import * as project from '../../../../support/project-helpers'


describe('Questionnaire Search', () => {
    const projectName = 'Test Project'
    const kmId = 'test-km-1'
    let knowledgeModelPackageUuid


    const search = (term, open = true) => {
        if (open) {
            cy.getCy('questionnaire-search').click()
        }
        cy.get('#questionnaire-search-input').clear().type(term)
        cy.contains('Results for: ' + term).should('exist')
    }

    const getFirstResult = () => {
        return cy.getCy('questionnaire_search').find('.list-group-item').first()
    }

    const expectNoResults = () => {
        cy.getCy('flash_alert-info').contains('No results')
    }

    const expectHighlightedQuestion = (questionTitle) => {
        project.getQuestionContainer(questionTitle)
            .find('.questionnaireContent__questionHeader')    
            .should('have.class', 'questionnaireContent__scrollTargetHighlight')
    }

    before(() => {
        cy.task('knowledgeModelPackage:delete', { km_id: kmId })
        cy.clearServerCache()

        cy.importKM(kmId, (uuid) => {
            knowledgeModelPackageUuid = uuid
        })
    })

    beforeEach(() => {
        cy.task('project:delete')
        cy.clearServerCache()

        cy.createProject({
            visibility: project.VisibleView,
            sharing: project.Restricted,
            name: projectName,
            knowledgeModelPackageUuid
        })
        cy.loginAs('researcher')
        project.open(projectName)
    })

    it('search in chapter title', () => {
        search('Chapter 1')
        getFirstResult().click()
        cy.get('.questionnaireContent__chapter').should('have.class', 'questionnaireContent__scrollTargetHighlight')
    })

    it('search in chapter description', () => {
        search('chapter text')
        getFirstResult().click()
        cy.get('.questionnaireContent__chapter').should('have.class', 'questionnaireContent__scrollTargetHighlight')
    })

    it('search in question title', () => {
        search('multi-choice question')
        getFirstResult().click()
        expectHighlightedQuestion('Multi-Choice Question 1')
    })

    it('search in question description', () => {
        search('cross-referencing')
        getFirstResult().click()
        expectHighlightedQuestion('Reference Question 2')
    })

    it('search in answer', () => {
        search('answer 1')
        getFirstResult().click()
        expectHighlightedQuestion('Options Question 1')
    })

    it('search in choice', () => {
        search('choice 2')
        getFirstResult().click()
        expectHighlightedQuestion('Question 2')
    })

    it('search in value question', () => {
        project.typeAnswer('Value Question 1', 'zebra')
        search('zebra')
        getFirstResult().click()
        expectHighlightedQuestion('Value Question 1')
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
        project.clearAnswer('Options Question 1')
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
