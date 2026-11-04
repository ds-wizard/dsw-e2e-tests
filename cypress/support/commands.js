// Custom commands shared by every spec (loaded via support/e2e.js).

// DSW has exactly one workspace per tenant - it never shows up in the client's URLs or
// the API's query strings, only in the database (cleanup tasks scope by it).
Cypress.Commands.add('getWorkspaceUuid', () => {
  return cy.task('workspace:defaultUuid', { tenantId: Cypress.expose('tenantId') })
})

// Selects by data-cy only, never cy.contains(visibleText).
Cypress.Commands.add('getCy', (testId, options) => {
  return cy.get(`[data-cy="${testId}"]`, options)
})

// After an in-app navigation the app keeps retrying to focus the new page's heading
// until it renders, which can steal focus from a field a test has already started
// typing into. Passes the previous subject through.
Cypress.Commands.add('waitForPageFocus', { prevSubject: 'optional' }, (subject) => {
  return cy.get('#ui-main-heading').should('have.focus').then(() => subject)
})

// A page's own "form-submit"/"form-cancel", never a dialog's. Ui.Modal.toHtml's root
// "ui-dialog" is always in the DOM regardless of open/closed state, and
// Ui.Modal.withForm defaults its own submit/cancel button to the same testid
// (Ui.Button.submit/dangerSubmit, Ui.Form.unsavedBar's Save) unless the caller
// overrides it - so a page that has its own real form-submit AND, elsewhere in the
// same component tree, an always-mounted Modal.withForm dialog (e.g. Projects.Detail's
// ShareModal, present on every tab) ends up with two matches. Only for a call site
// confirmed ambiguous this way - a page whose only "form-submit" happens to be inside
// an open modal should keep using plain getCy/within, since filtering ui-dialog out
// there would remove the one real match.
Cypress.Commands.add('getPageFormTestId', (testId) => {
  return cy.get(`[data-cy="${testId}"]`).filter((_, el) => !el.closest('ui-dialog'))
})

// A form field's DOM id is "form-" plus its path, sanitized (anything that isn't a
// letter/digit/"-"/"_" becomes "-", runs collapsed) - e.g. "name" -> "#form-name".
Cypress.Commands.add('getField', (path) => {
  const sanitized = path
    .split('')
    .map((char) => (/[a-zA-Z0-9_]/.test(char) || char === '-' ? char : '-'))
    .join('')
    .split('-')
    .filter(Boolean)
    .join('-')
  return cy.get(`#form-${sanitized}`)
})

// A questionnaire answer field uses a different id scheme from getField: "value_" plus
// the question path, non-alphanumerics replaced with "_" (no run-collapsing).
Cypress.Commands.add('getQuestionnaireField', (questionPath) => {
  const sanitized = questionPath
    .split('')
    .map((char) => (/[a-zA-Z0-9_-]/.test(char) ? char : '_'))
    .join('')
  return cy.get(`#value_${sanitized}`)
})

// The search applies 500 ms after typing, then re-renders every row - wait for it, so
// a row found next is the filtered listing's, not one about to be replaced.
Cypress.Commands.add('searchListing', (term) => {
  cy.get('#listing-search').type(term)
  return cy.location('search').should((search) => {
    expect(new URLSearchParams(search).get('q')).to.equal(term)
  })
})

// A listing row's kebab menu items aren't in the DOM until the menu is opened, so open
// it first before targeting one of its actions. Pass the action's own testId to make
// this self-healing: some listings (e.g. KM editors) close any open menu as soon as
// they reload (right after an update/cancel-migration request lands), which can race
// an already-open menu shut before the next command runs - retried here instead of
// leaving the test to time out against a menu that's already gone.
//
// force: true on the trigger click - confirmed manually in a real browser that an
// Outdated row's kebab (the only state with a second interactive element, the "update
// available" badge, on the same row) opens and stays open fine, but under Cypress it
// opens then immediately closes. That's consistent with Cypress's own actionability
// check re-verifying the trigger isn't detached before clicking, and retrying with a
// second real click if that row re-renders at the wrong moment - the second click
// landing as a toggle-close right after the first one opened it. force skips that
// check instead of risking a double click.
// The trigger's own click handler toggles the menu open/closed - clicking on every
// retry attempt regardless of current state is wrong: if an earlier click did open it and this just hasn't re-rendered
// yet, the next retry's click toggles it straight back closed. Checking "is it
// already open" before every click (not just the first) avoids that - a retry
// only ever clicks a menu it just confirmed is still closed.
Cypress.Commands.add('openListingItemActions', (id, actionTestId) => {
  if (!actionTestId) {
    return cy.get(`#listing-item-actions-${id}-trigger`).click({ force: true })
  }

  function attempt(attemptsLeft) {
    cy.get('body').then(($body) => {
      if ($body.find(`[data-cy="${actionTestId}"]`).length > 0) {
        return
      }

      cy.get(`#listing-item-actions-${id}-trigger`).click({ force: true })

      if (attemptsLeft > 1) {
        cy.wait(250)
        cy.get('body').then(($body2) => {
          if ($body2.find(`[data-cy="${actionTestId}"]`).length === 0) {
            attempt(attemptsLeft - 1)
          }
        })
      }
    })
  }

  attempt(15)
  return cy.getCy(actionTestId)
})

