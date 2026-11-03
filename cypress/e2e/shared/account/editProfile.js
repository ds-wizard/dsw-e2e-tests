// Account / edit own profile (Common.Pages.Users.Edit.Profile). Needs no special
// permission - run as researcher. Changes lastName and changes it back to "User" at
// the end so the shared persona is left as it was found.
export function editOwnProfile() {
  const updatedLastName = `Updated-${Date.now()}`

  cy.visitApp('/users/edit/current')
  cy.getField('lastName').clear().type(updatedLastName)
  cy.getCy('form-submit').click()

  // Save re-inits the form from the saved user, so the unsaved-changes bar clears
  // without a reload.
  cy.getCy('form-unsaved').should('have.attr', 'hidden')
  cy.getField('lastName').should('have.value', updatedLastName)

  cy.getField('lastName').clear().type('User')
  cy.getCy('form-submit').click()
  cy.getCy('form-unsaved').should('have.attr', 'hidden')
  cy.getField('lastName').should('have.value', 'User')
}
