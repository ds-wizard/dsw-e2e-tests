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

    const createChildren = (parents) => {
        parents.forEach(([type, fields]) => {
            addInputChild(type)
            fillFields(fields)
        })
    }

    const traverseChildren = (path) => {
        path.forEach(openChild)
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
        createChildren([['chapter', chapter]])
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
        createChildren([['tag', tag]])
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

            // Create question and its parent
            createChildren([
                ['chapter', chapter],
                ['question', question]
            ])
            saveEditor()

            // Open editor again and check that the question is there
            openEditor()
            traverseChildren([chapter.title, question.title])
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
        createChildren([
            ['chapter', chapter],
            ['question', question]
        ])

        // Add answer and save
        addInputChild('answer')
        cy.get('.table-metrics tbody tr:nth-child(2) .form-check-toggle').click()
        fillFields(answer)
        saveEditor()

        // Open editor again and check that the answer is there
        openEditor()
        traverseChildren([chapter.title, question.title, answer.label])
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

        // Add answer item question and its parents
        createChildren([
            ['chapter', chapter],
            ['question', question],
            ['question', answerItemQuestion]
        ])
        saveEditor()

        // Open editor again and check that the answer item question is there
        openEditor()
        traverseChildren([chapter.title, question.title, answerItemQuestion.title])
        checkFields(answerItemQuestion)
    })


    const references = [['atq', {
        s_referenceType: 'ResourcePageReference',
        shortUuid: 'atq'
    }], ['Data Stewardship Wizard', {
        s_referenceType: 'URLReference',
        url: 'https://ds-wizard.org',
        label: 'Data Stewardship Wizard'
    }], ['85bc2c94-9fb9-4e24-87db-6254ea138405', {
        s_referenceType: 'CrossReference',
        targetUuid: '85bc2c94-9fb9-4e24-87db-6254ea138405',
        description: 'See also'
    }]]

    references.forEach(([referenceLabel, reference]) => {
        it('add ' + reference.s_referenceType, () => {
            const chapter = { title: 'My Chapter' }
            const question = { title: 'My Question' }

            // Add reference and its parents
            createChildren([
                ['chapter', chapter],
                ['question', question],
                ['reference', reference]
            ])
            saveEditor()

            // Open editor again and check that the reference is there
            openEditor()
            traverseChildren([chapter.title, question.title, referenceLabel])
            checkFields(reference)
        })
    })


    it('add Expert', () => {
        const chapter = { title: 'My Chapter' }
        const question = { title: 'My Question' }
        const expert = {
            name: 'Francis Porter',
            email: 'francis.porter@example.com'
        }

        // Add expert and its parents
        createChildren([
            ['chapter', chapter],
            ['question', question],
            ['expert', expert]
        ])
        saveEditor()

        // Open editor again and check that the expert is there
        openEditor()
        traverseChildren([chapter.title, question.title, expert.name])
        checkFields(expert)
    })


    it('add Follow-up Question', () => {
        const chapter = { title: 'My Chapter' }
        const question = {
            s_questionType: 'OptionsQuestion',
            title: 'My Question'
        }
        const answer = { label: 'My Answer' }
        const followupQuestion = {
            s_questionType: 'ValueQuestion',
            title: 'What is the name of your institution?',
            s_valueType: 'StringValue',
            s_requiredLevel: '1',
        }

        // Add follow-up question and its parents
        createChildren([
            ['chapter', chapter],
            ['question', question],
            ['answer', answer],
            ['follow-up question', followupQuestion]
        ])
        saveEditor()

        // Open editor again and check that the follow-up question is there
        openEditor()
        traverseChildren([chapter.title, question.title, answer.label, followupQuestion.title])
        checkFields(followupQuestion)
    })


    it('add Answer to Follow-up Question', () => {
        const chapter = { title: 'My Chapter' }
        const question = {
            s_questionType: 'OptionsQuestion',
            title: 'My Question'
        }
        const answer = { label: 'My Answer' }
        const followupQuestion = {
            s_questionType: 'OptionsQuestion',
            title: 'My Follow-up Question',
        }
        const followupAnswer = {
            label: 'No',
            advice: 'You should consider changing this answer.',
            'metricMeasures\\.2\\.weight': '1',
            'metricMeasures\\.2\\.measure': '0'
        }

        // Add answer parents
        createChildren([
            ['chapter', chapter],
            ['question', question],
            ['answer', answer],
            ['follow-up question', followupQuestion]
        ])

        // Add answer and save
        addInputChild('answer')
        cy.get('.table-metrics tbody tr:nth-child(3) .form-check-toggle').click()
        fillFields(followupAnswer)
        saveEditor()

        // Open editor again and check that the answer is there
        openEditor()
        traverseChildren([chapter.title, question.title, answer.label, followupQuestion.title, followupAnswer.label])
        checkFields(followupAnswer)
    })


    it('add Answer Item Question to Follow-up Question', () =>{
        const chapter = { title: 'My Chapter' }
        const question = {
            s_questionType: 'OptionsQuestion',
            title: 'My Question'
        }
        const answer = { label: 'My Answer' }
        const followupQuestion = {
            s_questionType: 'ListQuestion',
            title: 'My Follow-up Question',
        }
        const itemQuestion = {
            s_questionType: 'ValueQuestion',
            title: 'When did the project started?',
            text: 'Type in the exact date',
            s_requiredLevel: '3',
            s_valueType: 'DateValue'
        }

        // Add answer item question and its parents
        createChildren([
            ['chapter', chapter],
            ['question', question],
            ['answer', answer],
            ['follow-up question', followupQuestion],
            ['question', itemQuestion]
        ])
        saveEditor()

        // Open editor again and check that the answer item question is there
        openEditor()
        traverseChildren([chapter.title, question.title, answer.label, followupQuestion.title, itemQuestion.title])
        checkFields(itemQuestion)
    })
})
