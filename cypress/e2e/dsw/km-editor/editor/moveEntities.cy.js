import {
  moveQuestionBetweenChapters,
  moveFollowUpQuestionOutOfAnswer,
  moveItemQuestionOutOfListQuestion,
  moveAnswerBetweenOptionsQuestions,
  moveChoiceBetweenMultiChoiceQuestions,
  moveReferenceBetweenQuestions,
  moveExpertBetweenQuestions
} from '../../../shared/km-editor/editor/kmEditorMoveEntities'

describe('KM Editor / move entities', () => {
  beforeEach(() => {
    cy.loginAs('dataSteward')
  })

  it('moves a question between chapters', () => {
    moveQuestionBetweenChapters()
  })

  it('moves a follow-up question out of its answer', () => {
    moveFollowUpQuestionOutOfAnswer()
  })

  it('moves an item question out of its list question', () => {
    moveItemQuestionOutOfListQuestion()
  })

  it('moves an answer between options questions', () => {
    moveAnswerBetweenOptionsQuestions()
  })

  it('moves a choice between multi-choice questions', () => {
    moveChoiceBetweenMultiChoiceQuestions()
  })

  it('moves a reference between questions', () => {
    moveReferenceBetweenQuestions()
  })

  it('moves an expert between questions', () => {
    moveExpertBetweenQuestions()
  })
})
