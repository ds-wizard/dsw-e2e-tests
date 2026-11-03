import { PERMISSION_LEVELS, setUpPermissionMatrixProject, checkPermissionLevel, tearDownPermissionMatrixProject } from '../../shared/projects/projectPermissions'

// No beforeEach/cy.loginAs here - the core logs in as Data Steward (the project's
// owner, in before()) and as Permission Probe in turn (one it() per permission set).
describe('Projects / permission matrix', () => {
  let projectUuid

  before(() => {
    setUpPermissionMatrixProject().then((uuid) => {
      projectUuid = uuid
    })
  })

  after(() => {
    tearDownPermissionMatrixProject(projectUuid)
  })

  PERMISSION_LEVELS.forEach((level) => {
    it(`grants exactly what "${level.name}" should on a project it does not own`, () => {
      checkPermissionLevel(projectUuid, level)
    })
  })
})
