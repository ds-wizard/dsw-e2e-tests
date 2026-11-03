// Helpers shared by the questionnaire-feature modules (version history, comments,
// TODOs, search, view settings) - project setup/teardown, project-level API reads,
// and opening a Ui.Menu or a toolbar panel without toggling it shut again.

export const BASIC_KM_QUESTION_PATH = 'fa34a580-6485-4b0d-8167-927c921c461b.2a98fa12-a2dd-4f7b-9546-c0065bbbfa95'

export function createProject(projectName, kmName, packageUuid) {
  cy.visitApp('/projects/create')
  cy.getField('name').type(projectName)
  cy.getField('knowledgeModelPackageUuid').click()
  cy.focused().type(kmName)
  cy.getCy(`form-knowledgeModelPackageUuid_option_${packageUuid}`).click()
  cy.getCy('form-submit').click()

  return cy.url()
    .should('match', /\/projects\/[0-9a-f-]{36}/).waitForPageFocus()
    .then((url) => url.match(/\/projects\/([0-9a-f-]{36})/)[1])
}

// The KM package is imported with the admin token, so the caller can be logged in
// as anyone with projects.create. Resolves to the project's uuid.
export function createBasicKmProject(projectName) {
  cy.fixture('shared/basic-km.json').then((fixture) => cy.cleanupKnowledgeModelPackage(fixture.id))
  return cy.importKM('shared/basic-km.json').then((kmPackage) => createProject(projectName, 'Basic KM', kmPackage.uuid))
}

export function deleteProject(projectUuid) {
  if (!projectUuid) {
    return
  }
  cy.apiToken().then((token) => {
    cy.request({
      method: 'DELETE',
      url: `${Cypress.expose('apiUrl')}/projects/${projectUuid}`,
      headers: { Authorization: `Bearer ${token}` }
    })
  })
}

// GET on a project's own endpoint as the given persona (path starts with "/").
export function projectApiGet(role, projectUuid, path) {
  return cy.apiToken(role).then((token) => {
    return cy.request({
      method: 'GET',
      url: `${Cypress.expose('apiUrl')}/projects/${projectUuid}${path}`,
      headers: { Authorization: `Bearer ${token}` }
    }).then(({ body }) => body)
  })
}

// Re-runs request() until predicate(body) holds - for state that arrives over the
// websocket, where nothing on the page says the server has stored it yet.
export function pollUntil(request, predicate, description, attemptsLeft = 20) {
  return request().then((body) => {
    if (predicate(body)) {
      return body
    }
    if (attemptsLeft <= 1) {
      throw new Error(`pollUntil: gave up waiting for ${description}`)
    }
    cy.wait(500)
    return pollUntil(request, predicate, description, attemptsLeft - 1)
  })
}

export function getUserUuid(role) {
  return cy.env(['users']).then(({ users }) => {
    const email = users[role].email
    return cy.apiToken().then((token) => {
      return cy.request({
        method: 'GET',
        url: `${Cypress.expose('apiUrl')}/users?q=${encodeURIComponent(email)}`,
        headers: { Authorization: `Bearer ${token}` }
      }).then(({ body }) => {
        const user = body._embedded.users.find((candidate) => candidate.email === email)
        expect(user, `the ${role} persona is found by its own email`).to.exist
        return user.uuid
      })
    })
  })
}

// Ui.Menu's trigger toggles, and its items only exist while it is open - click only
// when aria-expanded says it is closed, so an already-open menu isn't toggled shut.
export function openMenu(getTrigger, itemTestId) {
  getTrigger().should('be.visible').then(($trigger) => {
    if ($trigger.attr('aria-expanded') !== 'true') {
      cy.wrap($trigger).click()
    }
  })
  return cy.getCy(itemTestId).should('be.visible')
}

// Toolbar panel buttons toggle too, and the open panel is restored from local
// storage on load - same idea, keyed off aria-pressed.
export function openToolbarPanel(testId) {
  cy.getCy(testId).should('be.visible').then(($button) => {
    if ($button.attr('aria-pressed') !== 'true') {
      cy.wrap($button).click()
    }
  })
  cy.getCy(testId).should('have.attr', 'aria-pressed', 'true')
  return cy.get('#questionnaire-aside').should('be.visible')
}

// One question's own block - its actions, extras and answers - by its path.
export function question(path) {
  return cy.get(`.c-questionnaire-question[data-path="${path}"]`)
}
