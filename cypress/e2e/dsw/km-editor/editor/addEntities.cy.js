import {
  addChapterToKmEditor,
  addMetricToKmEditor,
  addPhaseToKmEditor,
  addTagToKmEditor,
  addResourceCollectionToKmEditor,
  addResourcePageToKmEditor,
  addOptionsQuestionToKmEditor,
  addMultiChoiceQuestionToKmEditor,
  addListQuestionToKmEditor,
  addValueQuestionToKmEditor,
  addAnswerToOptionsQuestion,
  addChoiceToMultiChoiceQuestion,
  addFollowUpQuestionToAnswer,
  addItemQuestionToListQuestion,
  addExpertToQuestion,
  addUrlReference,
  addResourcePageReference,
  addCrossReference,
  addIntegrationToKmEditor,
  addIntegrationQuestion,
  addItemSelectQuestion,
  addFileQuestion
} from '../../../shared/km-editor/editor/kmEditorAddEntities'

describe('KM Editor / add entities', () => {
  beforeEach(() => {
    cy.loginAs('dataSteward')
  })

  it('adds a chapter to a knowledge model', () => {
    addChapterToKmEditor()
  })

  it('adds a metric to a knowledge model', () => {
    addMetricToKmEditor()
  })

  it('adds a phase to a knowledge model', () => {
    addPhaseToKmEditor()
  })

  it('adds a tag to a knowledge model', () => {
    addTagToKmEditor()
  })

  it('adds a resource collection to a knowledge model', () => {
    addResourceCollectionToKmEditor()
  })

  it('adds a resource page to a resource collection', () => {
    addResourcePageToKmEditor()
  })

  it('adds an options question to a chapter', () => {
    addOptionsQuestionToKmEditor()
  })

  it('adds a multi-choice question to a chapter', () => {
    addMultiChoiceQuestionToKmEditor()
  })

  it('adds a list question to a chapter', () => {
    addListQuestionToKmEditor()
  })

  it('adds a value question to a chapter', () => {
    addValueQuestionToKmEditor()
  })

  it('adds an answer to an options question', () => {
    addAnswerToOptionsQuestion()
  })

  it('adds a choice to a multi-choice question', () => {
    addChoiceToMultiChoiceQuestion()
  })

  it('adds a follow-up question to an answer', () => {
    addFollowUpQuestionToAnswer()
  })

  it('adds an item question to a list question', () => {
    addItemQuestionToListQuestion()
  })

  it('adds an expert to a question', () => {
    addExpertToQuestion()
  })

  it('adds a URL reference to a question', () => {
    addUrlReference()
  })

  it('adds a resource page reference to a question', () => {
    addResourcePageReference()
  })

  it('adds a cross reference to a question', () => {
    addCrossReference()
  })

  it('adds an integration to a knowledge model', () => {
    addIntegrationToKmEditor()
  })

  it('adds an integration question pointing at an integration', () => {
    addIntegrationQuestion()
  })

  it('adds an item select question pointing at a list question', () => {
    addItemSelectQuestion()
  })

  it('adds a file question to a chapter', () => {
    addFileQuestion()
  })
})
