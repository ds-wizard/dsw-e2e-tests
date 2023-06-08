import * as project from '../../../support/project-helpers'

describe('Questionnaire WebSocket Tests', () => {
    const projectName = 'Test Questionnaire'
    const kmId = 'basic-questionnaire-test-km'
    const packageId = 'dsw:basic-questionnaire-test-km:1.0.0'
    let projectUuid = ''

    before(() => {
        cy.task('package:delete', { km_id: kmId })
        cy.clearServerCache()

        cy.importKM(kmId)
    })


    beforeEach(() => {
        cy.task('questionnaire:delete')
        cy.clearServerCache()
        
        cy.createQuestionnaire({
            visibility: project.VisibleEdit,
            sharing: project.AnyoneWithLinkEdit,
            name: projectName,
            packageId
        }).then(result => {
            projectUuid = result.body.uuid
        })
        cy.loginAs('researcher')
        project.open(projectName)
    })


    it('SetReply - Value', () => {
        const value = 'Value'
        const msg = {
            type: 'SetContent_ClientQuestionnaireAction',
            data: {
                type: 'SetReplyEvent',
                uuid: '62e950ca-0cc5-4a78-9389-31f7494fc88c',
                path: '16f2c2ec-7b12-4d5e-9477-4453e4cd9689.57aeb801-e56e-4039-bf8c-82acae654e2b',
                value: {
                    type: 'StringReply',
                    value
                },
                phasesAnsweredIndication: {
                    answeredQuestions: 0,
                    unansweredQuestions: 0,
                }
            }
        }

        project.checkAnswer('Value Question String', '')
        cy.wsSend(`/questionnaires/${projectUuid}/websocket`, msg)
        project.checkAnswer('Value Question String', value)
    })


    it('SetReply - Answer', () => {
        const answer = 'Answer 1.1'
        const msg = {
            type: 'SetContent_ClientQuestionnaireAction',
            data: {
                type: 'SetReplyEvent',
                uuid: '62e950ca-0cc5-4a78-9389-31f7494fc88c',
                path: '16f2c2ec-7b12-4d5e-9477-4453e4cd9689.4ae3425e-31a3-475d-a201-3f12f0b69574',
                value: {
                    type: 'AnswerReply',
                    value: 'd27c39c7-6e2f-45a6-9d47-a750ba81c6c5'
                },
                phasesAnsweredIndication: {
                    answeredQuestions: 0,
                    unansweredQuestions: 0,
                }
            }
        }

        project.checkAnswerNotChecked(answer)
        cy.wsSend(`/questionnaires/${projectUuid}/websocket`, msg)
        project.checkAnswerChecked(answer)
    })


    it('SetReply - Add/Remove Item', () => {
        const msg = (items) => ({
            type: 'SetContent_ClientQuestionnaireAction',
            data: {
                type: 'SetReplyEvent',
                uuid: '62e950ca-0cc5-4a78-9389-31f7494fc88c',
                path: '16f2c2ec-7b12-4d5e-9477-4453e4cd9689.5aea9458-6cfb-48db-8ed8-1d4d99b8076d',
                value: {
                    type: 'ItemListReply',
                    value: items
                },
                phasesAnsweredIndication: {
                    answeredQuestions: 0,
                    unansweredQuestions: 0,
                }
            }
        })

        cy.get('.questionnaire__content .item').should('not.exist')
        cy.wsSend(`/questionnaires/${projectUuid}/websocket`, msg(['ca942bb2-6524-4149-a17e-4cb4d3e38233']))
        cy.get('.questionnaire__content .item').should('exist')
        cy.wsSend(`/questionnaires/${projectUuid}/websocket`, msg([]))
        cy.get('.questionnaire__content .item').should('not.exist')
    })

    it('ClearReply', () => {
        const answer = 'Answer 1.1'
        const msg = {
            type: 'SetContent_ClientQuestionnaireAction',
            data: {
                type: 'ClearReplyEvent',
                uuid: '62e950ca-0cc5-4a78-9389-31f7494fc88c',
                path: '16f2c2ec-7b12-4d5e-9477-4453e4cd9689.4ae3425e-31a3-475d-a201-3f12f0b69574',
                phasesAnsweredIndication: {
                    answeredQuestions: 0,
                    unansweredQuestions: 0,
                }
            }
        }

        project.selectAnswer(answer)
        cy.wsSend(`/questionnaires/${projectUuid}/websocket`, msg)
        project.checkAnswerNotChecked(answer)
    })


    it('SetLevel', () => {
        const phaseUuid = 'adc9133d-afcd-4616-9aea-db5f475898a2'
        const phaseName = 'Before Finishing the Project'
        const msg = {
            type: 'SetContent_ClientQuestionnaireAction',
            data: {
                type: 'SetPhaseEvent',
                uuid: '62e950ca-0cc5-4a78-9389-31f7494fc88c',
                phaseUuid,
                phasesAnsweredIndication: {
                    answeredQuestions: 0,
                    unansweredQuestions: 0,
                }
            }
        }

        cy.wsSend(`/questionnaires/${projectUuid}/websocket`, msg)
        cy.getCy('phase-selection').should('contain', phaseName)
    })


    it('SetLabels', () => {
        const question = 'Options Question 1'
        const msg = (value) => ({
            type: 'SetContent_ClientQuestionnaireAction',
            data: {
                type: 'SetLabelsEvent',
                uuid: '62e950ca-0cc5-4a78-9389-31f7494fc88c',
                path: '16f2c2ec-7b12-4d5e-9477-4453e4cd9689.4ae3425e-31a3-475d-a201-3f12f0b69574',
                value
            }
        })

        cy.wsSend(`/questionnaires/${projectUuid}/websocket`, msg([project.TodoUUID]))
        project.expectTodoFor(question)
        cy.wsSend(`/questionnaires/${projectUuid}/websocket`, msg([]))
        project.expectNoTodo(question)
    })

    
    it('Error when sharing is changed to Restricted', () => {
        // open questionnaire as anonymous user
        cy.logout()
        cy.visitApp(`/projects/${projectUuid}`)

        // change sharing to restricted
        cy.updateQuestionnaire(projectUuid, {
            visibility: project.VisibleEdit,
            sharing: project.Restricted,
            description: null,
            name: projectName,
            permissions: [],
            isTemplate: false,
            projectTags: [],
        })

        // check error appears
        cy.get('.full-page-illustrated-message').should('exist')
        cy.get('h1').contains('Oops!').should('exist')

        // check redirect to login after refresh
        cy.clickBtn('Refresh')
        cy.url().should('match', /\/\?originalUrl=/)
    })
})
