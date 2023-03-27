import * as editor from '../../../support/editor-helpers'

describe('KM Editor Warnings', () => {
    const kmName = 'Test Knowledge Model'
    const kmId = 'test-km'

    beforeEach(() => {
        cy.task('branch:delete', { km_id: kmId })
        cy.clearServerCache()

        cy.createKMEditor({ kmId, name: kmName, version: '1.0.0', previousPackageId: null })
        cy.loginAs('datasteward')
        cy.visitApp('/km-editor')
        editor.open(kmId)
    })

    it('Chapter Title', () => {
        const chapter = {
            text: 'This chapter text'
        }
        editor.createChildren([['chapter', chapter]])

        cy.visitApp('/km-editor')
        editor.open(kmId)
        editor.expectWarningsCount(1)
        editor.openWarnings()
        cy.contains('Empty title for chapter').click()
        cy.checkFields(chapter)
    })

    it('Question Title', () => {
        const chapter = {
            title: 'Chapter 1',
            text: 'This chapter text'
        }
        const question = {
            text: 'This question text'
        }
        editor.createChildren([['chapter', chapter], ['question', question]])

        cy.visitApp('/km-editor')
        editor.open(kmId)
        editor.expectWarningsCount(2)
        editor.openWarnings()
        cy.contains('Empty title for question').click()
        cy.checkFields(question)
    })

    it('Question Answers', () => {
        const chapter = {
            title: 'Chapter 1',
            text: 'This chapter text'
        }
        const question = {
            title: 'Question 1',
            text: 'This question text'
        }
        editor.createChildren([['chapter', chapter], ['question', question]])

        cy.visitApp('/km-editor')
        editor.open(kmId)
        editor.expectWarningsCount(1)
        editor.openWarnings()
        cy.contains('No answers for options question').click()
        cy.checkFields(question)
    })

    it('Question Items', () => {
        const chapter = {
            title: 'Chapter 1',
            text: 'This chapter text'
        }
        const question = {
            s_type: 'List',
            title: 'Question 1',
            text: 'This question text'
        }
        editor.createChildren([['chapter', chapter], ['question', question]])

        cy.visitApp('/km-editor')
        editor.open(kmId)
        editor.expectWarningsCount(1)
        editor.openWarnings()
        cy.contains('No item questions for list question').click()
        cy.checkFields(question)
    })

    it('Question Choices', () => {
        const chapter = {
            title: 'Chapter 1',
            text: 'This chapter text'
        }
        const question = {
            s_type: 'MultiChoice',
            title: 'Question 1',
            text: 'This question text'
        }
        editor.createChildren([['chapter', chapter], ['question', question]])

        cy.visitApp('/km-editor')
        editor.open(kmId)
        editor.expectWarningsCount(1)
        editor.openWarnings()
        cy.contains('No choices for multi-choice question').click()
        cy.checkFields(question)
    })

    it('Question Integration', () => {
        const chapter = {
            title: 'Chapter 1',
            text: 'This chapter text'
        }
        const question = {
            s_type: 'Integration',
            title: 'Question 1',
            text: 'This question text'
        }
        editor.createChildren([['chapter', chapter], ['question', question]])

        cy.visitApp('/km-editor')
        editor.open(kmId)
        editor.expectWarningsCount(1)
        editor.openWarnings()
        cy.contains('No integration selected for integration question').click()
        cy.checkFields(question)
    })

    it('Answers Label', () => {
        const chapter = {
            title: 'Chapter 1',
            text: 'This chapter text'
        }
        const question = {
            title: 'Question 1',
            text: 'This question text'
        }
        const answer = {
            advice: 'This is advice'
        }
        editor.createChildren([
            ['chapter', chapter], 
            ['question', question],
            ['answer', answer]
        ])

        cy.visitApp('/km-editor')
        editor.open(kmId)
        editor.expectWarningsCount(1)
        editor.openWarnings()
        cy.contains('Empty label for answer').click()
        cy.checkFields(answer)
    })

    it('Choice Label', () => {
        const chapter = {
            title: 'Chapter 1',
            text: 'This chapter text'
        }
        const question = {
            s_type: 'MultiChoice',
            title: 'Question 1',
            text: 'This question text'
        }
        const choice = {}
        editor.createChildren([
            ['chapter', chapter], 
            ['question', question],
            ['choice', choice]
        ])

        cy.visitApp('/km-editor')
        editor.open(kmId)
        editor.expectWarningsCount(1)
        editor.openWarnings()
        cy.contains('Empty label for choice').click()
        cy.checkFields(choice)
    })

    it('Reference Short UUID', () => {
        const chapter = {
            title: 'Chapter 1',
            text: 'This chapter text'
        }
        const question = {
            s_type: 'Value',
            title: 'Question 1',
            text: 'This question text'
        }
        const reference = {
            s_type: 'ResourcePage',
        }
        editor.createChildren([
            ['chapter', chapter], 
            ['question', question],
            ['reference', reference]
        ])

        cy.visitApp('/km-editor')
        editor.open(kmId)
        editor.expectWarningsCount(1)
        editor.openWarnings()
        cy.contains('Empty short UUID for page reference').click()
        cy.checkFields(reference)
    })

    it('Reference URL', () => {
        const chapter = {
            title: 'Chapter 1',
            text: 'This chapter text'
        }
        const question = {
            s_type: 'Value',
            title: 'Question 1',
            text: 'This question text'
        }
        const reference = {
            s_type: 'URL',
            label: 'Reference'
        }
        editor.createChildren([
            ['chapter', chapter], 
            ['question', question],
            ['reference', reference]
        ])

        cy.visitApp('/km-editor')
        editor.open(kmId)
        editor.expectWarningsCount(1)
        editor.openWarnings()
        cy.contains('Empty URL for URL reference').click()
        cy.checkFields(reference)
    })

    it('Expert Email', () => {
        const chapter = {
            title: 'Chapter 1',
            text: 'This chapter text'
        }
        const question = {
            s_type: 'Value',
            title: 'Question 1',
            text: 'This question text'
        }
        const expert = {
            name: 'Leonard Armstrong',
        }
        editor.createChildren([
            ['chapter', chapter], 
            ['question', question],
            ['expert', expert]
        ])

        cy.visitApp('/km-editor')
        editor.open(kmId)
        editor.expectWarningsCount(1)
        editor.openWarnings()
        cy.contains('Empty email for expert').click()
        cy.checkFields(expert)
    })

    it('Metric Title', () => {
        const metric = {
            abbreviation: 'M',
        }
        editor.createChildren([
            ['metric', metric],
        ])

        cy.visitApp('/km-editor')
        editor.open(kmId)
        editor.expectWarningsCount(1)
        editor.openWarnings()
        cy.contains('Empty title for metric').click()
        cy.checkFields(metric)
    })

    it('Phase Title', () => {
        const phase = {
            description: 'This is phase',
        }
        editor.createChildren([
            ['phase', phase],
        ])

        cy.visitApp('/km-editor')
        editor.open(kmId)
        editor.expectWarningsCount(1)
        editor.openWarnings()
        cy.contains('Empty title for phase').click()
        cy.checkFields(phase)
    })

    it('Question Tag Name', () => {
        const tag = {
            description: 'This is question tag',
        }
        editor.createChildren([
            ['tag', tag],
        ])

        cy.visitApp('/km-editor')
        editor.open(kmId)
        editor.expectWarningsCount(1)
        editor.openWarnings()
        cy.contains('Empty name for tag').click()
        cy.checkFields(tag)
    })

    it('Integration API', () => {
        const integration = {
            name: 'API Integration',
        }
        editor.createChildren([
            ['integration', integration],
        ])

        const warnings = [
            'Empty ID for integration',
            'Empty request URL for integration',
            'Empty request HTTP method for integration',
            'Empty response item ID for integration',
            'Empty response item template for integration',
            'Empty item URL for integration',
        ]

        warnings.forEach(warning => {
            cy.visitApp('/km-editor')
            editor.open(kmId)
            editor.expectWarningsCount(6)
            editor.openWarnings()
            cy.contains(warning).click()
            cy.checkFields(integration)
        })
    })

    it('Integration Widget', () => {
        const integration = {
            s_type: 'Widget',
            name: 'Widget Integration',
        }
        editor.createChildren([
            ['integration', integration],
        ])

        const warnings = [
            'Empty ID for integration',
            'Empty widget URL for integration',
            'Empty item URL for integration',
        ]

        warnings.forEach(warning => {
            cy.visitApp('/km-editor')
            editor.open(kmId)
            editor.expectWarningsCount(3)
            editor.openWarnings()
            cy.contains(warning).click()
            cy.checkFields(integration)
        })
    })
})