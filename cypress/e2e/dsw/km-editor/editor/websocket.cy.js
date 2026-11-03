import { pushChapterOverWebsocket } from '../../../shared/km-editor/editor/kmEditorWebsocket'

describe('KM Editor / websocket', () => {
  beforeEach(() => {
    cy.loginAs('dataSteward')
  })

  it('reacts live to a chapter added by another client', () => {
    pushChapterOverWebsocket()
  })
})
