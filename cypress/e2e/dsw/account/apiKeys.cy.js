import { createApiKeyAndUseIt } from '../../shared/account/apiKeys'

// Researcher - managing your own API keys needs no permission.
describe('Account / API keys', () => {
  beforeEach(() => {
    cy.loginAs('researcher')
  })

  it('creates an API key, calls the API with it, then revokes it by deleting it', () => {
    createApiKeyAndUseIt()
  })
})
