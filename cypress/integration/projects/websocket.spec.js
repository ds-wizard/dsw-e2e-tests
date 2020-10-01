import * as project from '../../support/project-helpers'

describe('Questionnaire WebSocket Tests', () => {
    const projectName = 'Test Questionnaire'
    const kmId = 'basic-questionnaire-test-km'
    const packageId = 'dsw:basic-questionnaire-test-km:1.0.0'
    let projectUuid = ''

    before(() => {
        cy.task('mongo:delete', {
            collection: 'packages',
            args: { kmId }
        })
        cy.fixture(kmId).then((km) => {
            cy.importKM(km)
        })
    })


    beforeEach(() => {
        cy.task('mongo:delete', {
            collection: 'questionnaires',
            args: {}
        })
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
            type: 'SetReply_ClientQuestionnaireAction',
            data: {
                uuid: '62e950ca-0cc5-4a78-9389-31f7494fc88c',
                path: '16f2c2ec-7b12-4d5e-9477-4453e4cd9689.57aeb801-e56e-4039-bf8c-82acae654e2b',
                value: {
                    type: 'StringReply',
                    value
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
            type: 'SetReply_ClientQuestionnaireAction',
            data: {
                uuid: '62e950ca-0cc5-4a78-9389-31f7494fc88c',
                path: '16f2c2ec-7b12-4d5e-9477-4453e4cd9689.4ae3425e-31a3-475d-a201-3f12f0b69574',
                value: {
                    type: 'AnswerReply',
                    value: 'd27c39c7-6e2f-45a6-9d47-a750ba81c6c5'
                }
            }
        }

        project.checkAnswerNotChecked(answer)
        cy.wsSend(`/questionnaires/${projectUuid}/websocket`, msg)
        project.checkAnswerChecked(answer)
    })


    it('SetReply - Add/Remove Item', () => {
        const msg = (items) => ({
            type: 'SetReply_ClientQuestionnaireAction',
            data: {
                uuid: '62e950ca-0cc5-4a78-9389-31f7494fc88c',
                path: '16f2c2ec-7b12-4d5e-9477-4453e4cd9689.5aea9458-6cfb-48db-8ed8-1d4d99b8076d',
                value: {
                    type: 'ItemListReply',
                    value: items
                }
            }
        })

        cy.get('.item').should('not.exist')
        cy.wsSend(`/questionnaires/${projectUuid}/websocket`, msg(['ca942bb2-6524-4149-a17e-4cb4d3e38233']))
        cy.get('.item').should('exist')
        cy.wsSend(`/questionnaires/${projectUuid}/websocket`, msg([]))
        cy.get('.item').should('not.exist')
    })

    it('ClearReply', () => {
        const answer = 'Answer 1.1'
        const msg = {
            type: 'ClearReply_ClientQuestionnaireAction',
            data: {
                uuid: '62e950ca-0cc5-4a78-9389-31f7494fc88c',
                path: '16f2c2ec-7b12-4d5e-9477-4453e4cd9689.4ae3425e-31a3-475d-a201-3f12f0b69574',
            }
        }

        project.selectAnswer(answer)
        cy.wsSend(`/questionnaires/${projectUuid}/websocket`, msg)
        project.checkAnswerNotChecked(answer)
    })


    it('SetLevel', () => {
        const level = 2
        const msg = {
            type: 'SetLevel_ClientQuestionnaireAction',
            data: {
                uuid: '62e950ca-0cc5-4a78-9389-31f7494fc88c',
                level: 2,
            }
        }

        cy.wsSend(`/questionnaires/${projectUuid}/websocket`, msg)
        cy.get('.questionnaire__panel__phase select').should('have.value', level)
    })


    it('SetLabels', () => {
        const question = 'Options Question 1'
        const msg = (value) => ({
            type: 'SetLabels_ClientQuestionnaireAction',
            data: {
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
            name: projectName,
        })

        // check error appears
        cy.get('.full-page-illustrated-message').should('exist')
        cy.get('h1').contains('Oops!').should('exist')

        // check redirect to login after refresh
        cy.clickBtn('Refresh')
        cy.url().should('be', '/')
    })
})
