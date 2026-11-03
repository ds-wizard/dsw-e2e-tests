// Builds, through the real KM Editor UI, a small KM with exactly one question of a
// given type - one builder per Common.Api.Models.KnowledgeModel.Question.
// QuestionType.QuestionType, plus one covering every Question.QuestionValueType a
// Value question can take, so each of projectQuestionnaireTypes.js's functions gets
// its own small, independent KM rather than sharing one bigger one.
//
// This drives the same editor UI kmEditorAddEntities.js already covers, rather than
// hand-authoring the KM as bundle JSON the way basic-km.json does: that fixture's own
// raw events don't even address the entities they create by their own entityUuid (see
// git history/PR discussion) - the real metamodel migration that runs on import
// rewrites them, which isn't safe to replicate by hand. Driving the editor sidesteps
// that entirely; the resulting KM is published (an ordinary knowledge-model-package),
// not kept as a fixture.
//
// Integration is the one exception that needs more than the editor UI: its question
// type answers against a real external API, so buildIntegrationQuestionKm points the
// integration at dsw/mockserver, a small HTTP service in this repo's own
// docker-compose (its hostname is already allow-listed in dsw/server/application.yml's
// wizard.httpClient.restricted.allowedHosts). Both the KM editor's own "Load" test
// call and the questionnaire's live search are backend-proxied (Common.Api.TypeHints'
// testTypeHints/fetchTypeHints), so the mock server only has to be reachable from the
// backend container, never the browser.
import { addChild, deleteKmEditor, getKnowledgeModelUuid, waitForSave } from '../km-editor/editor/kmEditorAddEntities'

function createKm() {
  const kmId = `question-type-km-${Date.now()}`
  const kmName = `Test Question Type KM ${Date.now()}`

  cy.visitApp('/knowledge-models/editors/create')
  cy.getField('name').type(kmName)
  cy.getField('id').clear().type(kmId)
  cy.getField('versionMajor').clear().type('1')
  cy.getField('versionMinor').clear().type('0')
  cy.getField('versionPatch').clear().type('0')
  cy.getCy('form-submit').click()

  return cy.url()
    .should('match', /\/knowledge-models\/editors\/[0-9a-f-]{36}$/)
    .then((url) => url.split('/').pop())
    .then((kmEditorUuid) => getKnowledgeModelUuid(kmEditorUuid).then((knowledgeModelUuid) => ({ kmId, kmName, kmEditorUuid, knowledgeModelUuid })))
}

function publishKm(kmEditorUuid) {
  waitForSave()

  cy.visitApp(`/knowledge-models/editors/${kmEditorUuid}/settings`)
  cy.getField('license').type('MIT')
  cy.getField('description').type('Published by the Projects E2E suite.')
  cy.getCy('markdown-editor_mode-markdown').click()
  cy.getField('readme').type('# Readme')
  cy.getCy('form-submit').click()
  // Clicking Save doesn't block navigation while the PUT is in flight, and the
  // Publish button right after the next line isn't gated on it - so publishing could
  // otherwise run ahead of these settings. Common.Components.Form's unsaved-changes
  // bar only hides once the save actually lands.
  cy.getCy('form-unsaved').should('have.attr', 'hidden')

  cy.visitApp(`/knowledge-models/editors/${kmEditorUuid}`)
  cy.getCy('km-editor_publish').click()
  cy.getCy('km-editor_publish-modal_confirm').click()

  return cy.url()
    .should('match', /\/knowledge-models\/[0-9a-f-]{36}$/)
    .then((packageUrl) => packageUrl.match(/\/knowledge-models\/([0-9a-f-]{36})$/)[1])
}

