import { checkKnowledgeModelActionsGatedByManage } from '../../shared/knowledge-models/knowledgeModelsActionsPermissions'

// No beforeEach/cy.loginAs here - the core logs in as Data Steward (to create and
// publish the package) and as Permission Probe in turn.
describe('Knowledge Models / detail actions gated by permission', () => {
  it('shows only the read-only actions until knowledgeModels.manage is granted', () => {
    checkKnowledgeModelActionsGatedByManage()
  })
})
