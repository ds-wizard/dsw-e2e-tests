import { manageDocumentTemplateDetailActions, detailActionTemplateId } from '../../shared/document-templates/documentTemplateDetailActions'

describe('Document Templates / detail actions', () => {
  beforeEach(() => {
    cy.loginAs('dataSteward')
  })

  afterEach(() => {
    cy.cleanupDocumentTemplate(detailActionTemplateId)
  })

  it('exercises the detail page actions menu: export, create editor, deprecate/restore and delete', () => {
    manageDocumentTemplateDetailActions()
  })
})