export function buildOptionsQuestionKm() {
  const chapterTitle = `Options Chapter ${Date.now()}`
  const optionsTitle = `Do you agree? ${Date.now()}`
  const yesLabel = 'Yes'
  const noLabel = 'No'
  const followUpTitle = `Please explain ${Date.now()}`

  return createKm().then(({ kmId, kmName, kmEditorUuid, knowledgeModelUuid }) => {
    return addChild(`km-editor-${knowledgeModelUuid}-chapters-add`).then((chapterUuid) => {
      cy.get(`#km-editor-${chapterUuid}-title`).type(chapterTitle)
      // Waited for before every addChild below, not just once at the end - addChild
      // navigates to the new entity's own edit route, unmounting whatever field was
      // just typed into before its 1s debounce necessarily flushes - true of its
      // same-page route change too, not only a full cy.visitApp reload.
      waitForSave()

      return addChild(`km-editor-${chapterUuid}-questions-add`).then((optionsQuestionUuid) => {
        // Options is the type a fresh question already starts as - no select needed.
        cy.get(`#km-editor-${optionsQuestionUuid}-title`).type(optionsTitle)
        waitForSave()

        return addChild(`km-editor-${optionsQuestionUuid}-answers-add`).then((yesAnswerUuid) => {
          cy.get(`#km-editor-${yesAnswerUuid}-label`).type(yesLabel)
          waitForSave()

          return addChild(`km-editor-${yesAnswerUuid}-followUps-add`).then((followUpQuestionUuid) => {
            // A fresh question defaults to Options, not Value - answered as plain text,
            // which needs picking Value explicitly (kmEditorAddEntities.js's own
            // addOptionsQuestionToKmEditor comment).
            cy.get(`#km-editor-${followUpQuestionUuid}-type`).select('Value')
            cy.get(`#km-editor-${followUpQuestionUuid}-title`).type(followUpTitle)
            waitForSave()

            // Back to the options question - the second answer is its own sibling, not
            // nested under the first answer's follow-up.
            cy.visitApp(`/knowledge-models/editors/${kmEditorUuid}/edit/${optionsQuestionUuid}`)
            return addChild(`km-editor-${optionsQuestionUuid}-answers-add`).then((noAnswerUuid) => {
              cy.get(`#km-editor-${noAnswerUuid}-label`).type(noLabel)

              return publishKm(kmEditorUuid).then((packageUuid) => ({
                kmId,
                kmName,
                kmEditorUuid,
                packageUuid,
                chapterUuid,
                optionsQuestionUuid,
                yesAnswerUuid,
                noAnswerUuid,
                followUpQuestionUuid
              }))
            })
          })
        })
      })
    })
  })
}

export function buildMultiChoiceQuestionKm() {
  const chapterTitle = `MultiChoice Chapter ${Date.now()}`
  const multiChoiceTitle = `Pick your roles ${Date.now()}`
  const choiceALabel = 'Developer'
  const choiceBLabel = 'Researcher'

  return createKm().then(({ kmId, kmName, kmEditorUuid, knowledgeModelUuid }) => {
    return addChild(`km-editor-${knowledgeModelUuid}-chapters-add`).then((chapterUuid) => {
      cy.get(`#km-editor-${chapterUuid}-title`).type(chapterTitle)
      // See buildOptionsQuestionKm's matching comment.
      waitForSave()

      return addChild(`km-editor-${chapterUuid}-questions-add`).then((multiChoiceQuestionUuid) => {
        cy.get(`#km-editor-${multiChoiceQuestionUuid}-type`).select('MultiChoice')
        cy.get(`#km-editor-${multiChoiceQuestionUuid}-title`).type(multiChoiceTitle)
        waitForSave()

        return addChild(`km-editor-${multiChoiceQuestionUuid}-choices-add`).then((choiceAUuid) => {
          cy.get(`#km-editor-${choiceAUuid}-label`).type(choiceALabel)
          waitForSave()

          cy.visitApp(`/knowledge-models/editors/${kmEditorUuid}/edit/${multiChoiceQuestionUuid}`)
          return addChild(`km-editor-${multiChoiceQuestionUuid}-choices-add`).then((choiceBUuid) => {
            cy.get(`#km-editor-${choiceBUuid}-label`).type(choiceBLabel)

            return publishKm(kmEditorUuid).then((packageUuid) => ({
              kmId,
              kmName,
              kmEditorUuid,
              packageUuid,
              chapterUuid,
              multiChoiceQuestionUuid,
              choiceAUuid,
              choiceBUuid
            }))
          })
        })
      })
    })
  })
}

