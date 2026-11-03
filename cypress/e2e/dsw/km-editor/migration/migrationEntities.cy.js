import {
  chapterMigration,
  metricMigration,
  phaseMigration,
  tagMigration,
  resourceCollectionMigration,
  resourcePageMigration,
  questionMigration,
  answerMigration,
  choiceMigration,
  referenceMigration,
  expertMigration,
  integrationMigration,
  questionMovedMigration
} from '../../../shared/km-editor/migration/kmEditorMigrationEntities'

describe('KM Editor / migration entities', () => {
  // Cleans up before each test rather than after - an afterEach gets skipped if the
  // run crashes instead of just failing a test, leaving orphaned KM editors/packages
  // that corrupt not just later full runs but the very next test in this same file.
  beforeEach(() => {
    cy.cleanupKmMigrationTestData()
    cy.loginAs('dataSteward')
  })

  it('resolves a new/changed/deleted chapter', () => {
    chapterMigration()
  })

  it('resolves a new/changed/deleted metric', () => {
    metricMigration()
  })

  it('resolves a new/changed/deleted phase', () => {
    phaseMigration()
  })

  it('resolves a new/changed/deleted tag', () => {
    tagMigration()
  })

  it('resolves a new/changed/deleted resource collection', () => {
    resourceCollectionMigration()
  })

  it('resolves a new/changed/deleted resource page', () => {
    resourcePageMigration()
  })

  it('resolves a new/changed/deleted question', () => {
    questionMigration()
  })

  it('resolves a new/changed/deleted answer', () => {
    answerMigration()
  })

  it('resolves a new/changed/deleted choice', () => {
    choiceMigration()
  })

  it('resolves a new/changed/deleted reference', () => {
    referenceMigration()
  })

  it('resolves a new/changed/deleted expert', () => {
    expertMigration()
  })

  it('resolves a new/changed/deleted integration', () => {
    integrationMigration()
  })

  it('resolves a moved question', () => {
    questionMovedMigration()
  })
})
