import * as editor from '../../../support/editor-helpers'
import { dataCy } from '../../../support/utils'


describe('KM Editor Edit Entity', () => {
    const kmName = 'Test Knowledge Model'
    const kmId = 'test-km'
    const previousKmId = 'test-km-1'
    const previousPackageId = 'dsw:test-km-1:1.0.0'

    before(() => {
        cy.task('package:delete', { km_id: previousKmId })
        cy.clearServerCache()

        cy.importKM('test-km-1')
    })

    beforeEach(() => {
        cy.task('branch:delete', { km_id: kmId })
        cy.clearServerCache()

        cy.createKMEditor({ kmId, name: kmName, previousPackageId })
        cy.loginAs('datasteward')
        cy.visitApp('/km-editor')
    })

    describe('Knowledge Model', () => {
        it('edit Chapter', () => {
            const chapter = {
                title: 'Another Chapter',
                text: 'This is another chapter'
            }

            // Edit Chapter
            cy.visitApp('/km-editor')
            editor.open(kmId)
            editor.traverseChildren(['Chapter 1'])
            cy.fillFields(chapter)

            // Open editor again and check that changes were saved
            cy.visitApp('/km-editor')
            editor.open(kmId)
            editor.traverseChildren([chapter.title])
            cy.checkFields(chapter)
        })

        it('edit Metric', () => {
            const metric = {
                title: 'Metric 1',
                abbreviation: 'M1',
                description: 'This is Metric 1'
            }

            // Edit Metric
            cy.visitApp('/km-editor')
            editor.open(kmId)
            editor.traverseChildren(['Findability'])
            cy.fillFields(metric)

            // Open editor again and check that changes were saved
            cy.visitApp('/km-editor')
            editor.open(kmId)
            editor.traverseChildren([metric.title])
            cy.checkFields(metric)
        })

        it('edit Phase', () => {
            const metric = {
                title: 'Phase 1',
                description: 'This is Phase 1'
            }

            // Edit Metric
            cy.visitApp('/km-editor')
            editor.open(kmId)
            editor.traverseChildren(['Before Submitting the Proposal'])
            cy.fillFields(metric)

            // Open editor again and check that changes were saved
            cy.visitApp('/km-editor')
            editor.open(kmId)
            editor.traverseChildren([metric.title])
            cy.checkFields(metric)
        })

        it('edit Tag', () => {
            const tag = {
                name: 'Another tag',
                description: 'This is another tag'
            }

            // Edit tag
            cy.visitApp('/km-editor')
            editor.open(kmId)
            editor.traverseChildren(['Tag 1'])
            cy.fillFields(tag)
            cy.getCy('form-group_color_color-button', ':nth-child(7)').click()

            // Open editor again and check that changes were saved
            cy.visitApp('/km-editor')
            editor.open(kmId)
            editor.traverseChildren([tag.name])
            cy.checkFields({ ...tag, color: '#27AE60' })
        })

        it('edit Integration', () => {
            const integration = {
                id: 'another-integration',
                name: 'Another Integration',
                logo: 'base64image',
                itemUrl: 'https://another.example.com/${{}id}',
                s_requestMethod: 'POST',
                requestUrl: 'https://another.api.example.com/search?q=${{}q}',
                requestBody: '{{}}',
                responseListField: 'objects',
                responseItemId: 'objectUuid',
                responseItemTemplate: 'objectString'
            }

            const checkProp = (name, i) => {
                cy.get(`${dataCy('props-input_input-wrapper')}:nth-child(${i}) ${dataCy('props-input_input')}`).should('have.value', name)
            }

            // Edit integration
            cy.visitApp('/km-editor')
            editor.open(kmId)
            editor.traverseChildren(['Integration 1'])

            // edit form fields
            cy.fillFields(integration)

            // edit props
            cy.getCy('props-input_add-button').click()
            cy.get(`${dataCy('props-input_input-wrapper')}:last-child ${dataCy('props-input_input')}`).type('new-prop')
            cy.get(`${dataCy('props-input_input-wrapper')}:first-child`).find(dataCy('prop-remove')).click()

            // edit headers
            cy.getCy('integration-input_item', ':last-child').find(dataCy('prop-remove')).click()
            cy.getCy('integration-input_name').clear().type('X-Auth')
            cy.getCy('integration-input_value').clear().type('abcd')

            // Open editor again and check that changes were saved
            cy.visitApp('/km-editor')
            editor.open(kmId)
            editor.traverseChildren([integration.name])

            //  check form fields
            cy.checkFields(integration)

            // check props
            checkProp('category', 1)
            checkProp('new-prop', 2)

            // check headers
            cy.getCy('integration-input_name').should('have.value', 'X-Auth')
            cy.getCy('integration-input_value').should('have.value', 'abcd')
        })
    })

    describe('Chapter', () => {
        const questionTests = [{
            testName: 'edit OptionsQuestion',
            originalTitle: 'Options Question 1',
            question: {
                title: 'Another Options Question',
                text: 'Another options question text',
            }
        }, {
            testName: 'edit ListQuestion',
            originalTitle: 'List Question 1',
            question: {
                title: 'Another List Question',
                text: 'Another list question text',
            }
        }, {
            testName: 'edit ValueQuestion',
            originalTitle: 'Value Question 1',
            question: {
                title: 'Another Value Question',
                text: 'Another value question text',
                s_valueType: 'NumberQuestionValueType'
            }
        }, {
            testName: 'edit IntegrationQuestion',
            originalTitle: 'Integration Question 1',
            question: {
                title: 'Another Integration Question',
                text: 'Another integration question text',
                s_integrationUuid: '7f1a591a-d6d6-4ffd-8118-6f052b1d73b8'
            }
        }, {
            testName: 'edit MultiChoiceQuestion',
            originalTitle: 'Multi-Choice Question 1',
            question: {
                title: 'Another Multi-Choice Question',
                text: 'Another Multi-Choice question text',
            }
        }, {
            testName: 'change to OptionsQuestion',
            originalTitle: 'List Question 1',
            question: {
                title: 'Options Question 2',
                s_type: 'Options'
            }
        }, {
            testName: 'change to ListQuestion',
            originalTitle: 'Options Question 1',
            question: {
                title: 'List Question 2',
                s_type: 'List'
            }
        }, {
            testName: 'change to ValueQuestion',
            originalTitle: 'List Question 1',
            question: {
                title: 'Value Question 2',
                s_type: 'Value',
                s_valueType: 'TextQuestionValueType'
            }
        }, {
            testName: 'change to IntegrationQuestion',
            originalTitle: 'List Question 1',
            question: {
                title: 'Integration Question 2',
                s_type: 'Integration',
                s_integrationUuid: '354e8a2a-3c53-4f74-921d-bc42d82bd529'
            }
        }, {
            testName: 'change to MultiChoiceQuestion',
            originalTitle: 'List Question 1',
            question: {
                title: 'Multi-Choice Question 2',
                s_type: 'MultiChoice'
            }
        }]

        questionTests.forEach(({ testName, originalTitle, question }) => {
            it(testName, () => {
                // Edit question
                cy.visitApp('/km-editor')
                editor.open(kmId)
                editor.traverseChildren(['Chapter 1', originalTitle])
                cy.fillFields(question)

                // Open editor again and check that changes were saved
                cy.visitApp('/km-editor')
                editor.open(kmId)
                editor.traverseChildren(['Chapter 1', question.title])
                cy.checkFields(question)
            })
        })
    })

    const questionFixtures = [{
        title: 'Chapter Question',
        optionsQuestionPath: ['Chapter 1', 'Question 1'],
        multiChoiceQuestionPath: ['Chapter 1', 'Multi-Choice Question 1'],
        listQuestionPath: ['Chapter 1', 'List Question 1'],
        answerTitle: 'Answer 2',
        choiceTitle: 'Choice 1',
        followUpTitle: 'Answer Item Question 1',
        referenceTitle: 'Reference 1',
        expertTitle: 'Expert 1'
    }, {
        title: 'Follow-up Question',
        optionsQuestionPath: ['Chapter 1', 'Options Question 1', 'Answer 1', 'Follow-up Question 1'],
        multiChoiceQuestionPath: ['Chapter 1', 'Options Question 1', 'Answer 1', 'Follow-up Question 3'],
        listQuestionPath: ['Chapter 1', 'Options Question 1', 'Answer 1', 'Follow-up Question 2'],
        answerTitle: 'Follow-up Answer',
        choiceTitle: 'Follow-up Choice',
        followUpTitle: 'Follow-up Answer Item Question',
        referenceTitle: 'Follow-up Reference',
        expertTitle: 'Follow-up Expert'
    }, {
        title: 'Answer Item Question',
        optionsQuestionPath: ['Chapter 1', 'List Question 1', 'Answer Item Question 1'],
        multiChoiceQuestionPath: ['Chapter 1', 'List Question 1', 'Answer Item Question 3'],
        listQuestionPath: ['Chapter 1', 'List Question 1', 'Answer Item Question 2'],
        answerTitle: 'Answer Item Question Answer',
        choiceTitle: 'Answer Item Question Choice',
        followUpTitle: 'Answer Item Question Answer Item Question',
        referenceTitle: 'Answer Item Question Reference',
        expertTitle: 'Answer Item Question Expert'
    }, {
        title: 'Deep Nested Question',
        optionsQuestionPath: ['Chapter 1', 'Question 1', 'Answer 2', 'Question 2', 'Question 3', 'Answer 3', 'Deep Nested Question 1'],
        multiChoiceQuestionPath: ['Chapter 1', 'Question 1', 'Answer 2', 'Question 2', 'Question 3', 'Answer 3', 'Deep Nested Question 3'],
        listQuestionPath: ['Chapter 1', 'Question 1', 'Answer 2', 'Question 2', 'Question 3', 'Answer 3', 'Deep Nested Question 2'],
        answerTitle: 'Deep Nested Answer 1',
        choiceTitle: 'Deep Nested Choice 1',
        followUpTitle: 'Deep Nested Answer Item Question',
        referenceTitle: 'Deep Nested Reference 1',
        expertTitle: 'Deep Nested Expert 1'
    }]

    questionFixtures.slice(0, 1).forEach(({
        title,
        optionsQuestionPath,
        multiChoiceQuestionPath,
        listQuestionPath,
        answerTitle,
        choiceTitle,
        followUpTitle,
        referenceTitle,
        expertTitle
    }) => {
        describe(title, () => {
            it('edit Answer', () => {
                const answer = {
                    label: 'No',
                    advice: 'This is not the best option.',
                    'metricMeasure-8db30660-d4e5-4c0a-bf3e-553f3f0f997a-weight': '1',
                    'metricMeasure-8db30660-d4e5-4c0a-bf3e-553f3f0f997a-measure': '0'
                }

                // Open editor and edit answer
                cy.visitApp('/km-editor')
                editor.open(kmId)
                editor.traverseChildren([...optionsQuestionPath, answerTitle])
                cy.checkToggle('metricMeasure-8db30660-d4e5-4c0a-bf3e-553f3f0f997a-enabled')
                cy.fillFields(answer)

                // Open editor again and check that changes were saved
                cy.visitApp('/km-editor')
                editor.open(kmId)
                editor.traverseChildren([...optionsQuestionPath, answer.label])
                cy.checkFields(answer)
            })

            it('edit Choice', () => {
                const choice = {
                    label: 'Another Choice'
                }

                // Open editor and edit choice
                cy.visitApp('/km-editor')
                editor.open(kmId)
                editor.traverseChildren([...multiChoiceQuestionPath, choiceTitle])
                cy.fillFields(choice)

                // Open editor again and check that changes were saved
                cy.visitApp('/km-editor')
                editor.open(kmId)
                editor.traverseChildren([...multiChoiceQuestionPath, choice.label])
                cy.checkFields(choice)
            })

            it('edit Follow-up Question', () => {
                const question = {
                    title: 'Another Question',
                    text: 'This is another question'
                }

                // Open editor and edit follow-up question
                cy.visitApp('/km-editor')
                editor.open(kmId)
                editor.traverseChildren([...listQuestionPath, followUpTitle])
                cy.fillFields(question)

                // Open editor again and check that changes were saved
                cy.visitApp('/km-editor')
                editor.open(kmId)
                editor.traverseChildren([...listQuestionPath, question.title])
                cy.checkFields(question)
            })

            it('edit Reference', () => {
                const reference = {
                    s_type: 'ResourcePage',
                    shortUuid: 'bqa'
                }

                // Open editor and edit reference
                cy.visitApp('/km-editor')
                editor.open(kmId)
                editor.traverseChildren([...optionsQuestionPath, referenceTitle])
                cy.fillFields(reference)

                // Open editor again and check that changes were saved
                cy.visitApp('/km-editor')
                editor.open(kmId)
                editor.traverseChildren([...optionsQuestionPath, reference.shortUuid])
                cy.checkFields(reference)
            })

            it('edit Expert', () => {
                const expert = {
                    name: 'Aurelia Sharp',
                    email: 'aurelia.sharp@example.com'
                }

                // Open editor and edit expert
                cy.visitApp('/km-editor')
                editor.open(kmId)
                editor.traverseChildren([...optionsQuestionPath, expertTitle])
                cy.fillFields(expert)

                // Open editor again and check that changes were saved
                cy.visitApp('/km-editor')
                editor.open(kmId)
                editor.traverseChildren([...optionsQuestionPath, expert.name])
                cy.checkFields(expert)
            })
        })
    })
})
