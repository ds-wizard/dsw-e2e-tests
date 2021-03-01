
export const phases = [
    'Before Submitting the Proposal',
    'Before Submitting the DMP',
    'Before Finishing the Project'
]
export const defaultPhase = phases[0]
export const kmId = 'test-phases'
export const packageId = 'dsw:test-phases:1.0.0'

export const questions = [{
    identifier: '1',
    title: 'Question 1 (before submitting the proposal)',
    uuid: 'bcfb9bcc-365c-487d-a697-4474b7960c47',
    phase: 0
}, {
    identifier: '2',
    title: 'Question 2 (before submitting the DMP)',
    uuid: '5177eee1-ea25-41bb-b5ca-398c72a37664',
    phase: 1
}, {
    identifier: '3',
    title: 'Question 3 (before finishing the project)',
    uuid: 'd0fec286-f862-49e0-b8db-44bd890fe93c',
    phase: 2
}, {
    identifier: '4',
    title: 'Question 4 (never)',
    uuid: '35173624-293a-4899-982a-1808fd2bd0cf',
    phase: Number.MAX_VALUE
}]

export function switchPhase(phase) {
    cy.get('.questionnaire__left-panel__phase select').select(phase)
}

export function checkDesirability(question, desirable) {
    const chainer = desirable ? 'have.class' : 'not.have.class'
    cy.get(`#question-${question.uuid}`).contains('span.badge', question.identifier).should(chainer, 'badge-danger')
    cy.get(`#question-${question.uuid}`).contains('span', question.title).should(chainer, 'text-danger')
}

export function checkDesirabilityWithPhase(question, currentPhase) {
    const phaseIndex = typeof currentPhase === 'string' ? phases.indexOf(currentPhase) : currentPhase
    return checkDesirability(question, question.phase <= phaseIndex)
}

export function runCommonTests() {

    it('shows desirability captions', () => {
        questions.forEach((q) => {
            if (q.phase != Number.MAX_VALUE) {
                cy.get(`#question-${q.uuid}`).find('.extra-data').contains(phases[q.phase])
            } else {
                cy.get(`#question-${q.uuid}`).find('.extra-data').should('not.exist')
            }
        })
    })


    const testCases = [{
        name: 'with default phase',
        switchTo: null,
    }, {
        name: `with "${phases[0]}" selected`,
        switchTo: 0,
    }, {
        name: `with "${phases[1]}" selected`,
        switchTo: 1,
    }, {
        name: `with "${phases[2]}" selected`,
        switchTo: 2,
    }]
    testCases.forEach(({ name, switchTo }) => {
        it(name, () => {
            let currentPhase = defaultPhase
            if (switchTo != null) {
                currentPhase = phases[switchTo]
                switchPhase(currentPhase)
            }

            questions.forEach((question) => {
                checkDesirabilityWithPhase(question, currentPhase)
            })
        })
    })
}
