import {
  containsUpdateOptionAndBadge,
  pauseResumeAndCancelMigration,
  rejectDiscardsTheChange
} from '../../../shared/km-editor/migration/kmEditorMigrationMechanics'

describe('KM Editor / migration mechanics', () => {
  // Cleans up before each test rather than after - an afterEach gets skipped if the
  // run crashes instead of just failing a test, leaving orphaned KM editors/packages
  // that corrupt not just later full runs but the very next test in this same file.
  beforeEach(() => {
    cy.cleanupKmMigrationTestData()
    cy.loginAs('dataSteward')
  })

  it('offers the update action and badge, both opening the same modal', () => {
    containsUpdateOptionAndBadge()
  })

  it('can pause, resume, and cancel a migration', () => {
    pauseResumeAndCancelMigration()
  })

  it('rejecting a conflict keeps the migrating editor\'s own value', () => {
    rejectDiscardsTheChange()
  })
})