export function buildListQuestionKm() {
  const chapterTitle = `List Chapter ${Date.now()}`
  const listTitle = `Add contributors ${Date.now()}`
  const itemQuestionTitle = `Contributor name ${Date.now()}`

  return createKm().then(({ kmId, kmName, kmEditorUuid, knowledgeModelUuid }) => {
    return addChild(`km-editor-${knowledgeModelUuid}-chapters-add`).then((chapterUuid) => {
      cy.get(`#km-editor-${chapterUuid}-title`).type(chapterTitle)
      // See buildOptionsQuestionKm's matching comment.
      waitForSave()

      return addChild(`km-editor-${chapterUuid}-questions-add`).then((listQuestionUuid) => {
        cy.get(`#km-editor-${listQuestionUuid}-type`).select('List')
        cy.get(`#km-editor-${listQuestionUuid}-title`).type(listTitle)
        waitForSave()

        return addChild(`km-editor-${listQuestionUuid}-itemQuestions-add`).then((itemQuestionUuid) => {
          // Same default-is-Options reason noted in buildOptionsQuestionKm.
          cy.get(`#km-editor-${itemQuestionUuid}-type`).select('Value')
          cy.get(`#km-editor-${itemQuestionUuid}-title`).type(itemQuestionTitle)

          return publishKm(kmEditorUuid).then((packageUuid) => ({
            kmId,
            kmName,
            kmEditorUuid,
            packageUuid,
            chapterUuid,
            listQuestionUuid,
            itemQuestionUuid
          }))
        })
      })
    })
  })
}

export function buildItemSelectQuestionKm() {
  const chapterTitle = `ItemSelect Chapter ${Date.now()}`
  const listTitle = `Contributors ${Date.now()}`
  const itemQuestionTitle = `Contributor name ${Date.now()}`
  const itemSelectTitle = `Pick a contributor ${Date.now()}`

  return createKm().then(({ kmId, kmName, kmEditorUuid, knowledgeModelUuid }) => {
    return addChild(`km-editor-${knowledgeModelUuid}-chapters-add`).then((chapterUuid) => {
      cy.get(`#km-editor-${chapterUuid}-title`).type(chapterTitle)
      // See buildOptionsQuestionKm's matching comment.
      waitForSave()

      return addChild(`km-editor-${chapterUuid}-questions-add`).then((listQuestionUuid) => {
        cy.get(`#km-editor-${listQuestionUuid}-type`).select('List')
        cy.get(`#km-editor-${listQuestionUuid}-title`).type(listTitle)
        waitForSave()

        return addChild(`km-editor-${listQuestionUuid}-itemQuestions-add`).then((itemQuestionUuid) => {
          cy.get(`#km-editor-${itemQuestionUuid}-type`).select('Value')
          cy.get(`#km-editor-${itemQuestionUuid}-title`).type(itemQuestionTitle)
          waitForSave()

          // Back to the chapter, so the ItemSelect question is the list's sibling,
          // not nested under its own item question.
          cy.visitApp(`/knowledge-models/editors/${kmEditorUuid}/edit/${chapterUuid}`)
          return addChild(`km-editor-${chapterUuid}-questions-add`).then((itemSelectQuestionUuid) => {
            cy.get(`#km-editor-${itemSelectQuestionUuid}-type`).select('ItemSelect')
            cy.get(`#km-editor-${itemSelectQuestionUuid}-title`).type(itemSelectTitle)
            // Keyed by the list question's own uuid as the option value, not its title
            // (kmEditorAddEntities.js's addItemSelectQuestion).
            cy.get(`#km-editor-${itemSelectQuestionUuid}-listQuestion`).select(listQuestionUuid)

            return publishKm(kmEditorUuid).then((packageUuid) => ({
              kmId,
              kmName,
              kmEditorUuid,
              packageUuid,
              chapterUuid,
              listQuestionUuid,
              itemQuestionUuid,
              itemSelectQuestionUuid
            }))
          })
        })
      })
    })
  })
}

