import { dashboardLoads } from '../../shared/dashboard/dashboardLoads'

// Researcher - the dashboard needs no permission beyond being logged in.
describe('Dashboard / loads', () => {
  beforeEach(() => {
    cy.loginAs('researcher')
  })

  it('loads the dashboard', () => {
    dashboardLoads()
  })
})
