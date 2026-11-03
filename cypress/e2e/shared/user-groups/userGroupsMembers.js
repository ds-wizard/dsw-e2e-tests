// User Groups / members - create a group, add Data Steward as a member and confirm
// Data Steward can then see the group themselves, remove them again and confirm they
// can no longer see it, then delete the group (which removes the membership too, not
// the user).
//
// The group is created private: a public one is visible to any workspace-reachable
// user regardless of membership (Shared.Database.DAO.User.UserGroupDAO's own ACL
// condition, "ug.private IS FALSE OR ugm.user_uuid = ... OR <manage permission>"), which
// would make the "can/can't see it" checks below pass trivially either way. Private
// makes membership the only thing that grants Data Steward (who has neither
// userGroups.manage nor is an owner) access to it at all.
//
// The add-member TypeHint's id is raw and unprefixed ("user-group-add-member"), not
// reached via cy.getField() - already documented in cypress/README.md. Removing a
// member goes through the row's own kebab menu (Common.Pages.UserGroups.Detail's
// memberMenuId, "user-group-member-<uuid>", a raw id too) - its "Remove" action has no
// data-cy of its own, so it's matched by its visible text like the confirm modal below
// it, same as the km-editor delete flows.
export function addMemberToUserGroup() {
  const groupName = `Test User Group ${Date.now()}`

  cy.visitApp('/user-groups/create')
  cy.getField('name').type(groupName)
  cy.getField('private').click()
  cy.getCy('form-submit').click()

  cy.url()
    .should('match', /\/user-groups\/[0-9a-f-]{36}$/)
    .then((url) => {
      const userGroupUuid = url.split('/').pop()

      cy.env(['users']).then(({ users }) => {
        cy.apiToken().then((token) => {
          cy.request({
            method: 'GET',
            url: `${Cypress.expose('apiUrl')}/users?q=${encodeURIComponent(users.dataSteward.email)}`,
            headers: { Authorization: `Bearer ${token}` }
          }).then(({ body }) => {
            const dataSteward = body._embedded.users.find((candidate) => candidate.email === users.dataSteward.email)
            expect(dataSteward, 'the Data Steward persona is found by its own email').to.exist

            cy.visitApp(`/user-groups/${userGroupUuid}/members`)
            cy.getCy('user-group-members_add-button').click()
            cy.get('#user-group-add-member').click()
            cy.focused().type('Data Steward')
            cy.getCy(`user-group-add-member_option_${dataSteward.uuid}`).click()
            cy.getCy('user-group-member-add').within(() => cy.getCy('form-submit').click())

            cy.getCy(`user-group-members_item_${dataSteward.uuid}`).should('exist')

            // Data Steward is now a member, so the private group is reachable for them
            // too - both in the listing and on its own members page, not just for
            // Researcher who owns it.
            cy.logout()
            cy.loginAs('dataSteward')
            cy.visitApp('/user-groups')
            cy.getCy(`listing-item_${userGroupUuid}`).should('exist')
            cy.visitApp(`/user-groups/${userGroupUuid}/members`)
            cy.getCy(`user-group-members_item_${dataSteward.uuid}`).should('exist')

            cy.logout()
            cy.loginAs('researcher')
            cy.visitApp(`/user-groups/${userGroupUuid}/members`)
            cy.get(`#user-group-member-${dataSteward.uuid}-trigger`).click()
            cy.get(`#user-group-member-${dataSteward.uuid}-items`).within(() => cy.getCy('listing-item_action_remove').click())
            cy.getCy('user-group-member-remove_confirm').click()
            cy.getCy(`user-group-members_item_${dataSteward.uuid}`).should('not.exist')

            // Removed - no longer a member of this private group, so it's gone from
            // their listing and 403s on direct access, same as it would for any other
            // outsider (Shared.Service.User.Group.UserGroupAcl.checkViewPermission).
            cy.logout()
            cy.loginAs('dataSteward')
            cy.visitApp('/user-groups')
            cy.getCy(`listing-item_${userGroupUuid}`).should('not.exist')
            cy.visitApp(`/user-groups/${userGroupUuid}/members`)
            cy.contains('You do not have permission to view this page.').should('exist')

            cy.request({
              method: 'DELETE',
              url: `${Cypress.expose('apiUrl')}/user-groups/${userGroupUuid}`,
              headers: { Authorization: `Bearer ${token}` }
            })
          })
        })
      })
    })
}