export function buildFileQuestionKm() {
  const chapterTitle = `File Chapter ${Date.now()}`
  const fileQuestionTitle = `Upload a file ${Date.now()}`

  return createKm().then(({ kmId, kmName, kmEditorUuid, knowledgeModelUuid }) => {
    return addChild(`km-editor-${knowledgeModelUuid}-chapters-add`).then((chapterUuid) => {
      cy.get(`#km-editor-${chapterUuid}-title`).type(chapterTitle)
      // See buildOptionsQuestionKm's matching comment.
      waitForSave()

      // fileTypes/maxSize are both optional (Common.Pages.KMEditor.Editor.Entity) -
      // left unset, so any file of any size is accepted.
      return addChild(`km-editor-${chapterUuid}-questions-add`).then((fileQuestionUuid) => {
        cy.get(`#km-editor-${fileQuestionUuid}-type`).select('File')
        cy.get(`#km-editor-${fileQuestionUuid}-title`).type(fileQuestionTitle)

        return publishKm(kmEditorUuid).then((packageUuid) => ({
          kmId,
          kmName,
          kmEditorUuid,
          packageUuid,
          chapterUuid,
          fileQuestionUuid
        }))
      })
    })
  })
}

export function buildIntegrationQuestionKm() {
  const chapterTitle = `Integration Chapter ${Date.now()}`
  const integrationName = `Test Integration ${Date.now()}`
  const integrationQuestionTitle = `Look something up ${Date.now()}`
  // Matched against mockserver/server.js's own fixed ITEMS list, substring, case
  // insensitive - used both for this builder's own "Load" test call and for
  // projectQuestionnaireTypes.js's real search in the questionnaire.
  const integrationTestTerm = 'Banana'

  return createKm().then(({ kmId, kmName, kmEditorUuid, knowledgeModelUuid }) => {
    return addChild(`km-editor-${knowledgeModelUuid}-integrations-add`).then((integrationUuid) => {
      cy.get(`#km-editor-${integrationUuid}-name`).type(integrationName)
      // {{ }} is Jinja, not a Cypress special-key sequence - typed literally here and
      // below.
      cy.get(`#km-editor-${integrationUuid}-requestUrl`).type('http://mockserver/search?q={{ q }}', {
        parseSpecialCharSequences: false
      })
      waitForSave()

      // responseListField/responseItemTemplate below aren't in the DOM at all until a
      // real test call has come back successfully (Common.Pages.KMEditor.Editor.
      // Integration's own responseSection builds itself from what the test returned) -
      // run one first, against mockserver for real.
      cy.get(`#km-editor-${integrationUuid}-testQ`).type(integrationTestTerm)
      cy.getCy('km-editor_integration_test').click()

      cy.get(`#km-editor-${integrationUuid}-responseListField`).type('results')
      cy.get(`#km-editor-${integrationUuid}-responseItemTemplate`).type('{{ item.name }}', {
        parseSpecialCharSequences: false
      })
      waitForSave()

      // Back to the KM's own root, so the chapter is a sibling of the integration,
      // not nested under it.
      cy.visitApp(`/knowledge-models/editors/${kmEditorUuid}`)
      return addChild(`km-editor-${knowledgeModelUuid}-chapters-add`).then((chapterUuid) => {
        cy.get(`#km-editor-${chapterUuid}-title`).type(chapterTitle)
        // See buildOptionsQuestionKm's matching comment.
        waitForSave()

        return addChild(`km-editor-${chapterUuid}-questions-add`).then((integrationQuestionUuid) => {
          cy.get(`#km-editor-${integrationQuestionUuid}-type`).select('Integration')
          cy.get(`#km-editor-${integrationQuestionUuid}-title`).type(integrationQuestionTitle)
          // Keyed by the integration's own uuid as the option value, not its name.
          cy.get(`#km-editor-${integrationQuestionUuid}-integration`).select(integrationUuid)

          return publishKm(kmEditorUuid).then((packageUuid) => ({
            kmId,
            kmName,
            kmEditorUuid,
            packageUuid,
            chapterUuid,
            integrationQuestionUuid,
            integrationTestTerm
          }))
        })
      })
    })
  })
}

