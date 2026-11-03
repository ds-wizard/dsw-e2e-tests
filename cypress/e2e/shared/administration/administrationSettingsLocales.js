// Administration / settings / application translations - upload a UI translation PO
// built here and check it's listed disabled, then go through the row's actions
// (enable, set and unset default, disable, download PO, delete). Admin only
// (settings.manage). Nothing involving the registry: fw has no registry import.
//
// While the test translation is the default it applies to every user in the tenant,
// so it's unset right after the check, and cleanup unsets it before deleting.

const localeCode = 'eo'
const namePrefix = 'E2E Esperanto'

// Everything comes from the header: Language is the code, X-Display-Name the name, and
// Project-Id-Version's kind must be a UI one ("<app>-client").
function buildPo(name) {
  return [
    'msgid ""',
    'msgstr ""',
    '"Project-Id-Version: fw-client:dev\\n"',
    `"Language: ${localeCode}\\n"`,
    `"X-Display-Name: ${name}\\n"`,
    '"Content-Type: text/plain; charset=UTF-8\\n"',
    '"Content-Transfer-Encoding: 8bit\\n"',
    '"Plural-Forms: nplurals=2; plural=n == 1 ? 0 : 1;\\n"',
    '',
    'msgid "Log In"',
    'msgstr "Ensaluti"',
    ''
  ].join('\n')
}

function getLocales(token) {
  return cy.request({
    method: 'GET',
    url: `${Cypress.expose('apiUrl')}/locales`,
    headers: { Authorization: `Bearer ${token}` }
  }).then(({ body }) => body)
}

export function cleanupLocales() {
  cy.apiToken().then((token) => {
    getLocales(token).then((locales) => {
      locales
        .filter((locale) => locale.code === localeCode && locale.name.startsWith(namePrefix))
        .forEach((locale) => {
          cy.request({
            method: 'PUT',
            url: `${Cypress.expose('apiUrl')}/locales/${locale.uuid}`,
            headers: { Authorization: `Bearer ${token}` },
            body: { enabled: false, defaultLocale: false },
            failOnStatusCode: false
          })
          cy.request({
            method: 'DELETE',
            url: `${Cypress.expose('apiUrl')}/locales/${locale.uuid}`,
            headers: { Authorization: `Bearer ${token}` },
            failOnStatusCode: false
          })
        })
    })
  })
}

function findLocale(name) {
  return cy.apiToken().then((token) => {
    return getLocales(token).then((locales) => {
      const locale = locales.find((candidate) => candidate.name === name)
      expect(locale, `translation "${name}"`).to.exist
      return locale
    })
  })
}

// The upload asks for confirmation only when there's something to warn about - here,
// a release build of the client (the PO says "dev"). Otherwise it stores straight away.
function uploadThroughUi(name) {
  cy.visitApp('/settings/application-translations')
  cy.getCy('locales-upload').click()
  cy.url().should('match', /\/settings\/application-translations\/upload$/)

  cy.getCy('locale-upload-dropzone').find('[data-cy="file-upload_dropzone"]').selectFile({
    contents: Cypress.Buffer.from(buildPo(name)),
    fileName: 'e2e.po',
    mimeType: 'text/x-gettext-translation'
  }, { action: 'drag-drop' })
  cy.getCy('form-submit').click()

  cy.get('[data-cy="locale-upload-done"], [data-cy="locale-upload-confirm"]').then(($el) => {
    if ($el.attr('data-cy') === 'locale-upload-confirm') {
      cy.getCy('locale-upload-confirm').click()
    }
  })
  cy.getCy('locale-upload-done').click()
  cy.url().should('match', /\/settings\/application-translations$/)
}

export function uploadLocale() {
  const name = `${namePrefix} ${Date.now()}`
  uploadThroughUi(name)

  cy.apiToken().then((token) => {
    getLocales(token).then((locales) => {
      const locale = locales.find((candidate) => candidate.name === name)
      expect(locale, 'the uploaded translation is found by its own name').to.exist
      expect(locale.code).to.equal(localeCode)
      expect(locale.enabled, 'a new translation starts disabled').to.equal(false)

      cy.getCy(`locales_row_${locale.uuid}`)
        .should('contain.text', name)
        .and('contain.text', 'Disabled')
    })
  })
}

// An enabled UI translation for other specs to choose (admin must be logged in).
export function createEnabledLocale() {
  const name = `${namePrefix} ${Date.now()}`
  uploadThroughUi(name)

  return findLocale(name).then((locale) => {
    return cy.apiToken().then((token) => {
      return cy.request({
        method: 'PUT',
        url: `${Cypress.expose('apiUrl')}/locales/${locale.uuid}`,
        headers: { Authorization: `Bearer ${token}` },
        body: { enabled: true, defaultLocale: false }
      }).then(() => locale)
    })
  })
}

export function manageLocaleRow() {
  const name = `${namePrefix} ${Date.now()}`
  uploadThroughUi(name)

  findLocale(name).then((locale) => {
    const row = () => cy.getCy(`locales_row_${locale.uuid}`)
    const expectState = (enabled, defaultLocale) => {
      findLocale(name).then((current) => {
        expect(current.enabled, 'enabled').to.equal(enabled)
        expect(current.defaultLocale, 'default').to.equal(defaultLocale)
      })
    }

    row().find('[data-cy="locales_enable"]').click()
    row().find('[data-cy="locales_disable"]').should('exist')
    expectState(true, false)

    row().find('[data-cy="locales_set-default"]').click()
    row().find('[data-cy="locales_unset-default"]').should('exist')
    expectState(true, true)

    row().find('[data-cy="locales_unset-default"]').click()
    row().find('[data-cy="locales_set-default"]').should('exist')
    expectState(true, false)

    row().find('[data-cy="locales_disable"]').click()
    row().find('[data-cy="locales_enable"]').should('exist')
    expectState(false, false)

    cy.intercept('GET', `**/locales/${locale.uuid}/po`).as('downloadPo')
    row().find('[data-cy="locales_download-po"]').click()
    cy.wait('@downloadPo').its('response.body.url').then((url) => {
      cy.request(url).its('body').should('include', 'msgstr "Ensaluti"')
    })

    row().find('[data-cy="locales_delete"]').click()
    cy.getCy('locale-delete_confirm').click()
    row().should('not.exist')
    cy.apiToken().then((token) => {
      getLocales(token).then((locales) => {
        expect(locales.map((candidate) => candidate.name), 'translations left').not.to.include(name)
      })
    })
  })
}
