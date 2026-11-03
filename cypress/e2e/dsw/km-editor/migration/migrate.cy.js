import { migrateForkedEditor } from '../../../shared/km-editor/migration/kmEditorMigrate'

describe('KM Editor / migrate', () => {
  // Cleans up before each test rather than after - an afterEach gets skipped if the
  // run crashes instead of just failing a test, leaving orphaned KM editors/packages
  // that corrupt not just later full runs but the very next test in this same file.
  beforeEach(() => {
    cy.cleanupKmMigrationTestData()
    cy.loginAs('dataSteward')
  })

  it('migrates a forked editor onto a newer version of its parent', () => {
    migrateForkedEditor()
  })
})
