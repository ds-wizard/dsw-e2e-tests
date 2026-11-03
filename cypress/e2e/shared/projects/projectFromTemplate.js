// Projects / create from a project template - marks an answered project as a
// template, starts a new project from it, and checks the new one has the template's
// knowledge model and answers. Marking a template needs projects.manageTemplates.
import { waitForSave } from '../km-editor/editor/kmEditorAddEntities'
import { BASIC_KM_QUESTION_PATH, createProjectFromKm, deleteProject } from './projectTabsHelpers'

function markAsTemplate(projectUuid) {
  cy.visitApp(`/projects/${projectUuid}/settings`)
  cy.getField('isTemplate').click()
  cy.getPageFormTestId('form-submit').click()
  cy.getCy('form-unsaved').should('have.attr', 'hidden')
}

// Kept outside the test body so the spec's afterEach can delete them even when the
// test fails part-way: a leftover template switches every later create page into
// its two-tab mode.
let templateUuid
let projectUuid

export function createProjectFromTemplate() {
  const templateName = `Test Project Template ${Date.now()}`
  const projectName = `Test From Template Project ${Date.now()}`
  const answer = `Template answer ${Date.now()}`

  cy.fixture('shared/basic-km.json').then((fixture) => cy.cleanupKnowledgeModelPackage(fixture.id))

  cy.importKM('shared/basic-km.json').then((kmPackage) => {
    createProjectFromKm(kmPackage.uuid, 'Basic KM', templateName).then((uuid) => {
      templateUuid = uuid

      cy.getQuestionnaireField(BASIC_KM_QUESTION_PATH).type(answer).blur()
      waitForSave()
      markAsTemplate(templateUuid)

      cy.visitApp('/projects/create')
      cy.getField('name').type(projectName)
      // Only rendered when custom projects can be created too; from-template is the
      // default tab either way.
      cy.get('body').then(($body) => {
        if ($body.find('[data-cy="project-create-starting-point_template"]').length > 0) {
          cy.getCy('project-create-starting-point_template').click()
        }
      })
      cy.getField('projectUuid').click()
      cy.focused().type(templateName)
      cy.getCy(`form-projectUuid_option_${templateUuid}`).click()
      cy.get('#c-create-form').within(() => cy.getCy('form-submit').click())

      cy.url()
        .should('match', /\/projects\/[0-9a-f-]{36}/).waitForPageFocus()
        .then((url) => {
          projectUuid = url.match(/\/projects\/([0-9a-f-]{36})/)[1]
          expect(projectUuid, 'a new project, not the template itself').not.to.eq(templateUuid)

          cy.getQuestionnaireField(BASIC_KM_QUESTION_PATH).should('have.value', answer)

          cy.apiToken().then((token) => {
            cy.request({
              method: 'GET',
              url: `${Cypress.expose('apiUrl')}/projects/${projectUuid}/questionnaire`,
              headers: { Authorization: `Bearer ${token}` }
            }).then(({ body }) => {
              expect(body.knowledgeModelPackage.uuid).to.eq(kmPackage.uuid)
            })
          })
        })
    })
  })
}

export function cleanUpProjectFromTemplate() {
  deleteProject(projectUuid)
  deleteProject(templateUuid)
  projectUuid = undefined
  templateUuid = undefined
}
