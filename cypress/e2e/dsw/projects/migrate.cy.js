import { migrateProject } from '../../shared/projects/projectMigrate'

// Logs in as Data Steward, not Researcher - migrating onto a project it owns is
// permission-free, but building the newer KM version to migrate onto needs
// knowledgeModels.useEditor/manage, which only Data Steward has.
describe('Projects / migrate', () => {
  beforeEach(() => {
    cy.loginAs('dataSteward')
  })

  it('migrates a project onto a newer version of its knowledge model', () => {
    migrateProject()
  })
})
