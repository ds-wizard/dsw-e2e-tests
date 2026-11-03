// Projects / questionnaire question types - every one, plus every value type a plain
// Value question can take. One function per type, each with its own small,
// independent KM (questionTypeKms.js) rather than all of them sharing one bigger one.
//
// Date/DateTime/Time value questions are the same <ui-date-picker> (flatpickr,
// allowInput) as cypress/e2e/shared/account/apiKeys.js's own date field - typing alone
// leaves it uncommitted, blur is its own commit trigger, and {enter} would too but
// also submits the questionnaire's own <form>. DateTime's visible input is a second,
// alt-format one flatpickr swaps in (date-picker.js's own altInput) - it still carries
// the same id (Path.toFieldId again), so cy.getQuestionnaireField still finds it.
//
// Text is a markdown editor, same custom element as the KM editor's own markdown
// fields - switched out of "rich" mode via the same "markdown-editor_mode-markdown"
// button before typing. Color is a native <input type="color">, which Cypress can't .type()
// into reliably (it's backed by the OS's own color picker) - set via
// .invoke('val', ...).trigger('input') instead, matching its onInput listener.
//
// Options/MultiChoice answers are native radio/checkbox inputs, not form fields -
// Common.Components.Questionnaire.Question.viewAnswer/viewChoice id them
// "value_<path>_<answerOrChoiceUuid>" (Path.toFieldId's own scheme, same prefix
// cy.getQuestionnaireField already uses, just with the option's own uuid appended), so
// there's no dedicated data-cy to reach for - only an id, picked directly off the
// uuids questionTypeKms.js's build already captured. Options' own follow-up question
// is itself a plain Value question, answered the ordinary way once it's visible.
//
// A list question's own item is different: "item-add" is the one, unscoped testId for
// every list question's Add button (safe here - this KM has exactly one), but the new
// item's own uuid is generated client-side and impossible to predict, so it's read back
// from GET /projects/:uuid/questionnaire's "replies" dict (an ItemListReply's value is
// the array of item uuids) rather than guessed - after waitForSave, since that read has
// to be strictly after the add actually landed server-side, not just reflected locally.
// ItemSelect's own options come from a similar server-computed "extra" alongside the
// reply, not something the client updates live from the add above, so it gets its own
// reload before the new item shows up in that question's own <select> at all.
//
// File's upload button and its own modal share the literal testId "file-upload" (one
// on the trigger, one on Modal.withTestId's own "ui-dialog" element) - the dialog is
// always mounted (Ui.Modal.toHtml's open/closed state doesn't add/remove it), so
// cy.getCy('file-upload') matches both and has to be scoped to the trigger's own tag
// to click it. Once open, every interaction inside is scoped to the dialog's own tag
// too (not just its data-cy, same reason): this page mounts several modals at once
// (share, clone, delete, this one, ...), and every Modal.withForm's submit button
// defaults to the same "form-submit" testId unless overridden, so an unscoped
// cy.getCy('form-submit') matches all of them, not just this one.
//
// Integration answers against a real mock API (dsw/mockserver, see
// questionTypeKms.js's own header comment) - typing a real search term debounces into
// a POST /type-hints call (Content.elm's own 1s debounce, separate from the save one
// below) and renders real suggestions as "questionnaire_type-hint_<index>". Selecting
// one (rather than typing a plain/custom reply) switches the field from the editable
// "#value_<path>" input to a read-only "questionnaire_read-only-text" - a different
// element, checked separately.
//
// Answers go over the websocket with the same debounce the KM editor's fields have -
// the "saving-indicator" is shared by both pages - so waitForSave from
// kmEditorAddEntities.js is reused as-is before every reload.
//
// Each function deletes its own project, then its own KM (editor and package), at the
// end - they don't share a KM, so there's nothing to delete once for all of them.
import { waitForSave } from '../km-editor/editor/kmEditorAddEntities'
import {
  buildFileQuestionKm,
  buildIntegrationQuestionKm,
  buildItemSelectQuestionKm,
  buildListQuestionKm,
  buildMultiChoiceQuestionKm,
  buildOptionsQuestionKm,
  buildValueQuestionsKm,
  deleteQuestionTypeKm
} from './questionTypeKms'

function getOptionField(path, uuid) {
  const sanitizedPath = path.replace(/[^a-zA-Z0-9_-]/g, '_')
  return cy.get(`#value_${sanitizedPath}_${uuid}`)
}

