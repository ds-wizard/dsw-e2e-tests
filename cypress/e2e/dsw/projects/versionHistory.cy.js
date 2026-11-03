import { manageVersions } from '../../shared/projects/projectVersionHistory'

describe('Projects / version history', () => {
  beforeEach(() => {
    cy.loginAs('researcher')
  })

  it('names, renames, views and deletes a version, then reverts to it', () => {
    manageVersions()
  })
})
