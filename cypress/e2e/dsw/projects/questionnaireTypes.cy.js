import {
  answerFileQuestion,
  answerIntegrationQuestion,
  answerItemSelectQuestion,
  answerListQuestion,
  answerMultiChoiceQuestion,
  answerOptionsQuestion,
  answerValueQuestion
} from '../../shared/projects/projectQuestionnaireTypes'

// Logs in as Data Steward - needs knowledgeModels.useEditor/manage to build each
// question type's own KM (see questionTypeKms.js), not just projects.create.
describe('Projects / questionnaire question types', () => {
  beforeEach(() => {
    cy.loginAs('dataSteward')
  })

  it('answers every value type of a Value question', () => {
    answerValueQuestion()
  })

  it('answers an Options question and its follow-up', () => {
    answerOptionsQuestion()
  })

  it('answers a MultiChoice question', () => {
    answerMultiChoiceQuestion()
  })

  it('adds a list item and answers its own question', () => {
    answerListQuestion()
  })

  it('selects a list item in an ItemSelect question', () => {
    answerItemSelectQuestion()
  })

  it('uploads a file to a File question', () => {
    answerFileQuestion()
  })

  it('answers an Integration question with a custom reply', () => {
    answerIntegrationQuestion()
  })
})
