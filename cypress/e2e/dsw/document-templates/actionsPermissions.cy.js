import { checkDocumentTemplateActionsGatedByManage } from '../../shared/document-templates/documentTemplatesActionsPermissions'

// No beforeEach/cy.loginAs here - the core imports the template with an admin token
// and logs in as Permission Probe itself.
describe('Document Templates / detail actions gated by permission', () => {
  it('shows the kebab menu\'s actions only once documentTemplates.manage is granted', () => {
    checkDocumentTemplateActionsGatedByManage()
  })
})
