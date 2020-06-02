import * as q from '../../../support/questionnaire-helpers'
import * as phases from '../../../support/phases-helpers'


describe('Questionnaire Summary Report - Phases', () => {
    const questionnaireName = 'Test Summary Report'
    const kmId = 'test-metrics'
    const packageId = 'dsw:test-metrics:1.0.0'

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

        cy.loginAs('researcher')
        
        const questionnaire = {
            visibility: q.Private,
            name: questionnaireName,
            packageId
        }
        cy.createQuestionnaire(questionnaire)
        q.open(questionnaireName)
    })

    const testCases = [{
        name: 'Empty with default phase',
        phase: null,
        selections: [],
        indications: [{
            chapter: undefined,
            indication: {
                current: { answered: 0, all: 4 },
                all: { answered: 0, all: 9 }
            }
        }, {
            chapter: 'Chapter 1',
            indication: {
                current: { answered: 0, all: 2 },
                all: { answered: 0, all: 6 }
            }
        }, {
            chapter: 'Chapter 2',
            indication: {
                current: { answered: 0, all: 2 },
                all: { answered: 0, all: 3 }
            }
        }]
    }, {
        name: 'Empty with the third phase',
        phase: 2,
        selections: [],
        indications: [{
            chapter: undefined,
            indication: {
                current: { answered: 0, all: 6 },
                all: { answered: 0, all: 9 }
            }
        }, {
            chapter: 'Chapter 1',
            indication: {
                current: { answered: 0, all: 4 },
                all: { answered: 0, all: 6 }
            }
        }, {
            chapter: 'Chapter 2',
            indication: {
                current: { answered: 0, all: 2 },
                all: { answered: 0, all: 3 }
            }
        }]
    }, {
        name: 'Select few with default phase',
        phase: null,
        selections: [{
            chapter: 'Chapter 1',
            answers: ['FINDABLE: W=1, M=0.5', 'OPEN: W=0.6, M=0.9', 'GOOD: W=0.9, M=1']
        }, {
            chapter: 'Chapter 2',
            answers: ['Option 2.2', 'Option 2.2.1']
        }],
        indications: [{
            chapter: undefined,
            indication: {
                current: { answered: 2, all: 4 },
                all: { answered: 5, all: 10 }
            }
        }, {
            chapter: 'Chapter 1',
            indication: {
                current: { answered: 1, all: 2 },
                all: { answered: 3, all: 6 }
            }
        }, {
            chapter: 'Chapter 2',
            indication: {
                current: { answered: 1, all: 2 },
                all: { answered: 2, all: 4 }
            }
        }]
    }, {
        name: 'Select few with the first phase',
        phase: 0,
        selections: [{
            chapter: 'Chapter 1',
            answers: ['FINDABLE: W=1, M=0.5', 'OPEN: W=0.6, M=0.9', 'GOOD: W=0.9, M=1']
        }, {
            chapter: 'Chapter 2',
            answers: ['Option 2.2', 'Option 2.2.1']
        }],
        indications: [{
            chapter: undefined,
            indication: {
                current: { answered: 2, all: 4 },
                all: { answered: 5, all: 10 }
            }
        }, {
            chapter: 'Chapter 1',
            indication: {
                current: { answered: 1, all: 2 },
                all: { answered: 3, all: 6 }
            }
        }, {
            chapter: 'Chapter 2',
            indication: {
                current: { answered: 1, all: 2 },
                all: { answered: 2, all: 4 }
            }
        }]
    }, {
        name: 'Select few with the second phase',
        phase: 1,
        selections: [{
            chapter: 'Chapter 1',
            answers: ['FINDABLE: W=1, M=0.5', 'OPEN: W=0.6, M=0.9', 'GOOD: W=0.9, M=1']
        }, {
            chapter: 'Chapter 2',
            answers: ['Option 2.2', 'Option 2.2.1']
        }],
        indications: [{
            chapter: undefined,
            indication: {
                current: { answered: 3, all: 6 },
                all: { answered: 5, all: 10 }
            }
        }, {
            chapter: 'Chapter 1',
            indication: {
                current: { answered: 1, all: 3 },
                all: { answered: 3, all: 6 }
            }
        }, {
            chapter: 'Chapter 2',
            indication: {
                current: { answered: 2, all: 3 },
                all: { answered: 2, all: 4 }
            }
        }]
    }, {
        name: 'Select few with the third phase',
        phase: 2,
        selections: [{
            chapter: 'Chapter 1',
            answers: ['FINDABLE: W=1, M=0.5', 'OPEN: W=0.6, M=0.9', 'GOOD: W=0.9, M=1']
        }, {
            chapter: 'Chapter 2',
            answers: ['Option 2.2', 'Option 2.2.1']
        }],
        indications: [{
            chapter: undefined,
            indication: {
                current: { answered: 4, all: 7 },
                all: { answered: 5, all: 10 }
            }
        }, {
            chapter: 'Chapter 1',
            indication: {
                current: { answered: 2, all: 4 },
                all: { answered: 3, all: 6 }
            }
        }, {
            chapter: 'Chapter 2',
            indication: {
                current: { answered: 2, all: 3 },
                all: { answered: 2, all: 4 }
            }
        }]
    }]

    testCases.forEach(({ name, phase, selections, indications }) => {
        it.only(name, () => {
            if (phase !== null) {
                phases.switchPhase(phases.phases[phase])
            }
            selections.forEach((selection) => {
                q.openChapter(selection.chapter)
                selection.answers.forEach((answer) => {
                    q.selectAnswer(answer)
                })
            })
            indications.forEach(({ chapter, indication }) => {
                q.expectSummaryReportAnswered(indication, chapter)
            })
        })
    })

    it('With list questions', () => {
        q.openChapter('Chapter 2')
        cy.get('#question-294757cc-a5e2-425a-be7e-6fd496b0cd23').contains('button', 'Add').click().click().click().click()
        cy.get('[data-path="294757cc-a5e2-425a-be7e-6fd496b0cd23.0.5c4a61f9-d678-46eb-81ff-8436a8832482"]').contains('label', 'Template option 2').click()
        cy.get('[data-path="294757cc-a5e2-425a-be7e-6fd496b0cd23.1.5c4a61f9-d678-46eb-81ff-8436a8832482"]').contains('label', 'Template option 1').click()
        cy.get('[data-path="294757cc-a5e2-425a-be7e-6fd496b0cd23.2.5c4a61f9-d678-46eb-81ff-8436a8832482"]').contains('label', 'Template option 2').click()
        q.expectSummaryReportAnswered({ current: { answered: 1, all: 4 }, all: { answered: 4, all: 13 } })
        q.expectSummaryReportAnswered({ current: { answered: 1, all: 2 }, all: { answered: 4, all: 7 } }, 'Chapter 2')
        
        q.openChapter('Chapter 2')
        cy.get('#question-294757cc-a5e2-425a-be7e-6fd496b0cd23').find('.btn-item-delete').should('have.length', 4)
        cy.get('#question-294757cc-a5e2-425a-be7e-6fd496b0cd23').find('.btn-item-delete').eq(2).click()
        q.expectSummaryReportAnswered({ current: { answered: 1, all: 4 }, all: { answered: 3, all: 12 } })
        q.expectSummaryReportAnswered({ current: { answered: 1, all: 2 }, all: { answered: 3, all: 6 } }, 'Chapter 2')
    })

    it('After clearing answers', () => {
        q.openChapter('Chapter 1')
        q.selectAnswer('FINDABLE: W=1, M=1')
        q.selectAnswer('INTEROPERABLE: W=0.15, M=0.95')
        q.selectAnswer('OPEN: W=0.5, M=0.2') // current
        q.selectAnswer('GOOD: W=0.9, M=1')
        q.selectAnswer('FINDABLE: W=0.3, M=1') // changing the first
        q.openChapter('Chapter 2')
        q.selectAnswer('Option 1.2') // Complex question 1
        q.selectAnswer('Option 2.2') // Complex question 2 (current)
        q.selectAnswer('Option 2.2.1')
        q.expectSummaryReportAnswered({ current: { answered: 2, all: 4 }, all: { answered: 7, all: 10 } })
        q.expectSummaryReportAnswered({ current: { answered: 1, all: 2 }, all: { answered: 4, all: 6 } }, 'Chapter 1')
        q.expectSummaryReportAnswered({ current: { answered: 1, all: 2 }, all: { answered: 3, all: 4 } }, 'Chapter 2')

        q.openChapter('Chapter 1')
        cy.get('#question-f4e3444a-6469-4546-9f14-f9304f8d1557 > a.clear-answer').click() // FINDABLE
        cy.get('#question-0eec0ecc-1da8-4db5-b7a3-da57d884eb52 > a.clear-answer').click() // OPEN
        q.openChapter('Chapter 2')
        cy.get('#question-16bd8329-cd7b-4029-84c4-5de0aa166369 > a.clear-answer').click() // Complex question 2 (with followup)
        q.expectSummaryReportAnswered({ current: { answered: 0, all: 4 }, all: { answered: 3, all: 9 } })
        q.expectSummaryReportAnswered({ current: { answered: 0, all: 2 }, all: { answered: 2, all: 6 } }, 'Chapter 1')
        q.expectSummaryReportAnswered({ current: { answered: 0, all: 2 }, all: { answered: 1, all: 3 } }, 'Chapter 2')
    })
})
