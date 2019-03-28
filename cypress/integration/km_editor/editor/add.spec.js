describe('KM Editor Add Entity', () => {
    const kmName = 'Test Knowledge Model'
    const kmId = 'test-km'

    // Helpers -------------------------------------------------------------------------------------

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
        cy.get('.breadcrumb-item').contains(child).should('exist')
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


    // Initializations -----------------------------------------------------------------------------

    beforeEach(() => {
        cy.task('mongo:delete', {
            collection: 'branches',
            args: { kmId }
        })
        cy.createKMEditor({ kmId, name: kmName, parentPackageId: null })
        cy.loginAs('datasteward')
        cy.visitApp('/km-editor')
    })


    // Knowledge Model -----------------------------------------------------------------------------

    describe('Knowledge Model', () => {
        it('add Chapter', () => {
            const chapter = {
                title: 'My Awesome Chapter',
                text: 'This chapter is awesome'
            }

            // Add chapter and save
            openEditor()
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
            openEditor()
            createChildren([['tag', tag]])
            cy.get('.form-group-color-picker a:nth-child(5)').click()
            saveEditor()

            // Open editor again and check that the tag is there
            openEditor()
            openChild(tag.name)
            checkFields(tag)
            cy.get('.form-group-color-picker a:nth-child(5)').should('have.class', 'selected')
        })
    })


    // Chapter tests -------------------------------------------------------------------------------

    describe('Chapter', () => {
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
                openEditor()
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
    })


    // Questions -----------------------------------------------------------------------------------

    const chapterQuestionFixtures = () => {
        const chapter = { title: 'My Chapter' }
        const questionTitle = 'My Question'
        const questionOptions = {
            s_questionType: 'OptionsQuestion',
            title: questionTitle
        }
        const questionList = {
            s_questionType: 'ListQuestion',
            title: questionTitle
        }
        const children = [
            ['chapter', chapter]
        ]
        const childrenOptions = [
            ...children,
            ['question', questionOptions]
        ]
        const childrenList = [
            ...children,
            ['question', questionList]
        ]
        const path = [chapter.title, questionTitle]

        return {
            title: 'Chapter Question',
            childrenOptions,
            childrenList,
            path
        }
    }

    const followUpQuestionFixtures = () => {
        const chapter = { title: 'My Chapter' }
        const question = {
            s_questionType: 'OptionsQuestion',
            title: 'My Question'
        }
        const answer = { label: 'My Answer' }
        const followUpQuestionTitle = 'My Follow-up Question'
        const followUpQuestionOptions = {
            s_questionType: 'OptionsQuestion',
            title: followUpQuestionTitle,
        }
        const followUpQuestionList = {
            s_questionType: 'ListQuestion',
            title: followUpQuestionTitle,
        }
        const children = [
            ['chapter', chapter],
            ['question', question],
            ['answer', answer]
        ]
        const childrenOptions = [
            ...children,
            ['follow-up question', followUpQuestionOptions]
        ]
        const childrenList = [
            ...children,
            ['follow-up question', followUpQuestionList]
        ]
        const path = [chapter.title, question.title, answer.label, followUpQuestionTitle]

        return {
            title: 'Follow-up Question',
            childrenOptions,
            childrenList,
            path
        }
    }

    const answerItemQuestionFixtures = () => {
        const chapter = { title: 'My Chapter' }
        const question = {
            s_questionType: 'ListQuestion',
            title: 'My Question'
        }
        const answerItemQuestionTitle = 'My Follow-up Question'
        const answerItemQuestionOptions = {
            s_questionType: 'OptionsQuestion',
            title: answerItemQuestionTitle
        }
        const answerItemQuestionList = {
            s_questionType: 'ListQuestion',
            title: answerItemQuestionTitle
        }
        const children = [
            ['chapter', chapter],
            ['question', question]
        ]
        const childrenOptions = [
            ...children,
            ['question', answerItemQuestionOptions]
        ]
        const childrenList = [
            ...children,
            ['question', answerItemQuestionList]
        ]
        const path = [chapter.title, question.title, answerItemQuestionTitle]

        return {
            title: 'Answer Item Question',
            childrenOptions,
            childrenList,
            path
        }
    }

    const deepNestedQuestionFixtures = () => {
        const chapter = { title: 'My Chapter' }
        const question1 = {
            s_questionType: 'OptionsQuestion',
            title: 'Question 1'
        }
        const answer1 = { label: 'Answer 1' }
        const question2 = {
            s_questionType: 'OptionsQuestion',
            title: 'Question 2'
        }
        const answer2 = { label: 'My Answer 1' }
        const question3 = {
            s_questionType: 'ListQuestion',
            title: 'Question 3',
        }
        const question4 = {
            s_questionType: 'OptionsQuestion',
            title: 'Question 4'
        }
        const answer3 = { label: 'Answer 3' }
        const nestedQuestionTitle = 'Question 5'
        const nestedQuestionOptions = {
            s_questionType: 'OptionsQuestion',
            title: nestedQuestionTitle,
        }
        const nestedQuestionList = {
            s_questionType: 'ListQuestion',
            title: nestedQuestionTitle
        }
        const children = [
            ['chapter', chapter],
            ['question', question1],
            ['answer', answer1],
            ['follow-up question', question2],
            ['answer', answer2],
            ['follow-up question', question3],
            ['question', question4],
            ['answer', answer3]
        ]
        const childrenOptions = [
            ...children,
            ['follow-up question', nestedQuestionOptions]
        ]
        const childrenList = [
            ...children,
            ['follow-up question', nestedQuestionList]
        ]
        const path = [chapter.title, question1.title, answer1.label, question2.title, answer2.label, question3.title, question4.title, answer3.label, nestedQuestionTitle]

        return {
            title: 'Deep Nested Question',
            childrenOptions,
            childrenList,
            path
        }
    }

    const questionFixtures = [
        chapterQuestionFixtures(),
        followUpQuestionFixtures(),
        answerItemQuestionFixtures(),
        deepNestedQuestionFixtures()
    ]

    questionFixtures.forEach(({ title, childrenOptions, childrenList, path }) => {
        describe(title, () => {
            it('add Answer', () => {
                const followUpAnswer = {
                    label: 'No',
                    advice: 'You should consider changing this answer.',
                    'metricMeasures\\.2\\.weight': '1',
                    'metricMeasures\\.2\\.measure': '0'
                }

                // Add answer parents
                openEditor()
                createChildren(childrenOptions)

                // Add answer and save
                addInputChild('answer')
                cy.get('.table-metrics tbody tr:nth-child(3) .form-check-toggle').click()
                fillFields(followUpAnswer)
                saveEditor()

                // Open editor again and check that the answer is there
                openEditor()
                traverseChildren([...path, followUpAnswer.label])
                checkFields(followUpAnswer)
            })


            it('add Follow-up Question', () => {
                const answer = { label: 'This is my answer' }
                const followUpQuestion = {
                    s_questionType: 'ValueQuestion',
                    title: 'What is the name of your institution?',
                    s_valueType: 'StringValue',
                    s_requiredLevel: '1',
                }

                // Add follow-up question and its parents
                openEditor()
                createChildren([
                    ...childrenOptions,
                    ['answer', answer],
                    ['follow-up question', followUpQuestion]
                ])
                saveEditor()

                // Open editor again and check that the follow-up question is there
                openEditor()
                traverseChildren([...path, answer.label, followUpQuestion.title])
                checkFields(followUpQuestion)
            })


            it('add Answer Item Question', () => {
                const itemQuestion = {
                    s_questionType: 'ValueQuestion',
                    title: 'When did the project started?',
                    text: 'Type in the exact date',
                    s_requiredLevel: '3',
                    s_valueType: 'DateValue'
                }

                // Add answer item question and its parents
                openEditor()
                createChildren([...childrenList, ['question', itemQuestion]])
                saveEditor()

                // Open editor again and check that the answer item question is there
                openEditor()
                traverseChildren([...path, itemQuestion.title])
                checkFields(itemQuestion)
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

                    // Add reference and its parents
                    openEditor()
                    createChildren([...childrenOptions, ['reference', reference]])
                    saveEditor()

                    // Open editor again and check that the reference is there
                    openEditor()
                    traverseChildren([...path, referenceLabel])
                    checkFields(reference)
                })
            })


            it('add Expert', () => {
                const expert = {
                    name: 'Francis Porter',
                    email: 'francis.porter@example.com'
                }

                // Add expert and its parents
                openEditor()
                createChildren([...childrenList, ['expert', expert]])
                saveEditor()

                // Open editor again and check that the expert is there
                openEditor()
                traverseChildren([...path, expert.name])
                checkFields(expert)
            })
        })
    })
})
