// Knowledge Models / locales - import a .po translation of basic-km.json on the
// package's Locales tab (Data Steward, knowledgeModels.manage), then answer a project
// in that language (Researcher): its chapter and question titles come out translated.
//
// fixtures/km-locales/basic-km-cs.po translates the two texts basic-km.json has - the
// chapter title and the value question's title (BASIC_KM_QUESTION_PATH).
import { BASIC_KM_QUESTION_PATH, createProjectFromKm, deleteProject } from '../projects/projectTabsHelpers'

const LOCALE_NAME = 'Czech'
const LOCALE_CODE = 'cs'
const [CHAPTER_UUID] = BASIC_KM_QUESTION_PATH.split('.')

export function importLocaleAndUseItInProject() {
  cy.fixture('shared/basic-km.json').then((fixture) => cy.cleanupKnowledgeModelPackage(fixture.id))

  cy.importKM('shared/basic-km.json').then((kmPackage) => {
    cy.intercept('POST', `**/knowledge-model-packages/${kmPackage.uuid}/locales*`).as('importLocale')

    cy.loginAs('dataSteward')
    cy.visitApp(`/knowledge-models/${kmPackage.uuid}/locales`)
    cy.getCy('km-detail_import-locale').click()
    cy.getCy('km-import-locale').within(() => {
      cy.getField('name').type(LOCALE_NAME)
      cy.getCy('file-upload_dropzone').selectFile('cypress/fixtures/km-locales/basic-km-cs.po', { action: 'drag-drop' })
      cy.getCy('form-submit').click()
    })

    cy.wait('@importLocale').its('response.body.uuid').then((localeUuid) => {
      cy.getCy(`km-locales_row_${localeUuid}`).should('contain.text', LOCALE_NAME).and('contain.text', LOCALE_CODE)
    })

    cy.logout()
    cy.loginAs('researcher')
    createProjectFromKm(kmPackage.uuid, 'Basic KM', `Test Locale Project ${Date.now()}`).then((projectUuid) => {
      cy.visitApp(`/projects/${projectUuid}/settings`)
      cy.getField('language').select(LOCALE_CODE)
      cy.getPageFormTestId('form-submit').click()
      // The save isn't blocking navigation, wait for it to land first.
      cy.getCy('form-unsaved').should('have.attr', 'hidden')

      cy.visitApp(`/projects/${projectUuid}`)
      cy.getCy(`questionnaire_chapter-nav_${CHAPTER_UUID}`).should('contain.text', 'Kapitola 1')
      cy.getCy('questionnaire_question-title').should('contain.text', 'Název projektu')

      deleteProject(projectUuid)
    })
  })
}