function createProjectFrom(km, projectName) {
  cy.visitApp('/projects/create')
  cy.getField('name').type(projectName)
  cy.getField('knowledgeModelPackageUuid').click()
  cy.focused().type(km.kmName)
  cy.getCy(`form-knowledgeModelPackageUuid_option_${km.packageUuid}`).click()
  cy.getCy('form-submit').click()

  return cy.url()
    .should('match', /\/projects\/[0-9a-f-]{36}/).waitForPageFocus()
    .then((url) => url.match(/\/projects\/([0-9a-f-]{36})/)[1])
}

export function answerOptionsQuestion() {
  const projectName = `Test Options Project ${Date.now()}`
  const followUpAnswer = `Follow-up answer ${Date.now()}`

  buildOptionsQuestionKm().then((km) => {
    const optionsPath = `${km.chapterUuid}.${km.optionsQuestionUuid}`
    const followUpPath = `${optionsPath}.${km.yesAnswerUuid}.${km.followUpQuestionUuid}`

    createProjectFrom(km, projectName).then((projectUuid) => {
      getOptionField(optionsPath, km.yesAnswerUuid).click()
      cy.getQuestionnaireField(followUpPath).type(followUpAnswer)
      cy.getQuestionnaireField(followUpPath).blur()
      waitForSave()

      cy.reload()
      getOptionField(optionsPath, km.yesAnswerUuid).should('be.checked')
      cy.getQuestionnaireField(followUpPath).should('have.value', followUpAnswer)

      cy.apiToken().then((token) => {
        cy.request({
          method: 'DELETE',
          url: `${Cypress.expose('apiUrl')}/projects/${projectUuid}`,
          headers: { Authorization: `Bearer ${token}` }
        })
      })
      deleteQuestionTypeKm(km)
    })
  })
}

export function answerMultiChoiceQuestion() {
  const projectName = `Test MultiChoice Project ${Date.now()}`

  buildMultiChoiceQuestionKm().then((km) => {
    const multiChoicePath = `${km.chapterUuid}.${km.multiChoiceQuestionUuid}`

    createProjectFrom(km, projectName).then((projectUuid) => {
      getOptionField(multiChoicePath, km.choiceAUuid).click()
      waitForSave()

      cy.reload()
      getOptionField(multiChoicePath, km.choiceAUuid).should('be.checked')

      cy.apiToken().then((token) => {
        cy.request({
          method: 'DELETE',
          url: `${Cypress.expose('apiUrl')}/projects/${projectUuid}`,
          headers: { Authorization: `Bearer ${token}` }
        })
      })
      deleteQuestionTypeKm(km)
    })
  })
}

export function answerListQuestion() {
  const projectName = `Test List Project ${Date.now()}`
  const itemAnswer = `Item answer ${Date.now()}`

  buildListQuestionKm().then((km) => {
    const listPath = `${km.chapterUuid}.${km.listQuestionUuid}`

    createProjectFrom(km, projectName).then((projectUuid) => {
      cy.getCy('item-add').click()
      waitForSave()
      cy.apiToken().then((token) => {
        cy.request({
          method: 'GET',
          url: `${Cypress.expose('apiUrl')}/projects/${projectUuid}/questionnaire`,
          headers: { Authorization: `Bearer ${token}` }
        }).then(({ body }) => {
          const itemUuid = body.replies[listPath].value.value[0]
          const itemQuestionPath = `${listPath}.${itemUuid}.${km.itemQuestionUuid}`

          cy.getQuestionnaireField(itemQuestionPath).type(itemAnswer)
          cy.getQuestionnaireField(itemQuestionPath).blur()
          waitForSave()

          cy.reload()
          cy.getQuestionnaireField(itemQuestionPath).should('have.value', itemAnswer)

          cy.request({
            method: 'DELETE',
            url: `${Cypress.expose('apiUrl')}/projects/${projectUuid}`,
            headers: { Authorization: `Bearer ${token}` }
          })
          deleteQuestionTypeKm(km)
        })
      })
    })
  })
}

export function answerItemSelectQuestion() {
  const projectName = `Test ItemSelect Project ${Date.now()}`

  buildItemSelectQuestionKm().then((km) => {
    const listPath = `${km.chapterUuid}.${km.listQuestionUuid}`
    const itemSelectPath = `${km.chapterUuid}.${km.itemSelectQuestionUuid}`

    createProjectFrom(km, projectName).then((projectUuid) => {
      cy.getCy('item-add').click()
      waitForSave()
      cy.apiToken().then((token) => {
        cy.request({
          method: 'GET',
          url: `${Cypress.expose('apiUrl')}/projects/${projectUuid}/questionnaire`,
          headers: { Authorization: `Bearer ${token}` }
        }).then(({ body }) => {
          const itemUuid = body.replies[listPath].value.value[0]

          // The ItemSelect question's own option list is server-computed, not updated
          // live from the item-add above - reloaded first so the new item is actually
          // there to pick.
          cy.reload()
          cy.getQuestionnaireField(itemSelectPath).select(itemUuid)
          waitForSave()

          cy.reload()
          cy.getQuestionnaireField(itemSelectPath).should('have.value', itemUuid)

          cy.request({
            method: 'DELETE',
            url: `${Cypress.expose('apiUrl')}/projects/${projectUuid}`,
            headers: { Authorization: `Bearer ${token}` }
          })
          deleteQuestionTypeKm(km)
        })
      })
    })
  })
}