// One question per Common.Api.Models.KnowledgeModel.Question.QuestionValueType, all
// Value-type questions in the same chapter. Returns the chapter's uuid plus one
// <valueType>QuestionUuid property per entry below (e.g. stringQuestionUuid).
const VALUE_TYPES = [
  { valueType: 'StringQuestionValueType', key: 'stringQuestionUuid' },
  { valueType: 'NumberQuestionValueType', key: 'numberQuestionUuid' },
  { valueType: 'DateQuestionValueType', key: 'dateQuestionUuid' },
  { valueType: 'DateTimeQuestionValueType', key: 'dateTimeQuestionUuid' },
  { valueType: 'TimeQuestionValueType', key: 'timeQuestionUuid' },
  { valueType: 'TextQuestionValueType', key: 'textQuestionUuid' },
  { valueType: 'EmailQuestionValueType', key: 'emailQuestionUuid' },
  { valueType: 'UrlQuestionValueType', key: 'urlQuestionUuid' },
  { valueType: 'ColorQuestionValueType', key: 'colorQuestionUuid' }
]

export function buildValueQuestionsKm() {
  const chapterTitle = `Value Chapter ${Date.now()}`

  return createKm().then(({ kmId, kmName, kmEditorUuid, knowledgeModelUuid }) => {
    return addChild(`km-editor-${knowledgeModelUuid}-chapters-add`).then((chapterUuid) => {
      cy.get(`#km-editor-${chapterUuid}-title`).type(chapterTitle)
      // See buildOptionsQuestionKm's matching comment.
      waitForSave()

      // Added one at a time, each a sibling of the last - addChild always lands on
      // the newly-created question's own edit route, so it has to navigate back to
      // the chapter before adding the next one.
      return VALUE_TYPES.reduce((chain, { valueType, key }) => {
        return chain.then((questionUuids) => {
          cy.visitApp(`/knowledge-models/editors/${kmEditorUuid}/edit/${chapterUuid}`)
          return addChild(`km-editor-${chapterUuid}-questions-add`).then((questionUuid) => {
            cy.get(`#km-editor-${questionUuid}-type`).select('Value')
            cy.get(`#km-editor-${questionUuid}-valueType`).select(valueType)

            cy.get(`#km-editor-${questionUuid}-title`).type(`${valueType} ${Date.now()}`)

            // Waited for here, not just once at the very end - the next iteration
            // navigates away (back to the chapter) before adding its own question,
            // and that navigation doesn't wait for this title's own 1s debounce to
            // flush, so every question but the last one was landing with no title at
            // all.
            return waitForSave().then(() => ({ ...questionUuids, [key]: questionUuid }))
          })
        })
      }, cy.wrap({})).then((questionUuids) => {
        return publishKm(kmEditorUuid).then((packageUuid) => ({
          kmId,
          kmName,
          kmEditorUuid,
          packageUuid,
          chapterUuid,
          ...questionUuids
        }))
      })
    })
  })
}

export function deleteQuestionTypeKm({ kmId, kmEditorUuid }) {
  deleteKmEditor(kmEditorUuid)
  cy.cleanupKnowledgeModelPackage(kmId)
}
