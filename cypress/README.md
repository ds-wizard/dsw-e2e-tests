# Cypress suite

The suite follows the structure of
[fair-wizard-e2e-tests](https://github.com/codevence/fair-wizard-e2e-tests) (its single-workspace
suite - DSW always has exactly one workspace per tenant), so that tests can be shared between the
two repositories with minimal changes.

## Layout

```
cypress/
  e2e/
    shared/     test-core modules (e.g. kmEditorCreate.js) - plain exported functions, never a
                describe()/it() of their own, kept as close as possible to the same files in
                fair-wizard-e2e-tests
    dsw/        the specs (*.cy.js) - each logs in as the right persona and calls the shared
                core functions
  fixtures/
    shared/     knowledge model bundles
    templates/  document templates (*.json, zipped by `make templates`, see below)
  support/
    e2e.js      support entry
    commands.js custom commands used by every spec
  plugin/
    database.js Postgres task helpers (cleanups and generic query/get/update/delete)
  timings/      spec durations for balancing the CI shards (see below)
```

Only files with `.cy.` in their name are specs (`specPattern` in `cypress.config.js`), so the
shared modules are never run on their own.

## Personas

Every spec logs in as the least capable persona that can do what it tests, not as admin (admin is
for provisioning - imports, cleanups). See the [README](../README.md#users) for the personas and
`dsw/scripts/create-users.js` for their permissions:

- **Data Steward** - knowledge models, KM editors, document templates and their editors,
  Documents list (`projects.edit`)
- **Researcher** - projects and user groups
- **Permission Probe** - starts with no permissions at all, `cy.setPermissionProbePermissions(...)`
  grants/revokes them through the real `PUT /roles/:uuid` API to check what a single permission
  gates (navigation entries, page actions)

`cy.loginAs(persona)` logs in through the API and stores the session in local storage, it has to
run before `cy.visitApp(...)`.

## Selectors

Every spec selects by `id` or `data-cy`, never `cy.contains(visibleText)` (except for values
filled by the test itself) - `cy.getCy(testId)` wraps `[data-cy="..."]`. The naming comes from the
frontend (`engine-frontend`, `packages/elm-ui` and `packages/elm-common`):

- A form field's `id` is `"form-"` plus its path (anything that isn't a letter, digit, `-` or `_`
  becomes `-`) - use `cy.getField(path)`, e.g. `cy.getField('name')` for `#form-name`.
- A form's submit button is `data-cy="form-submit"`, its cancel button `form-cancel`, and the
  unsaved-changes bar's buttons `form-submit`/`form-discard`. They are not unique when a modal
  with a form is open over a page with its own form, so scope them with `.within()` or use
  `cy.getPageFormTestId(...)`.
- A listing row is `data-cy="listing-item_<uuid>"`, its actions menu is opened with
  `cy.openListingItemActions(uuid, actionTestId)` and the actions are
  `listing-item_action_<action>`. The search box is `#listing-search`, the sort menu
  `listing_toolbar_sort` (`cy.openSortMenu()`), its options `listing_toolbar_sort_<key>`.
- A type hint option is `data-cy="<fieldId>_option_<key>"`.
- A navigation entry is `data-cy="menu_<id>"`.
- A questionnaire answer field is `"value_"` plus the question path - use
  `cy.getQuestionnaireField(path)`.
- A file upload has no `<input type="file">`, drop the file on it instead:
  `cy.getCy('file-upload_dropzone').selectFile(file, { action: 'drag-drop' })`.
- A dialog's own buttons derive from its test id: `<testId>_confirm`/`<testId>_cancel` on a
  confirm dialog, `<testId>_close` on a plain one. A form dialog's buttons stay
  `form-submit`/`form-cancel`.
- State hooks, for waiting without reading words: `form-unsaved` (the unsaved-changes bar,
  `hidden` once saved) and `saving-indicator` (`data-state` `saving`/`saved`/`all-saved`).
- Radio/checkbox group options are `<groupId>_<value>`; list fields have `<listFieldId>_add`/
  `<listFieldId>_remove_<index>`; a page's main heading is `#ui-main-heading` (after an in-app
  navigation, `cy.waitForPageFocus()` before typing, the app moves the focus there).
- A project's version history entry is `history-event-<eventUuid>`, its menu trigger
  `history-<eventUuid>_menu` and its items `history-<eventUuid>_<action>`.

If a spec needs something not covered above, check `docs/ui/guide.md` (the full list of hooks)
and the relevant `Ui.*`/`Common.Components.*` source in `engine-frontend`. A missing hook is
better added upstream than worked around here.

## Websockets

Real-time collaboration is tested without a second browser: `cy.wsSendAs(persona, path, msg)` opens
a native `WebSocket` to the server, sends one frame as if it came from another client and closes,
then the spec asserts the browser session reacted.

## Templates packaging

A document template is only importable as a `.zip` bundle, so only the `.json` is committed and
`make templates` (also run by `make init`) zips every `cypress/fixtures/templates/*.json` into a
gitignored sibling `.zip`. `cy.importTemplate('templates/<name>.zip')` imports one through the API.

## Config: env vs expose

`cypress.config.js` sets `allowCypressEnv: false`:

- **`expose`** - plain configuration (`tenantId`, `clientUrl`, `apiUrl`), read with
  `Cypress.expose('key')`.
- **`env`** - `users` (passwords) and `db` (node-side only). From spec/support code, `users` is read
  with `cy.env(['users']).then(({ users }) => ...)`.

## Running in CI

`.github/workflows/main.yml` runs the suite in 4 independent shards (a matrix of jobs, each with its
own stack), split by [cypress-split](https://github.com/bahmutov/cypress-split) through the
`SPLIT`/`SPLIT_INDEX` env vars - a no-op locally. Each shard uploads the durations of the specs it
ran and the `merge-timings` job combines them into a `merged-timings` artifact. Commit it as
`cypress/timings/timings.json` to balance the shards by duration instead of by spec count.

## Known gaps

Not covered, and why:

- **Needs something this stack doesn't have**: Registry (settings, importing from it), plugins
  and plugin settings, submitting a document, connected accounts, logging in through OpenID
  (only its config is tested).
- **Off in this stack**: tours (disabled by `dsw/scripts/patch-db.sql`) and Tenants (needs
  multi-tenancy and the `tenants.manage` permission, which only the system user has).
- **Not attempted**: Look and feel's color and logo (custom picker widgets).