export function answerFileQuestion() {
  const projectName = `Test File Project ${Date.now()}`
  const fileName = `upload-${Date.now()}.csv`
  const fileContent = 'a,b,c\n1,2,3\n'

  buildFileQuestionKm().then((km) => {
    const filePath = `${km.chapterUuid}.${km.fileQuestionUuid}`

    createProjectFrom(km, projectName).then((projectUuid) => {
      // button, not just [data-cy="file-upload"] - the upload modal's own always-
      // mounted "ui-dialog" shares the same testId (see this file's own header
      // comment), so the bare attribute selector matches both.
      cy.get('button[data-cy="file-upload"]').click()
      // Scoped to the modal's own "ui-dialog" element (the tag, not just its
      // data-cy - see this file's header comment) - this page mounts several modals
      // at once (share, clone, delete, this one, ...), and every Modal.withForm's
      // submit button defaults to the same "form-submit" testId unless overridden, so
      // an unscoped cy.getCy('form-submit') matches all of them.
      cy.get('ui-dialog[data-cy="file-upload"]').within(() => {
        cy.getCy('file-upload_dropzone').selectFile(
          { contents: Cypress.Buffer.from(fileContent), fileName, mimeType: 'text/csv' },
          { action: 'drag-drop' }
        )
        // The modal closes itself on a successful upload (FileUpload.elm's own Save
        // handler) - no separate "Done" step.
        cy.getCy('form-submit').click()
      })
      waitForSave()

      // The Files tab (visible only once common.fileCount > 0) shows up live - no
      // reload needed - before the reload below proves the answer itself persisted.
      cy.getCy('project_nav_files').should('exist')

      cy.reload()
      cy.getCy('questionnaire_file').should('contain.text', fileName)

      cy.apiToken().then((token) => {
        cy.request({
          method: 'GET',
          url: `${Cypress.expose('apiUrl')}/projects/${projectUuid}/questionnaire`,
          headers: { Authorization: `Bearer ${token}` }
        }).then(({ body }) => {
          const fileUuid = body.replies[filePath].value.value

          // Deleted from the Files tab, not the questionnaire's own inline
          // "file-delete" trash button - a different page entirely (Common.Pages.
          // Projects.Detail.Files), with the ordinary listing-item_<uuid>/
          // listing-item_action_delete convention.
          cy.getCy('project_nav_files').click()
          cy.openListingItemActions(fileUuid, 'listing-item_action_delete').click()
          cy.getCy('file-delete_confirm').click()
          cy.getCy(`listing-item_${fileUuid}`).should('not.exist')

          // Back on the questionnaire, the reply still points at a fileUuid that no
          // longer resolves - Question.elm's viewFile shows this as a warning rather
          // than silently clearing the answer.
          cy.getCy('project_nav_questionnaire').click()
          cy.contains('The file was deleted.').should('exist')

          // Still clearable back to its own initial, unanswered state.
          cy.getCy('questionnaire_clear-answer').click()
          waitForSave()
          cy.get('button[data-cy="file-upload"]').should('exist')

          cy.reload()
          cy.get('button[data-cy="file-upload"]').should('exist')

          cy.request({
            method: 'DELETE',
            url: `${Cypress.expose('apiUrl')}/projects/${projectUuid}`,
            headers: { Authorization: `Bearer ${token}` }
          })
          deleteQuestionTypeKm(km)
        })
      })
    })
  })
}

