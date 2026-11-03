import {
  editChapterFields,
  editMetricFields,
  editPhaseFields,
  editTagFields,
  editResourceCollectionFields,
  editResourcePageFields,
  editOptionsQuestionFields,
  editMultiChoiceQuestionFields,
  editListQuestionFields,
  editValueQuestionFields,
  editAnswerFields,
  editChoiceFields,
  editFollowUpQuestionFields,
  editItemQuestionFields,
  editExpertFields,
  editUrlReferenceFields,
  editResourcePageReferenceFields,
  editCrossReferenceFields,
  editIntegrationFields,
  editIntegrationQuestionFields,
  editItemSelectQuestionFields,
  editFileQuestionFields,
  editInheritedChapterFields,
  editInheritedMetricFields,
  editInheritedPhaseFields,
  editInheritedTagFields,
  editInheritedResourceCollectionFields,
  editInheritedResourcePageFields,
  editInheritedQuestionFields,
  editInheritedAnswerFields,
  editInheritedChoiceFields,
  editInheritedFollowUpQuestionFields,
  editInheritedItemQuestionFields,
  editInheritedExpertFields,
  editInheritedReferenceFields,
  editInheritedIntegrationFields
} from '../../../shared/km-editor/editor/kmEditorEditEntities'

describe('KM Editor / edit entities', () => {
  beforeEach(() => {
    cy.loginAs('dataSteward')
  })

  it('edits a chapter\'s fields', () => {
    editChapterFields()
  })

  it('edits a metric\'s fields', () => {
    editMetricFields()
  })

  it('edits a phase\'s fields', () => {
    editPhaseFields()
  })

  it('edits a tag\'s fields', () => {
    editTagFields()
  })

  it('edits a resource collection\'s fields', () => {
    editResourceCollectionFields()
  })

  it('edits a resource page\'s fields', () => {
    editResourcePageFields()
  })

  it('edits an options question\'s fields', () => {
    editOptionsQuestionFields()
  })

  it('edits a multi-choice question\'s fields', () => {
    editMultiChoiceQuestionFields()
  })

  it('edits a list question\'s fields', () => {
    editListQuestionFields()
  })

  it('edits a value question\'s fields', () => {
    editValueQuestionFields()
  })

  it('edits an answer\'s fields', () => {
    editAnswerFields()
  })

  it('edits a choice\'s fields', () => {
    editChoiceFields()
  })

  it('edits a follow-up question\'s fields', () => {
    editFollowUpQuestionFields()
  })

  it('edits an item question\'s fields', () => {
    editItemQuestionFields()
  })

  it('edits an expert\'s fields', () => {
    editExpertFields()
  })

  it('edits a URL reference\'s fields', () => {
    editUrlReferenceFields()
  })

  it('edits a resource page reference\'s fields', () => {
    editResourcePageReferenceFields()
  })

  it('edits a cross reference\'s fields', () => {
    editCrossReferenceFields()
  })

  it('edits an integration\'s fields', () => {
    editIntegrationFields()
  })

  it('edits an integration question\'s fields', () => {
    editIntegrationQuestionFields()
  })

  it('edits an item select question\'s fields', () => {
    editItemSelectQuestionFields()
  })

  it('edits a file question\'s fields', () => {
    editFileQuestionFields()
  })

  it('edits a chapter inherited from a forked package', () => {
    editInheritedChapterFields()
  })

  it('edits a metric inherited from a forked package', () => {
    editInheritedMetricFields()
  })

  it('edits a phase inherited from a forked package', () => {
    editInheritedPhaseFields()
  })

  it('edits a tag inherited from a forked package', () => {
    editInheritedTagFields()
  })

  it('edits a resource collection inherited from a forked package', () => {
    editInheritedResourceCollectionFields()
  })

  it('edits a resource page inherited from a forked package', () => {
    editInheritedResourcePageFields()
  })

  it('edits a question inherited from a forked package', () => {
    editInheritedQuestionFields()
  })

  it('edits an answer inherited from a forked package', () => {
    editInheritedAnswerFields()
  })

  it('edits a choice inherited from a forked package', () => {
    editInheritedChoiceFields()
  })

  it('edits a follow-up question inherited from a forked package', () => {
    editInheritedFollowUpQuestionFields()
  })

  it('edits an item question inherited from a forked package', () => {
    editInheritedItemQuestionFields()
  })

  it('edits an expert inherited from a forked package', () => {
    editInheritedExpertFields()
  })

  it('edits a reference inherited from a forked package', () => {
    editInheritedReferenceFields()
  })

  it('edits an integration inherited from a forked package', () => {
    editInheritedIntegrationFields()
  })
})
