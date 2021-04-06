import * as editor from '../../../support/editor-helpers'


describe('KM Editor Add Entity', () => {
    const kmName = 'Test Knowledge Model'
    const kmId = 'test-km'

    // Initializations -----------------------------------------------------------------------------

    beforeEach(() => {
        cy.task('mongo:delete', {
            collection: 'branches',
            args: { kmId }
        })
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


        it('add Tag', () => {
            const tag = {
                name: 'Data Management',
                description: 'These questions are about data management.'
            }

            // Add tag and save
            editor.open(kmId)
            editor.createChildren([['tag', tag]])
            cy.get('.form-group-color-picker a:nth-child(5)').click()
            editor.saveAndClose()

            // Open editor again and check that the tag is there
            editor.open(kmId)
            editor.openChild(tag.name)
            cy.checkFields(tag)
            cy.get('.form-group-color-picker a:nth-child(5)').should('have.class', 'selected')
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
                cy.get('.input-group .form-control').type(name)
                cy.get('.input-group .btn').click()
            }

            const checkProp = (name) => {
                cy.get('.list-group.list-group-hover li').contains(name).should('exist')
            }

            const getHeadersFormGroup = () => cy.get('.form-group').contains('Request Headers').parent('div')

            const addHeader = (header, value) => {
                getHeadersFormGroup().contains('Add').click()
                getHeadersFormGroup().find('.input-group:last-child input:first-child').type(header)
                getHeadersFormGroup().find('.input-group:last-child input:nth-child(2)').type(value)
            }

            const checkHeader = (header, value) => {
                getHeadersFormGroup().find('.input-group:last-child input:first-child').should('have.value', header)
                getHeadersFormGroup().find('.input-group:last-child input:nth-child(2)').should('have.value', value)
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
            s_requiredLevel: '1'
        }, {
            s_questionType: 'MultiChoiceQuestion',
            title: 'What do you choose?',
            text: 'This question can have more than one answer.',
            s_requiredLevel: '1'
        } ,{
            s_questionType: 'ListQuestion',
            title: 'What databases will you use?',
            text: '',
            s_requiredLevel: '2'
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
                s_requiredLevel: '1'
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
            cy.get('a').contains('Test Knowledge Model').click()
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
            ['follow-up question', followUpQuestionOptions]
        ]
        const childrenMultiChoice = [
            ...children,
            ['follow-up question', followUpQuestionMultiChoice]
        ]
        const childrenList = [
            ...children,
            ['follow-up question', followUpQuestionList]
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
        const childrenMultiChoice = [
            ...children,
            ['follow-up question', nestedQuestionMultiChoice]
        ]
        const childrenList = [
            ...children,
            ['follow-up question', nestedQuestionList]
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
                    advice: 'You should consider changing this answer.',
                    'metricMeasures\\.2\\.weight': '1',
                    'metricMeasures\\.2\\.measure': '0'
                }

                // Add answer parents
                editor.open(kmId)
                editor.createChildren(childrenOptions)

                // Add answer and save
                editor.addInputChild('answer')
                cy.get('.metric-view:nth-child(3) .form-check-toggle').click()
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
                    s_requiredLevel: '1',
                }

                // Add follow-up question and its parents
                editor.open(kmId)
                editor.createChildren([
                    ...childrenOptions,
                    ['answer', answer],
                    ['follow-up question', followUpQuestion]
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
                    s_requiredLevel: '3',
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
            }], ['85bc2c94-9fb9-4e24-87db-6254ea138405', {
                s_referenceType: 'CrossReference',
                targetUuid: '85bc2c94-9fb9-4e24-87db-6254ea138405',
                description: 'See also'
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
