import { publishKmEditor } from '../../shared/km-editor/kmEditorPublish'

describe('KM Editor / publish', () => {
  beforeEach(() => {
    cy.loginAs('dataSteward')
  })

  it('publishes a new knowledge model package from the editor', () => {
    publishKmEditor()
  })
})