// Opens a Listing toolbar's own sort menu ("listing_toolbar_sort" - Common.
// Components.Listing.viewSort). Same Menu component, same flaky-open issue as
// openListingItemActions above - checked the same way, for the same reason.
Cypress.Commands.add('openSortMenu', () => {
  function attempt(attemptsLeft) {
    cy.get('body').then(($body) => {
      if ($body.find('[data-cy^="listing_toolbar_sort_"]').length > 0) {
        return
      }

      cy.getCy('listing_toolbar_sort').click({ force: true })

      if (attemptsLeft > 1) {
        cy.wait(250)
        cy.get('body').then(($body2) => {
          if ($body2.find('[data-cy^="listing_toolbar_sort_"]').length === 0) {
            attempt(attemptsLeft - 1)
          }
        })
      }
    })
  }

  attempt(15)
})

// POST /tokens, shared by loginAs and apiToken. "role" is either a cypress config
// env.users key (a seeded persona) or a plain { email, password } object.
const fetchToken = (role) => {
  const credentials = typeof role === 'string'
    ? cy.env(['users']).then(({ users }) => users[role])
    : cy.wrap(role)
  return credentials.then(({ email, password }) => {
    return cy.request({
      method: 'POST',
      url: `${Cypress.expose('apiUrl')}/tokens`,
      body: { email, password }
    })
  }).then(({ body }) => {
    if (body.type !== 'UserToken') {
      throw new Error(`Logging in as "${JSON.stringify(role)}" got "${body.type}", not a token (2FA/consent/activation pending?)`)
    }
    return body
  })
}

// A bearer token for direct cy.request() calls, as opposed to loginAs below.
Cypress.Commands.add('apiToken', (role = 'admin') => {
  return fetchToken(role).then((token) => token.token)
})

// Pushes one raw websocket frame as if it came from another client, to prove a real,
// already-open browser session reacts live - no second browser needed. Auth has to be
// a query param, not a header: the browser WebSocket API can't set one on the upgrade
// request. path must start with "/"; msg is the plain object to JSON-encode as the
// frame sent.
Cypress.Commands.add('wsSendAs', (role, path, msg) => {
  return cy.apiToken(role).then((token) => {
    const wsUrl = `${Cypress.expose('apiUrl').replace(/^http/, 'ws')}${path}?Authorization=${encodeURIComponent(`Bearer ${token}`)}`
    return new Cypress.Promise((resolve, reject) => {
      const ws = new WebSocket(wsUrl)
      ws.addEventListener('open', () => {
        ws.send(JSON.stringify(msg))
        ws.close()
        resolve()
      })
      ws.addEventListener('error', () => reject(new Error(`wsSendAs: WebSocket error connecting to ${path}`)))
    })
  })
})

// Logs in via the API and injects the session directly into localStorage, bypassing
// the login form. Must run before any cy.visit - the app only reads this key at boot.
Cypress.Commands.add('loginAs', (role) => {
  return fetchToken(role).then((token) => {
    window.localStorage.setItem('session', JSON.stringify({
      token: { token: token.token, expiresAt: token.expiresAt },
      sidebarCollapsed: false,
      rightPanelCollapsed: true,
      fullscreen: false,
      apiUrl: Cypress.expose('apiUrl')
    }))
  })
})

// loginAs's counterpart: drops the browser session for specs that need a logged-out
// browser as setup. For testing logout itself, see changePassword.js, which drives the
// real menu instead. Like loginAs, must run before the next cy.visit.
Cypress.Commands.add('logout', () => {
  window.localStorage.removeItem('session')
})

// Creates a plain user with a known password through POST /users (an admin-created
// user is active immediately, no email-confirmation gate), with the tenant's default
// role. Resolves to { uuid, email, password, firstName, lastName } - pass straight to
// cy.loginAs(user).
Cypress.Commands.add('createUser', ({ email, password, firstName = 'E2E', lastName = 'Test User' }) => {
  return cy.apiToken().then((token) => {
    return cy.request({
      method: 'GET',
      url: `${Cypress.expose('apiUrl')}/settings/roles`,
      headers: { Authorization: `Bearer ${token}` }
    }).then(({ body: settings }) => {
      return cy.request({
        method: 'POST',
        url: `${Cypress.expose('apiUrl')}/users`,
        headers: { Authorization: `Bearer ${token}` },
        body: {
          email,
          firstName,
          lastName,
          affiliation: null,
          roleUuid: settings.value.defaultRoleUuid,
          password
        }
      }).then(({ body: user }) => ({ uuid: user.uuid, email, password, firstName, lastName }))
    })
  })
})

