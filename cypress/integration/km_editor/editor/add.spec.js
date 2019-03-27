describe('KM Editor add entity', () => {
    const kmName = 'Test Knowledge Model'
    const kmId = 'test-km'

    const openEditor = () => {
        cy.clickIndexTableAction(kmId, 'Open Editor')
        cy.url().should('contain', '/km-editor/edit')
    }

    const saveEditor = () => {
        cy.get('.btn').contains('Save').click()
    }

    const addInputChild = (child) => {
        cy.get('.link-add-child').contains(`Add ${child}`).click()
    }

    const openChild = (child) => {
        cy.get('.input-child a').contains(child).click()
    }

    const fillFields = (fields) => {
        Object.entries(fields).forEach(([key, value]) => {
            if (key.startsWith('s_')) {
                key = key.replace(/^s_/, '')
                cy.get(`#${key}`).select(value)
            } else {
                if (value.length > 0) {
                    cy.get(`#${key}`).clear().type(value)
                } else {
                    cy.get(`#${key}`).clear()
                }
            }
        })
    }

    const checkFields = (fields) => {
        Object.entries(fields).forEach(([key, value]) => {
            key = key.replace(/^s_/, '')
            cy.get(`#${key}`).should('have.value', value)
        })
    }


    beforeEach(() => {
        cy.task('mongo:delete', {
            collection: 'branches',
            args: { kmId }
        })
        cy.createKMEditor({ kmId, name: kmName, parentPackageId: null })
        cy.loginAs('datasteward')
        cy.visitApp('/km-editor')
        openEditor()
    })


    it('add Chapter', () => {
        const chapter = {
            title: 'My Awesome Chapter',
            text: 'This chapter is awesome'
        }

        // Add chapter and save
        addInputChild('chapter')
        fillFields(chapter)
        saveEditor()

        // Open editor again and check that the chapter is there
        openEditor()
        openChild(chapter.title)
        checkFields(chapter)
    })


    it('add Tag', () => {
        const tag = {
            name: 'Data Management',
            description: 'These questions are about data management.'
        }

        // Add tag and save
        addInputChild('tag')
        fillFields(tag)
        cy.get('.form-group-color-picker a:nth-child(5)').click()
        saveEditor()

        // Open editor again and check that the tag is there
        openEditor()
        openChild(tag.name)
        checkFields(tag)
        cy.get('.form-group-color-picker a:nth-child(5)').should('have.class', 'selected')
    })


    const questions = [{
        s_questionType: 'OptionsQuestion',
        title: 'Will you use any external data sources?',
        text: 'This question is asking about external data sources.',
        s_requiredLevel: '1'
    }, {
        s_questionType: 'ListQuestion',
        title: 'What databases will you use?',
        text: '',
        s_requiredLevel: '2',
        itemTemplateTitle: 'Database Name'
    }, {
        s_questionType: 'ValueQuestion',
        title: 'How many researchers will work on the project?',
        text: 'Count them all!',
        s_requiredLevel: '3',
        s_valueType: 'NumberValue'
    }]

    questions.forEach((question) => {
        it('add ' + question.s_questionType, () => {
            const chapter = { title: 'My Chapter' }

            // Add chapter first
            addInputChild('chapter')
            fillFields(chapter)

            // Add question and save
            addInputChild('question')
            fillFields(question)
            saveEditor()

            // Open editor again and check that the question is there
            openEditor()
            openChild(chapter.title)
            openChild(question.title)
            checkFields(question)
        })
    })


    it('add Answer', () => {
        const chapter = { title: 'My Chapter' }
        const question = {
            s_questionType: 'OptionsQuestion',
            title: 'My Question'
        }
        const answer = {
            label: 'Yes',
            advice: 'This is a very good answer.',
            'metricMeasures\\.1\\.weight': '0.4',
            'metricMeasures\\.1\\.measure': '0.7'
        }

        // Add chapter and question first
        addInputChild('chapter')
        fillFields(chapter)
        addInputChild('question')
        fillFields(question)

        // Add answer and save
        addInputChild('answer')
        cy.get('.table-metrics tbody tr:nth-child(2) .form-check-toggle').click()
        fillFields(answer)
        saveEditor()

        // Open editor again and check that the answer is there
        openEditor()
        openChild(chapter.title)
        openChild(question.title)
        openChild(answer.label)
        checkFields(answer)
    })


    it('add Answer Item Question', () => {
        const chapter = { title: 'My Chapter' }
        const question = {
            s_questionType: 'ListQuestion',
            title: 'My Question'
        }
        const answerItemQuestion = {
            s_questionType: 'ValueQuestion',
            title: 'How many dumplings do you want with your goulash?',
            text: 'You should have at least 3.',
            s_requiredLevel: '1',
            s_valueType: 'NumberValue'
        }

        // Add chapter and question first
        addInputChild('chapter')
        fillFields(chapter)
        addInputChild('question')
        fillFields(question)

        // Add answer item question and save
        addInputChild('question')
        fillFields(answerItemQuestion)
        saveEditor()

        // Open editor again and check that the answer item question is there
        openEditor()
        openChild(chapter.title)
        openChild(question.title)
        openChild(answerItemQuestion.title)
        checkFields(answerItemQuestion)
    })
})
