import { SHARE_LEVELS, setUpSharedProject, checkShareLevel, tearDownSharedProject } from '../../shared/projects/projectShareUserGroup'

// No beforeEach/cy.loginAs here - the core logs in as Researcher (the project's
// owner, in before()) and as Permission Probe in turn (one it() per share level).
describe('Projects / share with a user group', () => {
  let projectUuid
  let groupUuid

  before(() => {
    setUpSharedProject().then((result) => {
      projectUuid = result.projectUuid
      groupUuid = result.groupUuid
    })
  })

  after(() => {
    tearDownSharedProject(projectUuid, groupUuid)
  })

  SHARE_LEVELS.forEach((level) => {
    it(`shares a project with a user group as "${level.perm}" and unlocks exactly that`, () => {
      checkShareLevel(projectUuid, groupUuid, level)
    })
  })
})
