import { SHARE_LEVELS, setUpSharedProject, checkShareLevel, tearDownSharedProject } from '../../shared/projects/projectShare'

// No beforeEach/cy.loginAs here - the core logs in as Researcher (the project's
// owner, in before()) and as Permission Probe in turn (one it() per share level).
describe('Projects / share', () => {
  let projectUuid
  let memberUuid

  before(() => {
    setUpSharedProject().then((result) => {
      projectUuid = result.projectUuid
      memberUuid = result.memberUuid
    })
  })

  after(() => {
    tearDownSharedProject(projectUuid)
  })

  SHARE_LEVELS.forEach((level) => {
    it(`shares a project with another user as "${level.perm}" and unlocks exactly that`, () => {
      checkShareLevel(projectUuid, memberUuid, level)
    })
  })
})
