import { manageDocumentTemplateActions, actionTemplateId } from '../../shared/document-templates/documentTemplatesActions'

describe('Document Templates / actions', () => {
  beforeEach(() => {
    cy.loginAs('dataSteward')
  })

  afterEach(() => {
    cy.cleanupDocumentTemplate(actionTemplateId)
  })

  it('exercises the listing row actions: view, export, create editor, deprecate/restore and delete', () => {
    manageDocumentTemplateActions()
  })
})