// Visits a page of the client - path must start with "/".
Cypress.Commands.add('visitApp', (path) => {
  cy.visit(`${Cypress.expose('clientUrl')}${path}`)
})

// Sets the permissions of the "Permission Probe" role (dsw/scripts/create-users.js)
// through PUT /roles/:uuid, which fully replaces the permission list rather than
// merging it - pass a one-element array to isolate a single permission's effect, or []
// to go back to none.
Cypress.Commands.add('setPermissionProbePermissions', (permissions) => {
  return cy.apiToken().then((token) => {
    return cy.request({
      method: 'GET',
      url: `${Cypress.expose('apiUrl')}/roles?q=${encodeURIComponent('Permission Probe')}`,
      headers: { Authorization: `Bearer ${token}` }
    }).then(({ body }) => {
      const role = body._embedded.roles.find((role) => role.name === 'Permission Probe')
      if (!role) {
        throw new Error('setPermissionProbePermissions: "Permission Probe" role not found - did create-users.js provision it?')
      }
      return cy.request({
        method: 'PUT',
        url: `${Cypress.expose('apiUrl')}/roles/${role.uuid}`,
        headers: { Authorization: `Bearer ${token}` },
        body: { name: role.name, permissions }
      })
    })
  })
})

// Imports a KM bundle fixture as a prerequisite for specs that need an existing
// knowledge model. Resolves to the created package's data (has .uuid).
Cypress.Commands.add('importKM', (fixturePath) => {
  return cy.fixture(fixturePath).then((body) => {
    return cy.apiToken().then((token) => {
      return cy.request({
        method: 'POST',
        url: `${Cypress.expose('apiUrl')}/knowledge-model-packages`,
        headers: { Authorization: `Bearer ${token}` },
        body
      }).then((response) => response.body)
    })
  })
})

// Deletes a KM package by its own fixed id (DB-level). For specs that import a
// fixed-id fixture, call this in beforeEach to avoid colliding with a previous run.
Cypress.Commands.add('cleanupKnowledgeModelPackage', (id) => {
  return cy.task('knowledgeModelPackage:delete', { tenantId: Cypress.expose('tenantId'), id })
})

// Wipes every KM package, not just a fixed-id fixture. Call at the start of a Knowledge
// Models listing spec, so a package an earlier failed run left behind can't push that
// spec's own fresh row off the listing's first page.
Cypress.Commands.add('cleanupAllKnowledgeModelPackages', () => {
  return cy.task('knowledgeModelPackage:deleteAll', { tenantId: Cypress.expose('tenantId') })
})

// Wipes every KM editor and every KM package the KM Migration specs themselves create
// (id prefix "km-"), regardless of whether the test that created them passed or
// failed. Call from an after() hook in those specs - a mid-test failure otherwise
// leaves orphaned editors/packages behind, which corrupts later runs.
Cypress.Commands.add('cleanupKmMigrationTestData', () => {
  return cy.task('knowledgeModel:deleteMigrationTestData', { tenantId: Cypress.expose('tenantId') })
})

// Deletes a document template by its own fixed id (DB-level, like
// cleanupKnowledgeModelPackage) - call before (re-)importing a fixed-id fixture.
Cypress.Commands.add('cleanupDocumentTemplate', (id) => {
  return cy.task('documentTemplate:delete', { tenantId: Cypress.expose('tenantId'), id })
})

// Wipes every document template, not just a fixed-id fixture - same reasoning as
// cleanupAllKnowledgeModelPackages above.
Cypress.Commands.add('cleanupAllDocumentTemplates', () => {
  return cy.task('documentTemplate:deleteAll', { tenantId: Cypress.expose('tenantId') })
})

// Imports a document template bundle fixture (templates/<fixturePath>.zip). Document
// templates have no raw-JSON create route, only the multipart bundle upload, which
// cy.request() can't send - so this builds a real FormData/Blob and posts it via a raw
// XMLHttpRequest instead. Resolves to the created template's data (has .uuid).
Cypress.Commands.add('importTemplate', (fixturePath) => {
  return cy.apiToken().then((token) => {
    return cy.fixture(fixturePath, 'binary').then((binary) => {
      const blob = Cypress.Blob.binaryStringToBlob(binary, 'application/zip')

      return new Cypress.Promise((resolve, reject) => {
        const data = new FormData()
        data.set('file', blob, fixturePath.split('/').pop())

        const xhr = new XMLHttpRequest()
        xhr.onload = () => {
          if (xhr.status >= 300) {
            reject(new Error(`importTemplate: upload of "${fixturePath}" failed with status ${xhr.status}: ${xhr.responseText}`))
          } else {
            resolve(JSON.parse(xhr.response))
          }
        }
        xhr.onerror = () => reject(new Error(`importTemplate: upload of "${fixturePath}" failed`))
        xhr.open('POST', `${Cypress.expose('apiUrl')}/document-templates/bundle`)
        xhr.setRequestHeader('Authorization', `Bearer ${token}`)
        xhr.send(data)
      })
    })
  })
})
