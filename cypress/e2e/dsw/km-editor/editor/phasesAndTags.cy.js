import {
  newPhaseAppearsOnQuestionAndInPhaseMatrix,
  selectingPhaseOnQuestionReflectsInPhaseMatrix,
  selectingPhaseInMatrixReflectsOnQuestion,
  newTagAppearsOnQuestionAndInTagMatrix,
  selectingTagOnQuestionReflectsInTagMatrix,
  selectingTagInMatrixReflectsOnQuestion
} from '../../../shared/km-editor/editor/kmEditorPhasesAndTags'

describe('KM Editor / phases and question tags', () => {
  beforeEach(() => {
    cy.loginAs('dataSteward')
  })

  it('a newly created phase appears on the question and in the phase matrix', () => {
    newPhaseAppearsOnQuestionAndInPhaseMatrix()
  })

  it('selecting a phase on the question reflects in the phase matrix', () => {
    selectingPhaseOnQuestionReflectsInPhaseMatrix()
  })

  it('selecting a phase in the matrix reflects on the question', () => {
    selectingPhaseInMatrixReflectsOnQuestion()
  })

  it('a newly created tag appears on the question and in the tag matrix', () => {
    newTagAppearsOnQuestionAndInTagMatrix()
  })

  it('selecting a tag on the question reflects in the tag matrix', () => {
    selectingTagOnQuestionReflectsInTagMatrix()
  })

  it('selecting a tag in the matrix reflects on the question', () => {
    selectingTagInMatrixReflectsOnQuestion()
  })
})
