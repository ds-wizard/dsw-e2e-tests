// Projects / version history - naming, renaming, viewing, deleting a named version,
// and reverting the project to an earlier change. The project owner does all of it
// (naming and reverting are owner-only).
//
// The history collapses one person's changes of a question within a day to the newest
// one, unless an older one is a named version - so the first answer is named while it
// is still the newest change, and the version is only deleted after the revert has made
// that change the newest again.
import { waitForSave } from '../km-editor/editor/kmEditorAddEntities'
import {
  BASIC_KM_QUESTION_PATH,
  createBasicKmProject,
  deleteProject,
  openMenu,
  openToolbarPanel,
  projectApiGet
} from './projectQuestionnaireHelpers'

function openEventMenu(eventUuid, action) {
  return openMenu(() => cy.getCy(`history-${eventUuid}_menu`), `history-${eventUuid}_${action}`)
}

function getVersions(projectUuid) {
  return projectApiGet('researcher', projectUuid, '/versions')
}

export function manageVersions() {
  const ts = Date.now()
  const firstAnswer = `First answer ${ts}`
  const secondAnswer = `Second answer ${ts}`
  const versionName = `First draft ${ts}`
  const renamedVersionName = `Final draft ${ts}`
  const versionDescription = `Described ${ts}`

  createBasicKmProject(`Test Version History Project ${ts}`).then((projectUuid) => {
    cy.getQuestionnaireField(BASIC_KM_QUESTION_PATH).type(firstAnswer).blur()
    waitForSave()

    projectApiGet('researcher', projectUuid, '/events?size=1000&sort=createdAt,desc&page=0').then((body) => {
      const firstEvent = body._embedded.projectEvents.find((event) => {
        return event.type === 'SetReplyEvent' && event.path === BASIC_KM_QUESTION_PATH && event.value.value === firstAnswer
      })
      expect(firstEvent, 'the first answer is its own change').to.exist
      const eventUuid = firstEvent.uuid

      openToolbarPanel('questionnaire-version-history')
      cy.getCy(`history-event-${eventUuid}`).should('be.visible')

      // Name
      openEventMenu(eventUuid, 'name').click()
      cy.getCy('project-version').should('have.attr', 'open')
      cy.getCy('project-version').within(() => {
        cy.get('#project-version-name').type(versionName)
        cy.get('#project-version-description').type(versionDescription)
        cy.getCy('form-submit').click()
      })
      cy.getCy('project-version').should('not.have.attr', 'open')
      cy.getCy(`history-event-${eventUuid}`).should('contain.text', versionName)
      getVersions(projectUuid).then((versions) => {
        expect(versions).to.have.length(1)
        expect(versions[0]).to.include({ name: versionName, description: versionDescription, eventUuid })
      })

      // A newer change, so the named one can be viewed and reverted to
      cy.getQuestionnaireField(BASIC_KM_QUESTION_PATH).clear().type(secondAnswer).blur()
      waitForSave()
      cy.getCy(`history-event-${eventUuid}`).should('be.visible')

      // Rename
      openEventMenu(eventUuid, 'rename').click()
      cy.getCy('project-version').within(() => {
        cy.get('#project-version-name').should('have.value', versionName).clear().type(renamedVersionName)
        cy.getCy('form-submit').click()
      })
      cy.getCy('project-version').should('not.have.attr', 'open')
      cy.getCy(`history-event-${eventUuid}`)
        .should('contain.text', renamedVersionName)
        .and('not.contain.text', versionName)
      getVersions(projectUuid).then((versions) => {
        expect(versions).to.have.length(1)
        expect(versions[0].name).to.equal(renamedVersionName)
      })

      // View - the questionnaire as it was, read-only, in a dialog over the live one
      openEventMenu(eventUuid, 'view').click()
      cy.getCy('project-version-view').should('have.attr', 'open')
      cy.getCy('project-version-view').should('contain.text', renamedVersionName)
      cy.getCy('project-version-view')
        .find(`#value_${BASIC_KM_QUESTION_PATH.replace(/[^a-zA-Z0-9_-]/g, '_')}`)
        .should('have.value', firstAnswer)
        .and('be.disabled')
      cy.getCy('project-version-view_close').click()
      cy.getCy('project-version-view').should('not.have.attr', 'open')

      // Revert - the page reloads itself once the server has rewound the project
      openEventMenu(eventUuid, 'revert').click()
      cy.getCy('project-revert_confirm').click()
      cy.getQuestionnaireField(BASIC_KM_QUESTION_PATH).should('have.value', firstAnswer)
      projectApiGet('researcher', projectUuid, '/questionnaire').then((questionnaire) => {
        expect(questionnaire.replies[BASIC_KM_QUESTION_PATH].value.value).to.equal(firstAnswer)
      })

      // Delete the version - the change itself stays
      openToolbarPanel('questionnaire-version-history')
      openEventMenu(eventUuid, 'delete').click()
      cy.getCy('version-delete_confirm').click()
      cy.getCy('version-delete').should('not.have.attr', 'open')
      cy.getCy(`history-event-${eventUuid}`)
        .should('exist')
        .and('not.contain.text', renamedVersionName)
      getVersions(projectUuid).then((versions) => {
        expect(versions).to.have.length(0)
      })

      deleteProject(projectUuid)
    })
  })
}
