import * as editor from '../../../support/editor-helpers'


describe('KM Editor Add Entity', () => {
    const kmName = 'Test Knowledge Model'
    const kmId = 'test-km'

    // Initializations -----------------------------------------------------------------------------

    beforeEach(() => {
        cy.task('branch:delete', { km_id: kmId })
        cy.clearServerCache()
        
        cy.createKMEditor({ kmId, name: kmName, previousPackageId: null })
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
            editor.open(kmId)
            editor.createChildren([['chapter', chapter]])
            editor.saveAndClose()

            // Open editor again and check that the chapter is there
            editor.open(kmId)
            editor.openChild(chapter.title)
            cy.checkFields(chapter)
        })

        it('add Metric', () => {
            const metric = {
                title: 'Metric 1',
                abbreviation: 'M1',
                description: 'This is Metric 1'
            }

            // Add metric and save
            editor.open(kmId)
            editor.createChildren([['metric', metric]])
            editor.saveAndClose()

            // Open editor and check that the metric is there
            editor.open(kmId)
            editor.openChild(metric.title)
            cy.checkFields(metric)
        })

        it.only('add Phase', () => {
            const phase = {
                title: 'Phase 1',
                description: 'This is Phase 1'
            }

            // Add phase and save
            editor.open(kmId)
            editor.createChildren([['phase', phase]])
            editor.saveAndClose()

            // Open editor and check that the phase is there
            editor.open(kmId)
            editor.openChild(phase.title)
            cy.checkFields(phase)
        })

        it('add Tag', () => {
            const tag = {
                name: 'Data Management',
                description: 'These questions are about data management.'
            }

            // Add tag and save
            editor.open(kmId)
            editor.createChildren([['tag', tag]])
            cy.getCy('form-group_color_color-button', ':nth-child(5)').click()
            editor.saveAndClose()

            // Open editor again and check that the tag is there
            editor.open(kmId)
            editor.openChild(tag.name)
            cy.checkFields(tag)
            cy.getCy('form-group_color_color-button', ':nth-child(5)').should('have.class', 'selected')
        })

        it('add Integration', () => {
            const integration = {
                id: 'service1',
                name: 'Service 1',
                logo: 'base64image',
                itemUrl: 'https://example.com/${{}id}',
                s_requestMethod: 'POST',
                requestUrl: 'https://api.example.com/search?q=${{}q}',
                requestBody: '{{}}',
                responseListField: 'items',
                responseIdField: 'itemId',
                responseNameField: 'itemName'
            }

            const addProp = (name) => {
                cy.getCy('value-list_input').type(name)
                cy.getCy('value-list_add-button').click()
            }

            const checkProp = (name) => {
                cy.getCy('value-list_item').contains(name).should('exist')
            }

            const addHeader = (header, value) => {
                cy.getCy('form-group_list_add-button').click()
                cy.getCy('integration_headers_name').type(header)
                cy.getCy('integration_headers_value').type(value)
            }

            const checkHeader = (header, value) => {
                cy.getCy('integration_headers_name').should('have.value', header)
                cy.getCy('integration_headers_value').should('have.value', value)
            }

            // Add integration and save
            editor.open(kmId)
            editor.createChildren([['integration', integration]])
            addProp('name')
            addProp('database')
            addHeader('Authorization', 'Bearer $token')
            editor.saveAndClose()

            // Open editor again and check that the integration is there
            editor.open(kmId)
            editor.openChild(integration.name)
            checkProp('name')
            checkProp('database')
            checkHeader('Authorization', 'Bearer $token')
            cy.checkFields(integration)

        })
    })


    // Chapter tests -------------------------------------------------------------------------------

    describe('Chapter', () => {
        const questions = [{
            s_questionType: 'OptionsQuestion',
            title: 'Will you use any external data sources?',
            text: 'This question is asking about external data sources.',
        }, {
            s_questionType: 'MultiChoiceQuestion',
            title: 'What do you choose?',
            text: 'This question can have more than one answer.',
        } ,{
            s_questionType: 'ListQuestion',
            title: 'What databases will you use?',
            text: '',
        }, {
            s_questionType: 'ValueQuestion',
            title: 'How many researchers will work on the project?',
            text: 'Count them all!',
            s_valueType: 'NumberValue'
        }]

        questions.forEach((question) => {
            it('add ' + question.s_questionType, () => {
                const chapter = { title: 'My Chapter' }

                // Create question and its parent
                editor.open(kmId)
                editor.createChildren([
                    ['chapter', chapter],
                    ['question', question]
                ])
                editor.saveAndClose()

                // Open editor again and check that the question is there
                editor.open(kmId)
                editor.traverseChildren([chapter.title, question.title])
                cy.checkFields(question)
            })
        })

        it('add Integration Question', () => {
            const chapter = { title: 'My Chapter' }
            const question = {
                s_questionType: 'IntegrationQuestion',
                title: 'What standards will you use?',
            }

            const integration = {
                id: 'integration-id',
                name: 'My Integration'
            }

            const getIntegrationUuid = () => {
                return cy.get('#integrationUuid option')
                    .contains('My Integration')
                    .should('have.attr', 'value')
            }

            // Create question and its parent
            editor.open(kmId)
            editor.createChildren([['integration', integration]])
            cy.getCy('km-editor_tree_link').contains('Test Knowledge Model').click()
            editor.createChildren([
                ['chapter', chapter],
                ['question', question]
            ])
            getIntegrationUuid().then((value) => {
                cy.get('#integrationUuid').select(value)
            })
            editor.saveAndClose()

            // Open editor again and check that the question is there
            editor.open(kmId)
            editor.traverseChildren([chapter.title, question.title])
            cy.checkFields(question)
            getIntegrationUuid().then((value) => {
                cy.get('#integrationUuid').should('have.value', value)
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
        const questionMultiChoice = {
            s_questionType: 'MultiChoiceQuestion',
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
        const childrenMultiChoice = [
            ...children,
            ['question', questionMultiChoice]
        ]
        const childrenList = [
            ...children,
            ['question', questionList]
        ]
        const path = [chapter.title, questionTitle]

        return {
            title: 'Chapter Question',
            childrenOptions,
            childrenMultiChoice,
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
        const followUpQuestionMultiChoice = {
            s_questionType: 'MultiChoiceQuestion',
            title: followUpQuestionTitle
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
            ['question', followUpQuestionOptions]
        ]
        const childrenMultiChoice = [
            ...children,
            ['question', followUpQuestionMultiChoice]
        ]
        const childrenList = [
            ...children,
            ['question', followUpQuestionList]
        ]
        const path = [chapter.title, question.title, answer.label, followUpQuestionTitle]

        return {
            title: 'Follow-up Question',
            childrenOptions,
            childrenMultiChoice,
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
        const answerItemQuestionMultiChoice = {
            s_questionType: 'MultiChoiceQuestion',
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
        const childrenMultiChoice = [
            ...children,
            ['question', answerItemQuestionMultiChoice]
        ]
        const childrenList = [
            ...children,
            ['question', answerItemQuestionList]
        ]
        const path = [chapter.title, question.title, answerItemQuestionTitle]

        return {
            title: 'Answer Item Question',
            childrenOptions,
            childrenMultiChoice,
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
        const nestedQuestionMultiChoice = {
            s_questionType: 'MultiChoiceQuestion',
            title: nestedQuestionTitle
        }
        const nestedQuestionList = {
            s_questionType: 'ListQuestion',
            title: nestedQuestionTitle
        }
        const children = [
            ['chapter', chapter],
            ['question', question1],
            ['answer', answer1],
            ['question', question2],
            ['answer', answer2],
            ['question', question3],
            ['question', question4],
            ['answer', answer3]
        ]
        const childrenOptions = [
            ...children,
            ['question', nestedQuestionOptions]
        ]
        const childrenMultiChoice = [
            ...children,
            ['question', nestedQuestionMultiChoice]
        ]
        const childrenList = [
            ...children,
            ['question', nestedQuestionList]
        ]
        const path = [chapter.title, question1.title, answer1.label, question2.title, answer2.label, question3.title, question4.title, answer3.label, nestedQuestionTitle]

        return {
            title: 'Deep Nested Question',
            childrenOptions,
            childrenMultiChoice,
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

    questionFixtures.forEach(({ title, childrenOptions, childrenMultiChoice, childrenList, path }) => {
        describe(title, () => {
            it('add Answer', () => {
                const followUpAnswer = {
                    label: 'No',
                    advice: 'You should consider changing this answer.'
                }

                // Add answer parents
                editor.open(kmId)
                editor.createChildren(childrenOptions)

                // Add answer and save
                editor.addInputChild('answer')
                cy.fillFields(followUpAnswer)
                editor.saveAndClose()

                // Open editor again and check that the answer is there
                editor.open(kmId)
                editor.traverseChildren([...path, followUpAnswer.label])
                cy.checkFields(followUpAnswer)
            })


            it('add Follow-up Question', () => {
                const answer = { label: 'This is my answer' }
                const followUpQuestion = {
                    s_questionType: 'ValueQuestion',
                    title: 'What is the name of your institution?',
                    s_valueType: 'StringValue',
                }

                // Add follow-up question and its parents
                editor.open(kmId)
                editor.createChildren([
                    ...childrenOptions,
                    ['answer', answer],
                    ['question', followUpQuestion]
                ])
                editor.saveAndClose()

                // Open editor again and check that the follow-up question is there
                editor.open(kmId)
                editor.traverseChildren([...path, answer.label, followUpQuestion.title])
                cy.checkFields(followUpQuestion)
            })

            it('add Choice', () => {
                const choice = {
                    label: "Choice 1"
                }

                // Add choice parents
                editor.open(kmId)
                editor.createChildren(childrenMultiChoice)

                // Add choice and save
                editor.addInputChild('choice')
                cy.fillFields(choice)
                editor.saveAndClose()

                // Open editor again and check that the choice is there
                editor.open(kmId)
                editor.traverseChildren([...path, choice.label])
                cy.checkFields(choice)
            })


            it('add Answer Item Question', () => {
                const itemQuestion = {
                    s_questionType: 'ValueQuestion',
                    title: 'When did the project started?',
                    text: 'Type in the exact date',
                    s_valueType: 'DateValue'
                }

                // Add answer item question and its parents
                editor.open(kmId)
                editor.createChildren([...childrenList, ['question', itemQuestion]])
                editor.saveAndClose()

                // Open editor again and check that the answer item question is there
                editor.open(kmId)
                editor.traverseChildren([...path, itemQuestion.title])
                cy.checkFields(itemQuestion)
            })


            const references = [['atq', {
                s_referenceType: 'ResourcePageReference',
                shortUuid: 'atq'
            }], ['Data Stewardship Wizard', {
                s_referenceType: 'URLReference',
                url: 'https://ds-wizard.org',
                label: 'Data Stewardship Wizard'
            }]]

            references.forEach(([referenceLabel, reference]) => {
                it('add ' + reference.s_referenceType, () => {

                    // Add reference and its parents
                    editor.open(kmId)
                    editor.createChildren([...childrenOptions, ['reference', reference]])
                    editor.saveAndClose()

                    // Open editor again and check that the reference is there
                    editor.open(kmId)
                    editor.traverseChildren([...path, referenceLabel])
                    cy.checkFields(reference)
                })
            })


            it('add Expert', () => {
                const expert = {
                    name: 'Francis Porter',
                    email: 'francis.porter@example.com'
                }

                // Add expert and its parents
                editor.open(kmId)
                editor.createChildren([...childrenList, ['expert', expert]])
                editor.saveAndClose()

                // Open editor again and check that the expert is there
                editor.open(kmId)
                editor.traverseChildren([...path, expert.name])
                cy.checkFields(expert)
            })
        })
    })
})
