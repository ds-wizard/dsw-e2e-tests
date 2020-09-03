import * as q from '../../../support/questionnaire-helpers'


describe('Questionnaire Summary Report - Metrics', () => {
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
            sharing: q.Restricted,
            name: questionnaireName,
            packageId
        }
        cy.createQuestionnaire(questionnaire)
        q.open(questionnaireName)
    })

    const testCases = [{
        name: 'Empty questionnaire',
        selections: [],
        reports: [{
            chapter: undefined,
            metrics: []
        }, {
            chapter: 'Chapter 1',
            metrics: []
        }, {
            chapter: 'Chapter 2',
            metrics: []
        }]
    }, {
        name: 'Select one per metric',
        selections: [{
            chapter: 'Chapter 1',
            answers: [
                'FINDABLE: W=0.3, M=1',
                'ACCESSIBLE: W=0.7, M=0.5',
                'INTEROPERABLE: W=0.15, M=0.95',
                'REUSABLE: W=1, M=1',
                'GOOD: W=0.9, M=1',
                'OPEN: W=0.6, M=0.9'
            ]
        }],
        reports: [{
            chapter: undefined,
            metrics: [
                { name: 'Findability', value: 1.00 },
                { name: 'Accessibility', value: 0.50 },
                { name: 'Interoperability', value: 0.95 },
                { name: 'Reusability', value: 1.00 },
                { name: 'Good DMP Practice', value: 1.00 },
                { name: 'Openness', value: 0.90 }
            ]
        }, {
            chapter: 'Chapter 1',
            metrics: [
                { name: 'Findability', value: 1.00 },
                { name: 'Accessibility', value: 0.50 },
                { name: 'Interoperability', value: 0.95 },
                { name: 'Reusability', value: 1.00 },
                { name: 'Good DMP Practice', value: 1.00 },
                { name: 'Openness', value: 0.90 }
            ]
        }, {
            chapter: 'Chapter 2',
            metrics: []
        }]
    }, {
        name: 'Select simple edge-cases',
        selections: [{
            chapter: 'Chapter 1',
            answers: [
                'FINDABLE: W=0, M=0',
                'ACCESSIBLE: W=0.7, M=0.0',
                'INTEROPERABLE: W=0.2, M=0.001',
                'GOOD: W=0.0, M=0.1'
            ]
        }],
        reports: [{
            chapter: undefined,
            metrics: [
                { name: 'Findability', value: 0.00 },
                { name: 'Accessibility', value: 0.00 },
                { name: 'Interoperability', value: 0.00 },
                { name: 'Good DMP Practice', value: 0.00 },
            ]
        }, {
            chapter: 'Chapter 1',
            metrics: [
                { name: 'Findability', value: 0.00 },
                { name: 'Accessibility', value: 0.00 },
                { name: 'Interoperability', value: 0.00 },
                { name: 'Good DMP Practice', value: 0.00 },
            ]
        }, {
            chapter: 'Chapter 2',
            metrics: []
        }]
    }, {
        name: 'Combine from more chapters',
        selections: [{
            chapter: 'Chapter 1',
            answers: [
                'FINDABLE: W=0.3, M=1',
                'ACCESSIBLE: W=0.7, M=0.5',
                'INTEROPERABLE: W=0.15, M=0.95',
                'REUSABLE: W=1, M=1',
                'GOOD: W=0.9, M=1',
                'OPEN: W=0.6, M=0.9'
            ]
        }, {
            chapter: 'Chapter 2',
            answers: [
                'Option 1.1', // F(0.7, 0.8), A(0.6, 1), I(1, 0.7), R(0.2, 0.9), G(0.5, 0.3), O(0.9, 0.1)
                'Option 2.1', // F(1, 0.3), I(0.3, 1), G(0.7, 0.6)
            ]
        }],
        reports: [{
            chapter: undefined,
            metrics: [
                { name: 'Findability', value: 0.58 }, // = (0.3×1 + 0.7×0.8 + 1×0.3) / (0.3 + 0.7 + 1)
                { name: 'Accessibility', value: 0.73 }, // = (0.7×0.5 + 0.6×1) / (0.7 + 0.6)
                { name: 'Interoperability', value: 0.79 }, // = (0.15×0.95 + 1×0.7 + 0.3×1) / (0.15 + 1 + 0.3)
                { name: 'Reusability', value: 0.98 }, // = (1×1 + 0.2×0.9) / (1 + 0.2)
                { name: 'Good DMP Practice', value: 0.70 }, // = (0.9×1 + 0.5×0.3 + 0.7×0.6) / (0.9 + 0.5 + 0.7)
                { name: 'Openness', value: 0.42 } // = (0.6×0.9 + 0.9×0.1) / (0.6 + 0.9)
            ]
        }, {
            chapter: 'Chapter 1',
            metrics: [
                { name: 'Findability', value: 1.00 },
                { name: 'Accessibility', value: 0.50 },
                { name: 'Interoperability', value: 0.95 },
                { name: 'Reusability', value: 1.00 },
                { name: 'Good DMP Practice', value: 1.00 },
                { name: 'Openness', value: 0.90 }
            ]
        }, {
            chapter: 'Chapter 2',
            metrics: [
                { name: 'Findability', value: 0.51 }, // = (0.7×0.8 + 1×0.3) / (0.7 + 1)
                { name: 'Accessibility', value: 1.00 },
                { name: 'Interoperability', value: 0.77 }, // = (1×0.7 + 0.3×1) / (1 + 0.3)
                { name: 'Reusability', value: 0.90 },
                { name: 'Good DMP Practice', value: 0.48 }, // = (0.5×0.3 + 0.7×0.6) / (0.5 + 0.7)
                { name: 'Openness', value: 0.10 }
            ]
        }]
    }, {
        name: 'Combine from more chapters with edge-cases',
        selections: [{
            chapter: 'Chapter 1',
            answers: [
                'FINDABLE: W=0, M=0',
                'ACCESSIBLE: W=0.7, M=0.0',
                'INTEROPERABLE: W=0.2, M=0.001',
                'GOOD: W=0.0, M=0.1'
            ]
        }, {
            chapter: 'Chapter 2',
            answers: [
                'Option 1.2', // F(0.3, 0.6), A(0.9, 0), I(0.6, 1), R(0, 0.9), G(0, 0), O(0.5, 0.3)
                'Option 2.2', // A(1, 0.4), R(0.4, 1), O(0.3, 0.3)
            ]
        }],
        reports: [{
            chapter: undefined,
            metrics: [
                { name: 'Findability', value: 0.60 }, // = (0×0 + 0.3×0.6) / (0 + 0.3)
                { name: 'Accessibility', value: 0.15 }, // = (0.7×0 + 0.9×0 + 1×0.4) / (0.7 + 0.9 + 1)
                { name: 'Interoperability', value: 0.75 }, // = (0.2×0.001 + 0.6×1) / (0.2 + 0.6)
                { name: 'Reusability', value: 1.00 }, // = (0×0.9 + 0.4×1) / (0 + 0.4)
                { name: 'Good DMP Practice', value: 0.00 }, // = (0×0.1 + 0×0) / (0 + 0)
                { name: 'Openness', value: 0.30 } // = (0.5×0.3 + 0.3×0.3) / (0.5 + 0.3)
            ]
        }, {
            chapter: 'Chapter 1',
            metrics: [
                { name: 'Findability', value: 0.00 },
                { name: 'Accessibility', value: 0.00 },
                { name: 'Interoperability', value: 0.00 },
                { name: 'Good DMP Practice', value: 0.00 },
            ]
        }, {
            chapter: 'Chapter 2',
            metrics: [
                { name: 'Findability', value: 0.60 },
                { name: 'Accessibility', value: 0.21 }, // = (0.9×0 + 1×0.4) / (0.9 + 1)
                { name: 'Interoperability', value: 1.00 },
                { name: 'Reusability', value: 1.00 }, // = (0×0.9 + 0.4×1) / (0 + 0.4)
                { name: 'Good DMP Practice', value: 0.00 }, 
                { name: 'Openness', value: 0.30 } // = (0.5×0.3 + 0.3×0.3) / (0.5 + 0.3)
            ]
        }]
    }, {
        name: 'Select also followup',
        selections: [{
            chapter: 'Chapter 2',
            answers: [
                'Option 1.3',  // F(0.35, 0.2), A(0.65, 0.15), I(0.3, 1), R(1, 0), G(0, 1), O(0, 0.3)
                'Option 2.2',  // A(1, 0.4), R(0.4, 1), O(0.3, 0.3)
                'Option 2.2.1' // F(0.3, 1), R(1, 0.4)
            ]
        }],
        reports: [{
            chapter: undefined,
            metrics: [
                { name: 'Findability', value: 0.57 }, // = (0.35×0.2 + 0.3×1) / (0.35 + 0.3)
                { name: 'Accessibility', value: 0.30 }, // = (0.65×0.15 + 1×0.4) / (0.65 + 1)
                { name: 'Interoperability', value: 1.00 },
                { name: 'Reusability', value: 0.33 }, // = (1×0 + 0.4×1 + 1×0.4) / (1 + 0.4 + 1)
                { name: 'Good DMP Practice', value: 0.00 },
                { name: 'Openness', value: 0.30 } // = (0×0.3 + 0.3×0.3) / (0 + 0.3)
            ]
        }, {
            chapter: 'Chapter 1',
            metrics: []
        }, {
            chapter: 'Chapter 2',
            metrics: [
                { name: 'Findability', value: 0.57 }, // = (0.35×0.2 + 0.3×1) / (0.35 + 0.3)
                { name: 'Accessibility', value: 0.30 }, // = (0.65×0.15 + 1×0.4) / (0.65 + 1)
                { name: 'Interoperability', value: 1.00 },
                { name: 'Reusability', value: 0.33 }, // = (1×0 + 0.4×1 + 1×0.4) / (1 + 0.4 + 1)
                { name: 'Good DMP Practice', value: 0.00 },
                { name: 'Openness', value: 0.30 } // = (0×0.3 + 0.3×0.3) / (0 + 0.3)]
            ]
        }]
    }]
    
    testCases.forEach(({ name, selections, reports }) => {
        it(name, () => {
            selections.forEach((selection) => {
                q.openChapter(selection.chapter)
                selection.answers.forEach((answer) => {
                    q.selectAnswer(answer)
                })
            })
            reports.forEach(({ chapter, metrics }) => {
                q.expectSummaryReportMetrics(metrics, chapter)
            })
        })
    })


    it('With list questions', () => {
        q.openChapter('Chapter 2')
        cy.get('#question-294757cc-a5e2-425a-be7e-6fd496b0cd23').contains('button', 'Add').click().click().click()
        cy.get('.item:nth-child(1)').contains('label', 'Template option 2').click()
        // F(0.3, 0.7), A(0.6, 0), R(1, 0.3), G(1, 1), O(0, 0)
        cy.get('.item:nth-child(2)').contains('label', 'Template option 1').click()
        // A(0.3, 1), I(1, 0.9), G(0, 1), O(0.7, 0.2)
        cy.get('.item:nth-child(3)').contains('label', 'Template option 2').click()
        // F(0.3, 0.7), A(0.6, 0), R(1, 0.3), G(1, 1), O(0, 0)
        const metrics1 = [
            { name: 'Findability', value: 0.70 },
            { name: 'Accessibility', value: 0.20 }, // = (0.6×0 + 0.3×1 + 0.6×0) / (0.6 + 0.3 + 0.6)
            { name: 'Interoperability', value: 0.90 },
            { name: 'Reusability', value: 0.30 },
            { name: 'Good DMP Practice', value: 1.00 },
            { name: 'Openness', value: 0.20 }
        ]
        q.expectSummaryReportMetrics(metrics1)
        q.expectSummaryReportMetrics(metrics1, 'Chapter 2')
        
        // Delete some item
        q.openChapter('Chapter 2')
        cy.get('#question-294757cc-a5e2-425a-be7e-6fd496b0cd23').find('.btn-item-delete').should('have.length', 3)
        cy.get('#question-294757cc-a5e2-425a-be7e-6fd496b0cd23').find('.btn-item-delete').eq(2).click()
        const metrics2 = [
            { name: 'Findability', value: 0.70 },
            { name: 'Accessibility', value: 0.33 }, // = (0.6×0 + 0.3×1) / (0.6 + 0.3)
            { name: 'Interoperability', value: 0.90 },
            { name: 'Reusability', value: 0.30 },
            { name: 'Good DMP Practice', value: 1.00 },
            { name: 'Openness', value: 0.20 }
        ]
        q.expectSummaryReportMetrics(metrics2)
        q.expectSummaryReportMetrics(metrics2, 'Chapter 2')
        
        // Delete all items
        q.openChapter('Chapter 2')
        cy.get('#question-294757cc-a5e2-425a-be7e-6fd496b0cd23').find('.btn-item-delete').should('have.length', 2)
        cy.get('#question-294757cc-a5e2-425a-be7e-6fd496b0cd23').find('.btn-item-delete').eq(1).click()
        cy.get('#question-294757cc-a5e2-425a-be7e-6fd496b0cd23').find('.btn-item-delete').eq(0).click()
        q.expectSummaryReportMetrics([])
        q.expectSummaryReportMetrics([], 'Chapter 2')
    })


    it('After clearing answers', () => {
        q.openChapter('Chapter 1')
        q.selectAnswer('FINDABLE: W=1, M=1')
        q.selectAnswer('INTEROPERABLE: W=0.15, M=0.95')
        q.selectAnswer('OPEN: W=0.5, M=0.2')
        q.selectAnswer('GOOD: W=0.9, M=1')
        q.selectAnswer('FINDABLE: W=0.3, M=1')
        q.openChapter('Chapter 2')
        q.selectAnswer('Option 1.2') // F(0.3, 0.6), A(0.9, 0), I(0.6, 1), R(0, 0.9), G(0, 0), O(0.5, 0.3)
        q.selectAnswer('Option 2.2') // A(1, 0.4), R(0.4, 1), O(0.3, 0.3)
        q.selectAnswer('Option 2.2.1') // F(0.3, 1), R(1, 0.4)
        q.expectSummaryReportMetrics([
            { name: 'Findability', value: 0.87 }, // = (0.3×1 + 0.3×0.6 + 0.3×1) / (0.3 + 0.3 + 0.3)
            { name: 'Accessibility', value: 0.21 }, // = (0.9×0 + 1×0.4) / (0.9 + 1)
            { name: 'Interoperability', value: 0.99 }, // = (0.15×0.95 + 0.6×1) / (0.15 + 0.6),
            { name: 'Reusability', value: 0.57 }, // = (0×0.9 + 0.4×1 + 1×0.4) / (0 + 0.4 + 1)
            { name: 'Good DMP Practice', value: 1.00 },
            { name: 'Openness', value: 0.26 } // = (0.5×0.2 + 0.5×0.3 + 0.3×0.3) / (0.5 + 0.5 + 0.3)
        ])
        q.expectSummaryReportMetrics([
            { name: 'Findability', value: 1.00 },
            { name: 'Interoperability', value: 0.95 },
            { name: 'Good DMP Practice', value: 1.00 },
            { name: 'Openness', value: 0.20 }
        ], 'Chapter 1')
        q.expectSummaryReportMetrics([
            { name: 'Findability', value: 0.80 }, // = (0.3×0.6 + 0.3×1) / (0.3 + 0.3)
            { name: 'Accessibility', value: 0.21 }, // = (0.9×0 + 1×0.4) / (0.9 + 1)
            { name: 'Interoperability', value: 1.00 },
            { name: 'Reusability', value: 0.57 }, // = (0.4×1 + 1×0.4) / (0.4 + 1)
            { name: 'Good DMP Practice', value: 0.00 },
            { name: 'Openness', value: 0.30 }
        ], 'Chapter 2')

        // Clear some answer (including the one with followup)
        q.openChapter('Chapter 1')
        cy.get('#question-f4e3444a-6469-4546-9f14-f9304f8d1557 > div > a.clear-answer').click() // FINDABLE
        cy.get('#question-0eec0ecc-1da8-4db5-b7a3-da57d884eb52 > div > a.clear-answer').click() // OPEN
        q.openChapter('Chapter 2')
        cy.get('#question-16bd8329-cd7b-4029-84c4-5de0aa166369 > div > a.clear-answer').click() // Complex question 2 (with followup)
        q.expectSummaryReportMetrics([
            { name: 'Findability', value: 0.60 }, // only 1.2
            { name: 'Accessibility', value: 0.00 }, // only 1.2
            { name: 'Interoperability', value: 0.99 }, // = (0.15×0.95 + 0.6×1) / (0.15 + 0.6),
            { name: 'Reusability', value: 0.00 }, // weight 0
            { name: 'Good DMP Practice', value: 1.00 },
            { name: 'Openness', value: 0.30 } // only 1.2
        ])
        q.expectSummaryReportMetrics([
            { name: 'Interoperability', value: 0.95 },
            { name: 'Good DMP Practice', value: 1.00 }
        ], 'Chapter 1')
        q.expectSummaryReportMetrics([
            { name: 'Findability', value: 0.60 },
            { name: 'Accessibility', value: 0.00 },
            { name: 'Interoperability', value: 1.00 },
            { name: 'Reusability', value: 0.00 },
            { name: 'Good DMP Practice', value: 0.00 },
            { name: 'Openness', value: 0.30 }
        ], 'Chapter 2')

        // Clear all
        q.openChapter('Chapter 1')
        cy.get('#question-d8161299-3eb2-4a0d-aca9-1361f5945430 > div > a.clear-answer').click() // INTEROPERABLE
        cy.get('#question-0fc83103-a1b8-4a09-b65e-d2d3db037d4a > div > a.clear-answer').click() // GOOD
        q.openChapter('Chapter 2')
        cy.get('#question-4a1c2501-f4c7-41f1-8c73-67c0f7a6d7d6 > div > a.clear-answer').click() // Complex question 1
        q.expectSummaryReportMetrics([])
        q.expectSummaryReportMetrics([], 'Chapter 1')
        q.expectSummaryReportMetrics([], 'Chapter 2')
    })
})
