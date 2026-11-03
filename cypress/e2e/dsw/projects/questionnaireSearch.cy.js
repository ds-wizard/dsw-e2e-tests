import { buildQuestionnaireFeaturesKm, deleteQuestionnaireFeaturesKm } from '../../shared/projects/questionnaireFeaturesKm'
import { searchAndJumpToQuestion } from '../../shared/projects/projectQuestionnaireSearch'

// The KM is built once as Data Steward (needs the KM editor); the test itself runs
// as Researcher, who owns the project it creates.
describe('Projects / questionnaire search', () => {
  let km

  before(() => {
    cy.loginAs('dataSteward')
    buildQuestionnaireFeaturesKm().then((built) => {
      km = built
    })
  })

  after(() => {
    deleteQuestionnaireFeaturesKm(km)
  })

  beforeEach(() => {
    cy.loginAs('researcher')
  })

  it('finds a question in another chapter and jumps to it', () => {
    searchAndJumpToQuestion(km)
  })
})
