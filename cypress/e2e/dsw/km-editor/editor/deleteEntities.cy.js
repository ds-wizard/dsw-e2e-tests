import {
  deleteChapterFromKmEditor,
  deleteMetricFromKmEditor,
  deletePhaseFromKmEditor,
  deleteTagFromKmEditor,
  deleteResourceCollectionFromKmEditor,
  deleteResourcePageFromKmEditor,
  deleteQuestionFromKmEditor,
  deleteAnswerFromKmEditor,
  deleteChoiceFromKmEditor,
  deleteFollowUpQuestionFromKmEditor,
  deleteItemQuestionFromKmEditor,
  deleteExpertFromKmEditor,
  deleteReferenceFromKmEditor,
  deleteIntegrationFromKmEditor,
  deleteInheritedChapterFromKmEditor,
  deleteInheritedMetricFromKmEditor,
  deleteInheritedPhaseFromKmEditor,
  deleteInheritedTagFromKmEditor,
  deleteInheritedResourceCollectionFromKmEditor,
  deleteInheritedResourcePageFromKmEditor,
  deleteInheritedQuestionFromKmEditor,
  deleteInheritedAnswerFromKmEditor,
  deleteInheritedChoiceFromKmEditor,
  deleteInheritedFollowUpQuestionFromKmEditor,
  deleteInheritedItemQuestionFromKmEditor,
  deleteInheritedExpertFromKmEditor,
  deleteInheritedReferenceFromKmEditor,
  deleteInheritedIntegrationFromKmEditor
} from '../../../shared/km-editor/editor/kmEditorDeleteEntities'

describe('KM Editor / delete entities', () => {
  beforeEach(() => {
    cy.loginAs('dataSteward')
  })

  it('deletes a chapter', () => {
    deleteChapterFromKmEditor()
  })

  it('deletes a metric', () => {
    deleteMetricFromKmEditor()
  })

  it('deletes a phase', () => {
    deletePhaseFromKmEditor()
  })

  it('deletes a tag', () => {
    deleteTagFromKmEditor()
  })

  it('deletes a resource collection', () => {
    deleteResourceCollectionFromKmEditor()
  })

  it('deletes a resource page', () => {
    deleteResourcePageFromKmEditor()
  })

  it('deletes a question', () => {
    deleteQuestionFromKmEditor()
  })

  it('deletes an answer', () => {
    deleteAnswerFromKmEditor()
  })

  it('deletes a choice', () => {
    deleteChoiceFromKmEditor()
  })

  it('deletes a follow-up question', () => {
    deleteFollowUpQuestionFromKmEditor()
  })

  it('deletes an item question', () => {
    deleteItemQuestionFromKmEditor()
  })

  it('deletes an expert', () => {
    deleteExpertFromKmEditor()
  })

  it('deletes a reference', () => {
    deleteReferenceFromKmEditor()
  })

  it('deletes an integration', () => {
    deleteIntegrationFromKmEditor()
  })

  it('deletes a chapter inherited from a forked package, keeping it marked deleted', () => {
    deleteInheritedChapterFromKmEditor()
  })

  it('deletes a metric inherited from a forked package, keeping it marked deleted', () => {
    deleteInheritedMetricFromKmEditor()
  })

  it('deletes a phase inherited from a forked package, keeping it marked deleted', () => {
    deleteInheritedPhaseFromKmEditor()
  })

  it('deletes a tag inherited from a forked package, keeping it marked deleted', () => {
    deleteInheritedTagFromKmEditor()
  })

  it('deletes a resource collection inherited from a forked package, keeping it marked deleted', () => {
    deleteInheritedResourceCollectionFromKmEditor()
  })

  it('deletes a resource page inherited from a forked package, keeping it marked deleted', () => {
    deleteInheritedResourcePageFromKmEditor()
  })

  it('deletes a question inherited from a forked package, keeping it marked deleted', () => {
    deleteInheritedQuestionFromKmEditor()
  })

  it('deletes an answer inherited from a forked package, keeping it marked deleted', () => {
    deleteInheritedAnswerFromKmEditor()
  })

  it('deletes a choice inherited from a forked package, keeping it marked deleted', () => {
    deleteInheritedChoiceFromKmEditor()
  })

  it('deletes a follow-up question inherited from a forked package, keeping it marked deleted', () => {
    deleteInheritedFollowUpQuestionFromKmEditor()
  })

  it('deletes an item question inherited from a forked package, keeping it marked deleted', () => {
    deleteInheritedItemQuestionFromKmEditor()
  })

  it('deletes an expert inherited from a forked package, keeping it marked deleted', () => {
    deleteInheritedExpertFromKmEditor()
  })

  it('deletes a reference inherited from a forked package, keeping it marked deleted', () => {
    deleteInheritedReferenceFromKmEditor()
  })

  it('deletes an integration inherited from a forked package, keeping it marked deleted', () => {
    deleteInheritedIntegrationFromKmEditor()
  })
})