export function answerValueQuestion() {
  const projectName = `Test Value Project ${Date.now()}`
  const answers = {
    stringQuestionUuid: `String answer ${Date.now()}`,
    numberQuestionUuid: '42',
    dateQuestionUuid: '2030-06-15',
    dateTimeQuestionUuid: '2030-06-15 14:30',
    timeQuestionUuid: '14:30',
    textQuestionUuid: `# Text answer ${Date.now()}`,
    emailQuestionUuid: 'test@example.com',
    urlQuestionUuid: 'https://example.com',
    colorQuestionUuid: '#3366ff'
  }

  buildValueQuestionsKm().then((km) => {
    const pathFor = (key) => `${km.chapterUuid}.${km[key]}`

    createProjectFrom(km, projectName).then((projectUuid) => {
      cy.getQuestionnaireField(pathFor('stringQuestionUuid')).type(answers.stringQuestionUuid)
      cy.getQuestionnaireField(pathFor('stringQuestionUuid')).blur()

      cy.getQuestionnaireField(pathFor('numberQuestionUuid')).type(answers.numberQuestionUuid)
      cy.getQuestionnaireField(pathFor('numberQuestionUuid')).blur()

      cy.getQuestionnaireField(pathFor('dateQuestionUuid')).type(answers.dateQuestionUuid).blur()
      cy.getQuestionnaireField(pathFor('dateTimeQuestionUuid')).type(answers.dateTimeQuestionUuid).blur()
      cy.getQuestionnaireField(pathFor('timeQuestionUuid')).type(answers.timeQuestionUuid).blur()

      cy.getCy('markdown-editor_mode-markdown').click()
      cy.getQuestionnaireField(pathFor('textQuestionUuid')).type(answers.textQuestionUuid)
      cy.getQuestionnaireField(pathFor('textQuestionUuid')).blur()

      cy.getQuestionnaireField(pathFor('emailQuestionUuid')).type(answers.emailQuestionUuid)
      cy.getQuestionnaireField(pathFor('emailQuestionUuid')).blur()

      cy.getQuestionnaireField(pathFor('urlQuestionUuid')).type(answers.urlQuestionUuid)
      cy.getQuestionnaireField(pathFor('urlQuestionUuid')).blur()

      cy.getQuestionnaireField(pathFor('colorQuestionUuid')).invoke('val', answers.colorQuestionUuid).trigger('input')
      waitForSave()

      cy.reload()
      cy.getQuestionnaireField(pathFor('stringQuestionUuid')).should('have.value', answers.stringQuestionUuid)
      cy.getQuestionnaireField(pathFor('numberQuestionUuid')).should('have.value', answers.numberQuestionUuid)
      cy.getQuestionnaireField(pathFor('dateQuestionUuid')).should('have.value', answers.dateQuestionUuid)
      cy.getQuestionnaireField(pathFor('dateTimeQuestionUuid')).should('have.value', answers.dateTimeQuestionUuid)
      cy.getQuestionnaireField(pathFor('timeQuestionUuid')).should('have.value', answers.timeQuestionUuid)
      cy.getQuestionnaireField(pathFor('textQuestionUuid')).should('have.value', answers.textQuestionUuid)
      cy.getQuestionnaireField(pathFor('emailQuestionUuid')).should('have.value', answers.emailQuestionUuid)
      cy.getQuestionnaireField(pathFor('urlQuestionUuid')).should('have.value', answers.urlQuestionUuid)
      cy.getQuestionnaireField(pathFor('colorQuestionUuid')).should('have.value', answers.colorQuestionUuid)

      cy.apiToken().then((token) => {
        cy.request({
          method: 'DELETE',
          url: `${Cypress.expose('apiUrl')}/projects/${projectUuid}`,
          headers: { Authorization: `Bearer ${token}` }
        })
      })
      deleteQuestionTypeKm(km)
    })
  })
}

export function answerIntegrationQuestion() {
  const projectName = `Test Integration Project ${Date.now()}`

  buildIntegrationQuestionKm().then((km) => {
    const integrationPath = `${km.chapterUuid}.${km.integrationQuestionUuid}`

    createProjectFrom(km, projectName).then((projectUuid) => {
      // Typing debounces into a real POST /type-hints call against mockserver - the
      // suggestion button's own preventDefaultOn "mousedown" keeps focus on the input
      // (no blur needed, and blurring would hide the suggestions before they're
      // clicked - Content.elm's own HideTypeHints).
      cy.getQuestionnaireField(integrationPath).type(km.integrationTestTerm)
      cy.contains('[data-cy^="questionnaire_type-hint_"]', km.integrationTestTerm).click()

      // A real suggestion (not a custom/plain reply) renders read-only - a different
      // element than the input just typed into.
      cy.getCy('questionnaire_read-only-text').should('contain.text', km.integrationTestTerm)
      waitForSave()

      cy.reload()
      cy.getCy('questionnaire_read-only-text').should('contain.text', km.integrationTestTerm)

      cy.apiToken().then((token) => {
        cy.request({
          method: 'DELETE',
          url: `${Cypress.expose('apiUrl')}/projects/${projectUuid}`,
          headers: { Authorization: `Bearer ${token}` }
        })
      })
      deleteQuestionTypeKm(km)
    })
  })
}
