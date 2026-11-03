import { buildQuestionnaireFeaturesKm, deleteQuestionnaireFeaturesKm } from '../../shared/projects/questionnaireFeaturesKm'
import { addAndRemoveTodo } from '../../shared/projects/projectTodos'

// The KM is built once as Data Steward (needs the KM editor); the test itself runs
// as Researcher, who owns the project it creates.
describe('Projects / TODOs', () => {
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

  it('adds a TODO, jumps to it from the TODOs panel and removes it', () => {
    addAndRemoveTodo(km)
  })
})
