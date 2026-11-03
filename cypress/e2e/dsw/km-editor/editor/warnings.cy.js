import {
  emptyChapterTitleWarning,
  emptyQuestionTitleWarning,
  noAnswersForOptionsQuestionWarning,
  noItemQuestionsForListQuestionWarning,
  noListQuestionSelectedForItemSelectQuestionWarning,
  noChoicesForMultiChoiceQuestionWarning,
  noIntegrationSelectedForIntegrationQuestionWarning,
  emptyAnswerLabelWarning,
  emptyChoiceLabelWarning,
  emptyUrlForUrlReferenceWarning,
  invalidUrlForUrlReferenceWarning,
  noResourcePageSelectedForResourcePageReferenceWarning,
  emptyExpertEmailWarning,
  invalidExpertEmailWarning,
  emptyMetricTitleWarning,
  emptyPhaseTitleWarning,
  emptyTagNameWarning,
  emptyResourceCollectionTitleWarning,
  emptyResourcePageTitleWarning
} from '../../../shared/km-editor/editor/kmEditorWarnings'

describe('KM Editor / warnings', () => {
  beforeEach(() => {
    cy.loginAs('dataSteward')
  })

  it('warns about an empty chapter title', () => {
    emptyChapterTitleWarning()
  })

  it('warns about an empty question title', () => {
    emptyQuestionTitleWarning()
  })

  it('warns about an options question with no answers', () => {
    noAnswersForOptionsQuestionWarning()
  })

  it('warns about a list question with no item questions', () => {
    noItemQuestionsForListQuestionWarning()
  })

  it('warns about an item select question with no list question selected', () => {
    noListQuestionSelectedForItemSelectQuestionWarning()
  })

  it('warns about a multi-choice question with no choices', () => {
    noChoicesForMultiChoiceQuestionWarning()
  })

  it('warns about an integration question with no integration selected', () => {
    noIntegrationSelectedForIntegrationQuestionWarning()
  })

  it('warns about an empty answer label', () => {
    emptyAnswerLabelWarning()
  })

  it('warns about an empty choice label', () => {
    emptyChoiceLabelWarning()
  })

  it('warns about an empty URL on a URL reference', () => {
    emptyUrlForUrlReferenceWarning()
  })

  it('warns about an invalid URL on a URL reference', () => {
    invalidUrlForUrlReferenceWarning()
  })

  it('warns about a resource page reference with no resource page selected', () => {
    noResourcePageSelectedForResourcePageReferenceWarning()
  })

  it('warns about an empty expert email', () => {
    emptyExpertEmailWarning()
  })

  it('warns about an invalid expert email', () => {
    invalidExpertEmailWarning()
  })

  it('warns about an empty metric title', () => {
    emptyMetricTitleWarning()
  })

  it('warns about an empty phase title', () => {
    emptyPhaseTitleWarning()
  })

  it('warns about an empty tag name', () => {
    emptyTagNameWarning()
  })

  it('warns about an empty resource collection title', () => {
    emptyResourceCollectionTitleWarning()
  })

  it('warns about an empty resource page title', () => {
    emptyResourcePageTitleWarning()
  })
})
