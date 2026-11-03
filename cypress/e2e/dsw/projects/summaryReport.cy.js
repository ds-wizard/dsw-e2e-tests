import { viewProjectSummaryReport } from '../../shared/projects/projectSummaryReport'

// Logs in as Data Steward, not Researcher - the core builds its own KM through the
// real KM Editor (summaryReportKm.js), which needs knowledgeModels.useEditor/manage;
// Data Steward also has projects.create, so it can create the project itself too.
describe('Projects / summary report', () => {
  beforeEach(() => {
    cy.loginAs('dataSteward')
  })

  it('updates the metrics table and chart correctly as answers change', () => {
    viewProjectSummaryReport()
  })
})
