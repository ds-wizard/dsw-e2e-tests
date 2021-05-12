import * as project from '../../../../support/project-helpers'
import * as phases from '../../../../support/phases-helpers'


describe('Questionnaire Summary Report - Phases', () => {
    const questionnaireName = 'Test Summary Report'
    const kmId = 'test-metrics'
    const packageId = 'dsw:test-metrics:1.0.0'

    before(() => {
        cy.task('package:delete', { km_id: kmId })
        cy.clearServerCache()

        cy.importKM(kmId)
    })


    beforeEach(() => {
        cy.task('questionnaire:delete')
        cy.clearServerCache()

        cy.loginAs('researcher')
        
        cy.createQuestionnaire({
            visibility: project.Private,
            sharing: project.Restricted,
            name: questionnaireName,
            packageId
        })
        project.open(questionnaireName)
    })

    const testCases = [{
        name: 'Empty with default phase',
        phase: null,
        selections: [],
        indications: [{
            chapter: undefined,
            indication: {
                current: { answered: 0, all: 5 },
                all: { answered: 0, all: 12 }
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
                current: { answered: 0, all: 8 },
                all: { answered: 0, all: 12 }
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
                current: { answered: 2, all: 5 },
                all: { answered: 5, all: 13 }
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
                current: { answered: 2, all: 5 },
                all: { answered: 5, all: 13 }
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
                current: { answered: 3, all: 8 },
                all: { answered: 5, all: 13 }
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
                current: { answered: 4, all: 9 },
                all: { answered: 5, all: 13 }
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
    }, {
        name: 'Select multi-choice first phase not answered',
        phase: 0,
        selections: [{
            chapter: 'Chapter 3',
            answers: ['Choice 1.1', 'Choice 1.3']
        }],
        indications: [{
            chapter: 'Chapter 3',
            indication: {
                current: { answered: 0, all: 1 },
                all: { answered: 1, all: 3}
            }
        }]
    }, {
        name: 'Select multi-choice first phase answered',
        phase: 0,
        selections: [{
            chapter: 'Chapter 3',
            answers: ['Choice 1.1', 'Choice 1.3', 'Choice 2.1']
        }],
        indications: [{
            chapter: 'Chapter 3',
            indication: {
                current: { answered: 1, all: 1 },
                all: { answered: 2, all: 3 }
            }
        }]
    }, {
        name: 'Select multi-choice last phase all answered',
        phase: 2,
        selections: [{
            chapter: 'Chapter 3',
            answers: ['Choice 1.3', 'Choice 2.2', 'Choice 3.1']
        }],
        indications: [{
            chapter: 'Chapter 3',
            indication: {
                current: { answered: 2, all: 2 },
                all: { answered: 3, all: 3}
            }
        }]
    }]

    testCases.forEach(({ name, phase, selections, indications }) => {
        it(name, () => {
            if (phase !== null) {
                phases.switchPhase(phases.phases[phase])
            }
            selections.forEach((selection) => {
                project.openChapter(selection.chapter)
                selection.answers.forEach((answer) => {
                    project.selectAnswer(answer)
                })
            })
            indications.forEach(({ chapter, indication }) => {
                project.expectSummaryReportAnswered(indication, chapter)
            })
        })
    })

    it('With list questions', () => {
        project.openChapter('Chapter 2')
        cy.get('#question-294757cc-a5e2-425a-be7e-6fd496b0cd23').contains('button', 'Add').click().click().click().click()
        cy.get('.item:nth-child(1)').contains('label', 'Template option 2').click()
        cy.get('.item:nth-child(2)').contains('label', 'Template option 1').click()
        cy.get('.item:nth-child(3)').contains('label', 'Template option 2').click()
        project.expectSummaryReportAnswered({ current: { answered: 1, all: 5 }, all: { answered: 4, all: 16 } })
        project.expectSummaryReportAnswered({ current: { answered: 1, all: 2 }, all: { answered: 4, all: 7 } }, 'Chapter 2')
        
        project.openChapter('Chapter 2')
        cy.get('#question-294757cc-a5e2-425a-be7e-6fd496b0cd23').find('.btn-item-delete').should('have.length', 4)
        cy.get('#question-294757cc-a5e2-425a-be7e-6fd496b0cd23').find('.btn-item-delete').eq(2).click()
        project.expectSummaryReportAnswered({ current: { answered: 1, all: 5 }, all: { answered: 3, all: 15 } })
        project.expectSummaryReportAnswered({ current: { answered: 1, all: 2 }, all: { answered: 3, all: 6 } }, 'Chapter 2')
    })

    it('After clearing answers', () => {
        project.openChapter('Chapter 1')
        project.selectAnswer('FINDABLE: W=1, M=1')
        project.selectAnswer('INTEROPERABLE: W=0.15, M=0.95')
        project.selectAnswer('OPEN: W=0.5, M=0.2') // current
        project.selectAnswer('GOOD: W=0.9, M=1')
        project.selectAnswer('FINDABLE: W=0.3, M=1') // changing the first
        project.openChapter('Chapter 2')
        project.selectAnswer('Option 1.2') // Complex question 1
        project.selectAnswer('Option 2.2') // Complex question 2 (current)
        project.selectAnswer('Option 2.2.1')
        project.openChapter('Chapter 3')
        project.selectAnswer('Choice 2.1')
        project.selectAnswer('Choice 3.1')
        project.expectSummaryReportAnswered({ current: { answered: 3, all: 5 }, all: { answered: 9, all: 13 } })
        project.expectSummaryReportAnswered({ current: { answered: 1, all: 2 }, all: { answered: 4, all: 6 } }, 'Chapter 1')
        project.expectSummaryReportAnswered({ current: { answered: 1, all: 2 }, all: { answered: 3, all: 4 } }, 'Chapter 2')
        project.expectSummaryReportAnswered({ current: { answered: 1, all: 1 }, all: { answered: 2, all: 3 } }, 'Chapter 3')

        project.openChapter('Chapter 1')
        cy.get('#question-f4e3444a-6469-4546-9f14-f9304f8d1557 > div > a.clear-answer').click() // FINDABLE
        cy.get('#question-0eec0ecc-1da8-4db5-b7a3-da57d884eb52 > div > a.clear-answer').click() // OPEN
        project.openChapter('Chapter 2')
        cy.get('#question-16bd8329-cd7b-4029-84c4-5de0aa166369 > div > a.clear-answer').click() // Complex question 2 (with followup)
        project.openChapter('Chapter 3')
        project.selectAnswer('Choice 2.1')
        project.expectSummaryReportAnswered({ current: { answered: 0, all: 5 }, all: { answered: 4, all: 12 } })
        project.expectSummaryReportAnswered({ current: { answered: 0, all: 2 }, all: { answered: 2, all: 6 } }, 'Chapter 1')
        project.expectSummaryReportAnswered({ current: { answered: 0, all: 2 }, all: { answered: 1, all: 3 } }, 'Chapter 2')
        project.expectSummaryReportAnswered({ current: { answered: 0, all: 1 }, all: { answered: 1, all: 3 } }, 'Chapter 3')
    })
})
