// Projects / websocket - pushes a raw WebSocket frame via cy.wsSendAs as if from
// another client, instead of driving a second browser. Uses basic-km.json's fixed
// chapter/question uuids (see projectQuestionnaire.js).
//
// Deletes the project it created at the end.
export function pushAnswerOverWebsocket() {
  const projectName = `Test Websocket Project ${Date.now()}`
  const answer = `Pushed via websocket ${Date.now()}`
  const questionPath = 'fa34a580-6485-4b0d-8167-927c921c461b.2a98fa12-a2dd-4f7b-9546-c0065bbbfa95'

  cy.fixture('shared/basic-km.json').then((fixture) => cy.cleanupKnowledgeModelPackage(fixture.id))

  cy.importKM('shared/basic-km.json').then((kmPackage) => {
    cy.visitApp('/projects/create')
    cy.getField('name').type(projectName)
    cy.getField('knowledgeModelPackageUuid').click()
    cy.focused().type('Basic KM')
    cy.getCy(`form-knowledgeModelPackageUuid_option_${kmPackage.uuid}`).click()
    cy.getCy('form-submit').click()

    cy.url()
      .should('match', /\/projects\/[0-9a-f-]{36}/).waitForPageFocus()
      .then((url) => {
        const projectUuid = url.match(/\/projects\/([0-9a-f-]{36})/)[1]

        cy.wsSendAs('researcher', `/projects/${projectUuid}/websocket`, {
          type: 'SetContent_ClientProjectMessage',
          data: {
            type: 'SetReplyEvent',
            uuid: crypto.randomUUID(),
            path: questionPath,
            value: { type: 'StringReply', value: answer }
          }
        })

        cy.getQuestionnaireField(questionPath).should('have.value', answer)

        cy.apiToken().then((token) => {
          cy.request({
            method: 'DELETE',
            url: `${Cypress.expose('apiUrl')}/projects/${projectUuid}`,
            headers: { Authorization: `Bearer ${token}` }
          })
        })
      })
  })
}
