import { createKmEditor } from '../../shared/km-editor/kmEditorCreate'

// Logs in as Data Steward, not admin - the least-capable role that can use the KM Editor.
describe('KM Editor / create', () => {
  beforeEach(() => {
    cy.loginAs('dataSteward')
  })

  it('creates a knowledge model editor from scratch and lists it', () => {
    createKmEditor()
  })
})
