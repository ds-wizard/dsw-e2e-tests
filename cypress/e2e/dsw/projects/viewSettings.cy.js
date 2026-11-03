import { buildQuestionnaireFeaturesKm, deleteQuestionnaireFeaturesKm } from '../../shared/projects/questionnaireFeaturesKm'
import { toggleViewSettings } from '../../shared/projects/projectViewSettings'

// The KM is built once as Data Steward (needs the KM editor); the test itself runs
// as Researcher, who owns the project it creates.
describe('Projects / questionnaire view settings', () => {
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

  it('hides and shows each part of the questionnaire, and remembers it', () => {
    toggleViewSettings(km)
  })
})
