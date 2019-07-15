import * as editor from '../../../support/editor-helpers'


describe('KM Editor Edit Entity', () => {
    const kmName = 'Test Knowledge Model'
    const kmId = 'test-km'
    const parentKmId = 'test-km-1'
    const parentPackageId = 'dsw:test-km-1:1.0.0'

    before(() => {
        cy.task('mongo:delete', {
            collection: 'packages',
            args: { kmId: parentKmId }
        })
        cy.fixture('test-km-1').then((km) => {
            cy.importKM(km)
        })
    })

    beforeEach(() => {
        cy.task('mongo:delete', {
            collection: 'branches',
            args: { kmId }
        })
        cy.createKMEditor({ kmId, name: kmName, parentPackageId })
        cy.loginAs('datasteward')
        cy.visitApp('/km-editor')
    })

    describe('Knowledge Model', () => {
        it('edit Knowledge Model', () => {
            const km = { name: 'Another Knowledge Model' }

            // Edit KM
            editor.open(kmId)
            cy.fillFields(km)
            editor.saveAndClose()

            // Open editor again and check that changes were saved
            editor.open(kmId)
            cy.checkFields(km)
        })

        it('edit Chapter', () => {
            const chapter = {
                title: 'Another Chapter',
                text: 'This is another chapter'
            }

            // Edit Chapter
            editor.open(kmId)
            editor.traverseChildren(['Chapter 1'])
            cy.fillFields(chapter)
            editor.saveAndClose()

            // Open editor again and check that changes were saved
            editor.open(kmId)
            editor.traverseChildren([chapter.title])
            cy.checkFields(chapter)
        })

        it('edit Tag', () => {
            const tag = {
                name: 'Another tag',
                description: 'This is another tag'
            }

            // Edit tag
            editor.open(kmId)
            editor.traverseChildren(['Tag 1'])
            cy.fillFields(tag)
            cy.get('.form-group-color-picker a:nth-child(7)').click()
            editor.saveAndClose()

            // Open editor again and check that changes were saved
            editor.open(kmId)
            editor.traverseChildren([tag.name])
            cy.checkFields(tag)
            cy.get('.form-group-color-picker a:nth-child(7)').should('have.class', 'selected')
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
                responseIdField: 'objectUuid',
                responseNameField: 'objectString'
            }

            const getPropsFormGroup = () => cy.get('.form-group').contains('Props').parent('div')
            const getHeadersFormGroup = () => cy.get('.form-group').contains('Request Headers').parent('div')

            // Edit integration
            editor.open(kmId)
            editor.traverseChildren(['Integration 1'])
            // edit form fields
            cy.fillFields(integration)
            // edit props
            getPropsFormGroup().find('.form-control').type('new-prop')
            getPropsFormGroup().find('.input-group .btn').contains('Add').click()
            cy.get('.list-group.list-group-hover li').contains('database').find('a').contains('Remove').click()
            // edit headers
            getHeadersFormGroup().find('.input-group:last-child .btn').click()
            getHeadersFormGroup().find('.input-group:last-child input:first-child').clear().type('X-Auth')
            getHeadersFormGroup().find('.input-group:last-child input:nth-child(2)').clear().type('abcd')
            editor.saveAndClose()

            // Open editor again and check that changes were saved
            editor.open(kmId)
            editor.traverseChildren([integration.name])
            //  check form fields
            cy.checkFields(integration)
            // check props
            cy.get('.list-group.list-group-hover li').contains('new-prop').should('exist')
            cy.get('.list-group.list-group-hover li').contains('category').should('exist')
            cy.get('.list-group.list-group-hover li').contains('database').should('not.exist')
            // check headers
            getHeadersFormGroup().find('.input-group:last-child input:first-child').should('have.value', 'X-Auth')
            getHeadersFormGroup().find('.input-group:last-child input:nth-child(2)').should('have.value', 'abcd')
        })
    })

    describe('Chapter', () => {
        const questionTests = [{
            testName: 'edit OptionsQuestion',
            originalTitle: 'Options Question 1',
            question: {
                title: 'Another Options Question',
                text: 'Another options question text',
                s_requiredLevel: '1'
            }
        }, {
            testName: 'edit ListQuestion',
            originalTitle: 'List Question 1',
            question: {
                title: 'Another List Question',
                text: 'Another list question text',
                s_requiredLevel: '2',
                itemTemplateTitle: 'New Item Title'
            }
        }, {
            testName: 'edit ValueQuestion',
            originalTitle: 'Value Question 1',
            question: {
                title: 'Another Value Question',
                text: 'Another value question text',
                s_valueType: 'NumberValue'
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
            testName: 'change to OptionsQuestion',
            originalTitle: 'List Question 1',
            question: {
                title: 'Options Question 2',
                s_questionType: 'OptionsQuestion'
            }
        }, {
            testName: 'change to ListQuestion',
            originalTitle: 'Options Question 1',
            question: {
                title: 'List Question 2',
                s_questionType: 'ListQuestion',
                itemTemplateTitle: 'New Item Title'
            }
        }, {
            testName: 'change to ValueQuestion',
            originalTitle: 'List Question 1',
            question: {
                title: 'Value Question 2',
                s_questionType: 'ValueQuestion',
                s_valueType: 'TextValue'
            }
        }, {
            testName: 'change to IntegrationQuestion',
            originalTitle: 'List Question 1',
            question: {
                title: 'Integration Question 2',
                s_questionType: 'IntegrationQuestion',
                s_integrationUuid: '354e8a2a-3c53-4f74-921d-bc42d82bd529'
            }
        }]

        questionTests.forEach(({ testName, originalTitle, question }) => {
            it(testName, () => {
                // Edit question
                editor.open(kmId)
                editor.traverseChildren(['Chapter 1', originalTitle])
                cy.fillFields(question)
                editor.saveAndClose()

                // Open editor again and check that changes were saved
                editor.open(kmId)
                editor.traverseChildren(['Chapter 1', question.title])
                cy.checkFields(question)
            })
        })
    })

    const questionFixtures = [{
        title: 'Chapter Question',
        optionsQuestionPath: ['Chapter 1', 'Question 1'],
        listQuestionPath: ['Chapter 1', 'List Question 1'],
        answerTitle: 'Answer 2',
        followUpTitle: 'Answer Item Question 1',
        referenceTitle: 'Reference 1',
        expertTitle: 'Expert 1'
    }, {
        title: 'Follow-up Question',
        optionsQuestionPath: ['Chapter 1', 'Options Question 1', 'Answer 1', 'Follow-up Question 1'],
        listQuestionPath: ['Chapter 1', 'Options Question 1', 'Answer 1', 'Follow-up Question 2'],
        answerTitle: 'Follow-up Answer',
        followUpTitle: 'Follow-up Answer Item Question',
        referenceTitle: 'Follow-up Reference',
        expertTitle: 'Follow-up Expert'
    }, {
        title: 'Answer Item Question',
        optionsQuestionPath: ['Chapter 1', 'List Question 1', 'Answer Item Question 1'],
        listQuestionPath: ['Chapter 1', 'List Question 1', 'Answer Item Question 2'],
        answerTitle: 'Answer Item Question Answer',
        followUpTitle: 'Answer Item Question Answer Item Question',
        referenceTitle: 'Answer Item Question Reference',
        expertTitle: 'Answer Item Question Expert'
    }, {
        title: 'Deep Nested Question',
        optionsQuestionPath: ['Chapter 1', 'Question 1', 'Answer 2', 'Question 2', 'Question 3', 'Answer 3', 'Deep Nested Question 1'],
        listQuestionPath: ['Chapter 1', 'Question 1', 'Answer 2', 'Question 2', 'Question 3', 'Answer 3', 'Deep Nested Question 2'],
        answerTitle: 'Deep Nested Answer 1',
        followUpTitle: 'Deep Nested Answer Item Question',
        referenceTitle: 'Deep Nested Reference 1',
        expertTitle: 'Deep Nested Expert 1'
    }]

    questionFixtures.forEach(({
        title,
        optionsQuestionPath,
        listQuestionPath,
        answerTitle,
        followUpTitle,
        referenceTitle,
        expertTitle
    }) => {
        describe(title, () => {
            it('edit Answer', () => {
                const answer = {
                    label: 'No',
                    advice: 'This is not the best option.',
                    'metricMeasures\\.3\\.weight': '1',
                    'metricMeasures\\.3\\.measure': '0'
                }

                // Open editor and edit answer
                editor.open(kmId)
                editor.traverseChildren([...optionsQuestionPath, answerTitle])
                cy.get('.table-metrics tbody tr:nth-child(4) .form-check-toggle').click()
                cy.fillFields(answer)
                editor.saveAndClose()

                // Open editor again and check that changes were saved
                editor.open(kmId)
                editor.traverseChildren([...optionsQuestionPath, answer.label])
                cy.checkFields(answer)
            })

            it('edit Follow-up Question', () => {
                const question = {
                    title: 'Another Question',
                    text: 'This is another question'
                }

                // Open editor and edit follow-up question
                editor.open(kmId)
                editor.traverseChildren([...listQuestionPath, followUpTitle])
                cy.fillFields(question)
                editor.saveAndClose()

                // Open editor again and check that changes were saved
                editor.open(kmId)
                editor.traverseChildren([...listQuestionPath, question.title])
                cy.checkFields(question)
            })

            it('edit Reference', () => {
                const reference = {
                    s_referenceType: 'ResourcePageReference',
                    shortUuid: 'bqa'
                }

                // Open editor and edit reference
                editor.open(kmId)
                editor.traverseChildren([...optionsQuestionPath, referenceTitle])
                cy.fillFields(reference)
                editor.saveAndClose()

                // Open editor again and check that changes were saved
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
                editor.open(kmId)
                editor.traverseChildren([...optionsQuestionPath, expertTitle])
                cy.fillFields(expert)
                editor.saveAndClose()

                // Open editor again and check that changes were saved
                editor.open(kmId)
                editor.traverseChildren([...optionsQuestionPath, expert.name])
                cy.checkFields(expert)
            })
        })
    })
})
