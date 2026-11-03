// Adds every kind of KM editor entity to a freshly created KM editor, one function
// per kind, each fully self-contained. Adding navigates straight to the new entity's
// own edit route (its uuid comes from the resulting URL, not a separate list-item
// link) - fields are plain id attributes, not data-cy, named after the entity's own
// field ("title", not "label"): "km-editor-<uuid>-title". A root-level add trigger
// ("chapters-add", "metrics-add", ...) is keyed by the knowledge model's own entity
// uuid - a real uuid of its own, generated per editor (Shared.Service.KnowledgeModel.
// Editor.EditorService.getEditorByUuid folds in the editor's own AddKnowledgeModelEvent),
// not the KM editor's own uuid, which keys entities instead - fetched fresh per editor
// (getKnowledgeModelUuid) rather than assumed, since a backend fix stopped every fresh
// editor's own knowledge model from compiling down to the same fixed nil uuid.
//
// Saves go over the same websocket as real-time collaboration, so "typed it" isn't
// "saved it" - wait for the "saving-indicator" (shared with Projects) to leave its
// "saving" state before reopening and checking the entity
// actually persisted server-side. Reopening navigates straight to the entity's own
// edit route by uuid (the edit route resolves purely from the uuid, regardless of how
// deeply nested the entity is), rather than drilling back down through the tree.
//
// Some fields are markdown ("text", "description", "advice", "content"), not a plain
// input or textarea - the field's own id is on a hidden source textarea that "rich"
// mode (the default) keeps hidden, so typing into it needs switching to "markdown"
// mode first ("markdown-editor_mode-markdown"). Others ("description" on Phase/Tag) are plain textareas
// and need no such switch - check Common.Pages.KMEditor.Editor.Entity/Widgets in
// engine-frontend before assuming either way for a field not already covered here.
// getKnowledgeModelUuid/addChild/typeMarkdown/waitForSave/deleteKmEditor are also
// reused by projects/questionTypeKms.js and projects/projectMigrate.js, to build a KM
// through this same editor UI rather than hand-authoring bundle JSON (see their own
// header comments). createKmEditor stays private - its generated "id" never comes back
// out of it, which both of those need for their own cleanup, so they build that one
// step themselves instead.

// Resolves to the knowledge model's own uuid, not the editor's - fetched via the API
// since nothing in the editor's own UI offers it directly (Entity.elm's own comment:
// "The knowledge model itself offers no uuid to copy").
export function getKnowledgeModelUuid(kmEditorUuid) {
  return cy.apiToken().then((token) => {
    return cy.request({
      method: 'GET',
      url: `${Cypress.expose('apiUrl')}/knowledge-model-editors/${kmEditorUuid}`,
      headers: { Authorization: `Bearer ${token}` }
    }).then(({ body }) => body.knowledgeModel.uuid)
  })
}

function createKmEditor() {
  const kmId = `km-${Date.now()}`
  const kmName = `Test KM ${Date.now()}`

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
    .then((kmEditorUuid) => getKnowledgeModelUuid(kmEditorUuid).then((knowledgeModelUuid) => ({ kmEditorUuid, knowledgeModelUuid })))
}

export function addChild(triggerId) {
  cy.get(`#${triggerId}`).click()
  return cy.url()
    .should('match', /\/edit\/[0-9a-f-]{36}$/)
    .then((url) => url.split('/').pop())
}

export function typeMarkdown(fieldId, content) {
  cy.getCy('markdown-editor_mode-markdown').click()
  cy.get(`#${fieldId}`).type(content)
}

export function waitForSave() {
  // Field edits are sent over the websocket with a 1s debounce
  // (Common.Data.AppState.websocketThrottleDelay), but the saving indicator
  // only tracks immediately-sent events, so it can show "Saved" while a
  // debounced edit is still pending - reopening before that fires loses it.
  //
  // Returns its own chain so a caller that needs to sequence something after it
  // (e.g. navigating away) can cy.then()/return off it, rather than racing a bare
  // statement - existing callers that don't use the return value are unaffected.
  cy.wait(1200)
  return cy.getCy('saving-indicator').should('not.have.attr', 'data-state', 'saving')
}

function reopen(kmEditorUuid, entityUuid) {
  cy.visitApp(`/knowledge-models/editors/${kmEditorUuid}/edit/${entityUuid}`)
}

export function deleteKmEditor(kmEditorUuid) {
  cy.apiToken().then((token) => {
    cy.request({
      method: 'DELETE',
      url: `${Cypress.expose('apiUrl')}/knowledge-model-editors/${kmEditorUuid}`,
      headers: { Authorization: `Bearer ${token}` }
    })
  })
}

export function addChapterToKmEditor() {
  const chapterTitle = `Test Chapter ${Date.now()}`
  const chapterText = `Test chapter text ${Date.now()}`

  createKmEditor().then(({ kmEditorUuid, knowledgeModelUuid }) => {
    addChild(`km-editor-${knowledgeModelUuid}-chapters-add`).then((chapterUuid) => {
      cy.get(`#km-editor-${chapterUuid}-title`).type(chapterTitle)
      typeMarkdown(`km-editor-${chapterUuid}-text`, chapterText)
      cy.getCy(`km-editor_tree_entity_${chapterUuid}`).should('contain.text', chapterTitle)

      waitForSave()
      reopen(kmEditorUuid, chapterUuid)
      cy.get(`#km-editor-${chapterUuid}-title`).should('have.value', chapterTitle)
      cy.get(`#km-editor-${chapterUuid}-text`).should('have.value', chapterText)

      deleteKmEditor(kmEditorUuid)
    })
  })
}

export function addMetricToKmEditor() {
  const metricTitle = `Test Metric ${Date.now()}`
  const metricAbbreviation = `M${Date.now()}`
  const metricDescription = `Test metric description ${Date.now()}`

  createKmEditor().then(({ kmEditorUuid, knowledgeModelUuid }) => {
    addChild(`km-editor-${knowledgeModelUuid}-metrics-add`).then((metricUuid) => {
      cy.get(`#km-editor-${metricUuid}-title`).type(metricTitle)
      cy.get(`#km-editor-${metricUuid}-abbreviation`).type(metricAbbreviation)
      typeMarkdown(`km-editor-${metricUuid}-description`, metricDescription)
      cy.getCy(`km-editor_tree_entity_${metricUuid}`).should('contain.text', metricTitle)

      waitForSave()
      reopen(kmEditorUuid, metricUuid)
      cy.get(`#km-editor-${metricUuid}-title`).should('have.value', metricTitle)
      cy.get(`#km-editor-${metricUuid}-abbreviation`).should('have.value', metricAbbreviation)
      cy.get(`#km-editor-${metricUuid}-description`).should('have.value', metricDescription)

      deleteKmEditor(kmEditorUuid)
    })
  })
}

// Phase's "description" is a plain textarea, not the markdown editor - no mode
// switch needed.
export function addPhaseToKmEditor() {
  const phaseTitle = `Test Phase ${Date.now()}`
  const phaseDescription = `Test phase description ${Date.now()}`

  createKmEditor().then(({ kmEditorUuid, knowledgeModelUuid }) => {
    addChild(`km-editor-${knowledgeModelUuid}-phases-add`).then((phaseUuid) => {
      cy.get(`#km-editor-${phaseUuid}-title`).type(phaseTitle)
      cy.get(`#km-editor-${phaseUuid}-description`).type(phaseDescription)
      cy.getCy(`km-editor_tree_entity_${phaseUuid}`).should('contain.text', phaseTitle)

      waitForSave()
      reopen(kmEditorUuid, phaseUuid)
      cy.get(`#km-editor-${phaseUuid}-title`).should('have.value', phaseTitle)
      cy.get(`#km-editor-${phaseUuid}-description`).should('have.value', phaseDescription)

      deleteKmEditor(kmEditorUuid)
    })
  })
}

// Tag's "description" is a plain textarea too. Its "color" field
// (#km-editor-<uuid>-color) is the hex text input next to the native color
// picker/swatches, not the picker itself - the field's own id and label belong to
// the input that spells the value out as text.
export function addTagToKmEditor() {
  const tagName = `Test Tag ${Date.now()}`
  const tagDescription = `Test tag description ${Date.now()}`
  const tagColor = '#34495e'

  createKmEditor().then(({ kmEditorUuid, knowledgeModelUuid }) => {
    addChild(`km-editor-${knowledgeModelUuid}-tags-add`).then((tagUuid) => {
      cy.get(`#km-editor-${tagUuid}-name`).type(tagName)
      cy.get(`#km-editor-${tagUuid}-description`).type(tagDescription)
      cy.get(`#km-editor-${tagUuid}-color`).clear().type(tagColor)
      cy.getCy(`km-editor_tree_entity_${tagUuid}`).should('contain.text', tagName)

      waitForSave()
      reopen(kmEditorUuid, tagUuid)
      cy.get(`#km-editor-${tagUuid}-name`).should('have.value', tagName)
      cy.get(`#km-editor-${tagUuid}-description`).should('have.value', tagDescription)
      cy.get(`#km-editor-${tagUuid}-color`).should('have.value', tagColor)

      deleteKmEditor(kmEditorUuid)
    })
  })
}

export function addResourceCollectionToKmEditor() {
  const resourceCollectionTitle = `Test Resource Collection ${Date.now()}`

  createKmEditor().then(({ kmEditorUuid, knowledgeModelUuid }) => {
    addChild(`km-editor-${knowledgeModelUuid}-resourceCollections-add`).then((resourceCollectionUuid) => {
      cy.get(`#km-editor-${resourceCollectionUuid}-title`).type(resourceCollectionTitle)
      cy.getCy(`km-editor_tree_entity_${resourceCollectionUuid}`).should('contain.text', resourceCollectionTitle)

      waitForSave()
      reopen(kmEditorUuid, resourceCollectionUuid)
      cy.get(`#km-editor-${resourceCollectionUuid}-title`).should('have.value', resourceCollectionTitle)

      deleteKmEditor(kmEditorUuid)
    })
  })
}

export function addResourcePageToKmEditor() {
  const resourceCollectionTitle = `Test Resource Collection ${Date.now()}`
  const resourcePageTitle = `Test Resource Page ${Date.now()}`
  const resourcePageContent = `Test resource page content ${Date.now()}`

  createKmEditor().then(({ kmEditorUuid, knowledgeModelUuid }) => {
    addChild(`km-editor-${knowledgeModelUuid}-resourceCollections-add`).then((resourceCollectionUuid) => {
      cy.get(`#km-editor-${resourceCollectionUuid}-title`).type(resourceCollectionTitle)

      addChild(`km-editor-${resourceCollectionUuid}-resourcePages-add`).then((resourcePageUuid) => {
        cy.get(`#km-editor-${resourcePageUuid}-title`).type(resourcePageTitle)
        typeMarkdown(`km-editor-${resourcePageUuid}-content`, resourcePageContent)
        cy.getCy(`km-editor_tree_entity_${resourcePageUuid}`).should('contain.text', resourcePageTitle)

        waitForSave()
        reopen(kmEditorUuid, resourcePageUuid)
        cy.get(`#km-editor-${resourcePageUuid}-title`).should('have.value', resourcePageTitle)
        cy.get(`#km-editor-${resourcePageUuid}-content`).should('have.value', resourcePageContent)

        deleteKmEditor(kmEditorUuid)
      })
    })
  })
}

function createChapter() {
  return createKmEditor().then(({ kmEditorUuid, knowledgeModelUuid }) => {
    return addChild(`km-editor-${knowledgeModelUuid}-chapters-add`).then((chapterUuid) => {
      return { kmEditorUuid, chapterUuid, knowledgeModelUuid }
    })
  })
}

export function addOptionsQuestionToKmEditor() {
  const questionTitle = `Test Options Question ${Date.now()}`
  const questionText = 'What is the answer?'

  createChapter().then(({ kmEditorUuid, chapterUuid }) => {
    addChild(`km-editor-${chapterUuid}-questions-add`).then((questionUuid) => {
      cy.get(`#km-editor-${questionUuid}-title`).type(questionTitle)
      typeMarkdown(`km-editor-${questionUuid}-text`, questionText)
      cy.getCy(`km-editor_tree_entity_${questionUuid}`).should('contain.text', questionTitle)

      waitForSave()
      reopen(kmEditorUuid, questionUuid)
      cy.get(`#km-editor-${questionUuid}-type`).should('have.value', 'Options')
      cy.get(`#km-editor-${questionUuid}-title`).should('have.value', questionTitle)
      cy.get(`#km-editor-${questionUuid}-text`).should('have.value', questionText)

      deleteKmEditor(kmEditorUuid)
    })
  })
}

export function addMultiChoiceQuestionToKmEditor() {
  const questionTitle = `Test MultiChoice Question ${Date.now()}`
  const questionText = 'What is the answer?'

  createChapter().then(({ kmEditorUuid, chapterUuid }) => {
    addChild(`km-editor-${chapterUuid}-questions-add`).then((questionUuid) => {
      cy.get(`#km-editor-${questionUuid}-type`).select('MultiChoice')
      cy.get(`#km-editor-${questionUuid}-title`).type(questionTitle)
      typeMarkdown(`km-editor-${questionUuid}-text`, questionText)
      cy.getCy(`km-editor_tree_entity_${questionUuid}`).should('contain.text', questionTitle)

      waitForSave()
      reopen(kmEditorUuid, questionUuid)
      cy.get(`#km-editor-${questionUuid}-type`).should('have.value', 'MultiChoice')
      cy.get(`#km-editor-${questionUuid}-title`).should('have.value', questionTitle)
      cy.get(`#km-editor-${questionUuid}-text`).should('have.value', questionText)

      deleteKmEditor(kmEditorUuid)
    })
  })
}

export function addListQuestionToKmEditor() {
  const questionTitle = `Test List Question ${Date.now()}`
  const questionText = 'What is the answer?'

  createChapter().then(({ kmEditorUuid, chapterUuid }) => {
    addChild(`km-editor-${chapterUuid}-questions-add`).then((questionUuid) => {
      cy.get(`#km-editor-${questionUuid}-type`).select('List')
      cy.get(`#km-editor-${questionUuid}-title`).type(questionTitle)
      typeMarkdown(`km-editor-${questionUuid}-text`, questionText)
      cy.getCy(`km-editor_tree_entity_${questionUuid}`).should('contain.text', questionTitle)

      waitForSave()
      reopen(kmEditorUuid, questionUuid)
      cy.get(`#km-editor-${questionUuid}-type`).should('have.value', 'List')
      cy.get(`#km-editor-${questionUuid}-title`).should('have.value', questionTitle)
      cy.get(`#km-editor-${questionUuid}-text`).should('have.value', questionText)

      deleteKmEditor(kmEditorUuid)
    })
  })
}

// valueType is selected by its raw value ("NumberQuestionValueType"), not its label.
export function addValueQuestionToKmEditor() {
  const questionTitle = `Test Value Question ${Date.now()}`
  const questionText = 'What is the answer?'

  createChapter().then(({ kmEditorUuid, chapterUuid }) => {
    addChild(`km-editor-${chapterUuid}-questions-add`).then((questionUuid) => {
      cy.get(`#km-editor-${questionUuid}-type`).select('Value')
      cy.get(`#km-editor-${questionUuid}-title`).type(questionTitle)
      typeMarkdown(`km-editor-${questionUuid}-text`, questionText)
      cy.get(`#km-editor-${questionUuid}-valueType`).select('NumberQuestionValueType')
      cy.getCy(`km-editor_tree_entity_${questionUuid}`).should('contain.text', questionTitle)

      waitForSave()
      reopen(kmEditorUuid, questionUuid)
      cy.get(`#km-editor-${questionUuid}-type`).should('have.value', 'Value')
      cy.get(`#km-editor-${questionUuid}-title`).should('have.value', questionTitle)
      cy.get(`#km-editor-${questionUuid}-text`).should('have.value', questionText)
      cy.get(`#km-editor-${questionUuid}-valueType`).should('have.value', 'NumberQuestionValueType')

      deleteKmEditor(kmEditorUuid)
    })
  })
}

function createChapterWithQuestion() {
  return createChapter().then(({ kmEditorUuid, chapterUuid, knowledgeModelUuid }) => {
    return addChild(`km-editor-${chapterUuid}-questions-add`).then((questionUuid) => {
      return { kmEditorUuid, questionUuid, knowledgeModelUuid }
    })
  })
}

export function addAnswerToOptionsQuestion() {
  const answerLabel = `Test Answer ${Date.now()}`
  const answerAdvice = `Test answer advice ${Date.now()}`

  createChapterWithQuestion().then(({ kmEditorUuid, questionUuid }) => {
    addChild(`km-editor-${questionUuid}-answers-add`).then((answerUuid) => {
      cy.get(`#km-editor-${answerUuid}-label`).type(answerLabel)
      typeMarkdown(`km-editor-${answerUuid}-advice`, answerAdvice)
      cy.getCy(`km-editor_tree_entity_${answerUuid}`).should('contain.text', answerLabel)

      waitForSave()
      reopen(kmEditorUuid, answerUuid)
      cy.get(`#km-editor-${answerUuid}-label`).should('have.value', answerLabel)
      cy.get(`#km-editor-${answerUuid}-advice`).should('have.value', answerAdvice)

      deleteKmEditor(kmEditorUuid)
    })
  })
}

export function addChoiceToMultiChoiceQuestion() {
  const choiceLabel = `Test Choice ${Date.now()}`

  createChapter().then(({ kmEditorUuid, chapterUuid }) => {
    addChild(`km-editor-${chapterUuid}-questions-add`).then((questionUuid) => {
      cy.get(`#km-editor-${questionUuid}-type`).select('MultiChoice')

      addChild(`km-editor-${questionUuid}-choices-add`).then((choiceUuid) => {
        cy.get(`#km-editor-${choiceUuid}-label`).type(choiceLabel)
        cy.getCy(`km-editor_tree_entity_${choiceUuid}`).should('contain.text', choiceLabel)

        waitForSave()
        reopen(kmEditorUuid, choiceUuid)
        cy.get(`#km-editor-${choiceUuid}-label`).should('have.value', choiceLabel)

        deleteKmEditor(kmEditorUuid)
      })
    })
  })
}

export function addFollowUpQuestionToAnswer() {
  const followUpTitle = `Test Follow-up Question ${Date.now()}`

  createChapterWithQuestion().then(({ kmEditorUuid, questionUuid }) => {
    addChild(`km-editor-${questionUuid}-answers-add`).then((answerUuid) => {
      addChild(`km-editor-${answerUuid}-followUps-add`).then((followUpUuid) => {
        cy.get(`#km-editor-${followUpUuid}-title`).type(followUpTitle)
        cy.getCy(`km-editor_tree_entity_${followUpUuid}`).should('contain.text', followUpTitle)

        waitForSave()
        reopen(kmEditorUuid, followUpUuid)
        cy.get(`#km-editor-${followUpUuid}-title`).should('have.value', followUpTitle)

        deleteKmEditor(kmEditorUuid)
      })
    })
  })
}

export function addItemQuestionToListQuestion() {
  const itemQuestionTitle = `Test Item Question ${Date.now()}`

  createChapter().then(({ kmEditorUuid, chapterUuid }) => {
    addChild(`km-editor-${chapterUuid}-questions-add`).then((listQuestionUuid) => {
      cy.get(`#km-editor-${listQuestionUuid}-type`).select('List')

      addChild(`km-editor-${listQuestionUuid}-itemQuestions-add`).then((itemQuestionUuid) => {
        cy.get(`#km-editor-${itemQuestionUuid}-title`).type(itemQuestionTitle)
        cy.getCy(`km-editor_tree_entity_${itemQuestionUuid}`).should('contain.text', itemQuestionTitle)

        waitForSave()
        reopen(kmEditorUuid, itemQuestionUuid)
        cy.get(`#km-editor-${itemQuestionUuid}-title`).should('have.value', itemQuestionTitle)

        deleteKmEditor(kmEditorUuid)
      })
    })
  })
}

export function addExpertToQuestion() {
  const expertName = `Test Expert ${Date.now()}`
  const expertEmail = `expert-${Date.now()}@example.com`

  createChapterWithQuestion().then(({ kmEditorUuid, questionUuid }) => {
    addChild(`km-editor-${questionUuid}-experts-add`).then((expertUuid) => {
      cy.get(`#km-editor-${expertUuid}-name`).type(expertName)
      cy.get(`#km-editor-${expertUuid}-email`).type(expertEmail)
      cy.getCy(`km-editor_tree_entity_${expertUuid}`).should('contain.text', expertName)

      waitForSave()
      reopen(kmEditorUuid, expertUuid)
      cy.get(`#km-editor-${expertUuid}-name`).should('have.value', expertName)
      cy.get(`#km-editor-${expertUuid}-email`).should('have.value', expertEmail)

      deleteKmEditor(kmEditorUuid)
    })
  })
}

// A reference defaults to referenceType "ResourcePage" - this one switches it to "URL".
export function addUrlReference() {
  const url = 'https://example.com'
  const label = `Test Reference ${Date.now()}`

  createChapterWithQuestion().then(({ kmEditorUuid, questionUuid }) => {
    addChild(`km-editor-${questionUuid}-references-add`).then((referenceUuid) => {
      cy.get(`#km-editor-${referenceUuid}-referenceType`).select('URL')
      cy.get(`#km-editor-${referenceUuid}-url`).type(url)
      cy.get(`#km-editor-${referenceUuid}-label`).type(label)
      cy.getCy(`km-editor_tree_entity_${referenceUuid}`).should('contain.text', label)

      waitForSave()
      reopen(kmEditorUuid, referenceUuid)
      cy.get(`#km-editor-${referenceUuid}-referenceType`).should('have.value', 'URL')
      cy.get(`#km-editor-${referenceUuid}-url`).should('have.value', url)
      cy.get(`#km-editor-${referenceUuid}-label`).should('have.value', label)

      deleteKmEditor(kmEditorUuid)
    })
  })
}

// A fresh reference defaults to referenceType "URL", so it must be switched to
// "ResourcePage" before its own "resourcePage" select appears. That select is
// keyed by the resource page's own uuid as the option value, not its title -
// picked with .select(uuid). The tree names a ResourcePage reference after the
// resource page it links to.
export function addResourcePageReference() {
  const resourcePageTitle = `Test Resource Page ${Date.now()}`

  createKmEditor().then(({ kmEditorUuid, knowledgeModelUuid }) => {
    addChild(`km-editor-${knowledgeModelUuid}-resourceCollections-add`).then((resourceCollectionUuid) => {
      addChild(`km-editor-${resourceCollectionUuid}-resourcePages-add`).then((resourcePageUuid) => {
        cy.get(`#km-editor-${resourcePageUuid}-title`).type(resourcePageTitle)
        waitForSave()

        // Back to the KM's own root, so the chapter below is a root-level sibling,
        // not nested under the resource collection.
        cy.visitApp(`/knowledge-models/editors/${kmEditorUuid}`)
        addChild(`km-editor-${knowledgeModelUuid}-chapters-add`).then((chapterUuid) => {
          addChild(`km-editor-${chapterUuid}-questions-add`).then((questionUuid) => {
            addChild(`km-editor-${questionUuid}-references-add`).then((referenceUuid) => {
              cy.get(`#km-editor-${referenceUuid}-referenceType`).select('ResourcePage')
              cy.get(`#km-editor-${referenceUuid}-resourcePage`).select(resourcePageUuid)
              cy.getCy(`km-editor_tree_entity_${referenceUuid}`).should('contain.text', resourcePageTitle)

              waitForSave()
              reopen(kmEditorUuid, referenceUuid)
              cy.get(`#km-editor-${referenceUuid}-referenceType`).should('have.value', 'ResourcePage')
              cy.get(`#km-editor-${referenceUuid}-resourcePage`).should('have.value', resourcePageUuid)

              deleteKmEditor(kmEditorUuid)
            })
          })
        })
      })
    })
  })
}

// The target question (first chapter/question) is created first, then a second
// chapter/question holds the actual Cross reference pointing at it. "targetQuestion"
// is a select keyed by each question's own uuid as the option value. The tree names a
// Cross reference after its target question.
export function addCrossReference() {
  const targetQuestionTitle = `Test Target Question ${Date.now()}`
  const description = `Test reference description ${Date.now()}`

  createChapterWithQuestion().then(({ kmEditorUuid, questionUuid: targetQuestionUuid, knowledgeModelUuid }) => {
    cy.get(`#km-editor-${targetQuestionUuid}-title`).type(targetQuestionTitle)
    waitForSave()

    // Back to the KM's own root, so the second chapter is a root-level sibling of
    // the first, not nested under it.
    cy.visitApp(`/knowledge-models/editors/${kmEditorUuid}`)
    addChild(`km-editor-${knowledgeModelUuid}-chapters-add`).then((secondChapterUuid) => {
      addChild(`km-editor-${secondChapterUuid}-questions-add`).then((secondQuestionUuid) => {
        addChild(`km-editor-${secondQuestionUuid}-references-add`).then((referenceUuid) => {
          cy.get(`#km-editor-${referenceUuid}-referenceType`).select('Cross')
          cy.get(`#km-editor-${referenceUuid}-targetQuestion`).select(targetQuestionUuid)
          cy.get(`#km-editor-${referenceUuid}-description`).type(description)
          cy.getCy(`km-editor_tree_entity_${referenceUuid}`).should('contain.text', targetQuestionTitle)

          waitForSave()
          reopen(kmEditorUuid, referenceUuid)
          cy.get(`#km-editor-${referenceUuid}-referenceType`).should('have.value', 'Cross')
          cy.get(`#km-editor-${referenceUuid}-targetQuestion`).should('have.value', targetQuestionUuid)
          cy.get(`#km-editor-${referenceUuid}-description`).should('have.value', description)

          deleteKmEditor(kmEditorUuid)
        })
      })
    })
  })
}

// A brand new integration defaults to kind "API" already, so only name/requestUrl
// are set here - the integration-test ("Load") flow, response mapping and the
// collapsed "Advanced Integration Configuration" section all depend on a mock HTTP
// server that isn't actually running in this stack's docker-compose (only an
// allowlist entry exists for it), so those aren't exercised here.
export function addIntegrationToKmEditor() {
  const integrationName = `Test Integration ${Date.now()}`
  const integrationRequestUrl = `https://example.com/api/${Date.now()}`

  createKmEditor().then(({ kmEditorUuid, knowledgeModelUuid }) => {
    addChild(`km-editor-${knowledgeModelUuid}-integrations-add`).then((integrationUuid) => {
      cy.get(`#km-editor-${integrationUuid}-name`).type(integrationName)
      cy.get(`#km-editor-${integrationUuid}-requestUrl`).type(integrationRequestUrl)
      cy.getCy(`km-editor_tree_entity_${integrationUuid}`).should('contain.text', integrationName)

      waitForSave()
      reopen(kmEditorUuid, integrationUuid)
      cy.get(`#km-editor-${integrationUuid}-name`).should('have.value', integrationName)
      cy.get(`#km-editor-${integrationUuid}-requestUrl`).should('have.value', integrationRequestUrl)

      deleteKmEditor(kmEditorUuid)
    })
  })
}

// The question's own "integration" select is keyed by each integration's own uuid as
// the option value (not its name), so it's selected via .select(integrationUuid).
export function addIntegrationQuestion() {
  const integrationName = `Test Integration ${Date.now()}`
  const questionTitle = `Test Integration Question ${Date.now()}`

  createKmEditor().then(({ kmEditorUuid, knowledgeModelUuid }) => {
    addChild(`km-editor-${knowledgeModelUuid}-integrations-add`).then((integrationUuid) => {
      cy.get(`#km-editor-${integrationUuid}-name`).type(integrationName)
      waitForSave()

      // Back to the KM's own root so "+Add chapter" adds a sibling of the
      // integration, not a child of it.
      cy.visitApp(`/knowledge-models/editors/${kmEditorUuid}`)
      addChild(`km-editor-${knowledgeModelUuid}-chapters-add`).then((chapterUuid) => {
        addChild(`km-editor-${chapterUuid}-questions-add`).then((questionUuid) => {
          cy.get(`#km-editor-${questionUuid}-type`).select('Integration')
          cy.get(`#km-editor-${questionUuid}-title`).type(questionTitle)
          cy.get(`#km-editor-${questionUuid}-integration`).select(integrationUuid)
          cy.getCy(`km-editor_tree_entity_${questionUuid}`).should('contain.text', questionTitle)

          waitForSave()
          reopen(kmEditorUuid, questionUuid)
          cy.get(`#km-editor-${questionUuid}-type`).should('have.value', 'Integration')
          cy.get(`#km-editor-${questionUuid}-title`).should('have.value', questionTitle)
          cy.get(`#km-editor-${questionUuid}-integration`).should('have.value', integrationUuid)

          deleteKmEditor(kmEditorUuid)
        })
      })
    })
  })
}

// The ItemSelect question's own "listQuestion" select is keyed by the list
// question's own uuid as the option value (not its title), so it's selected via
// .select(listQuestionUuid).
export function addItemSelectQuestion() {
  const listQuestionTitle = `Test List Question ${Date.now()}`
  const itemSelectQuestionTitle = `Test ItemSelect Question ${Date.now()}`

  createChapter().then(({ kmEditorUuid, chapterUuid }) => {
    addChild(`km-editor-${chapterUuid}-questions-add`).then((listQuestionUuid) => {
      cy.get(`#km-editor-${listQuestionUuid}-type`).select('List')
      cy.get(`#km-editor-${listQuestionUuid}-title`).type(listQuestionTitle)
      waitForSave()

      // Back to the chapter, so the next question is a sibling, not a child of the
      // list question.
      cy.visitApp(`/knowledge-models/editors/${kmEditorUuid}/edit/${chapterUuid}`)

      addChild(`km-editor-${chapterUuid}-questions-add`).then((itemSelectQuestionUuid) => {
        cy.get(`#km-editor-${itemSelectQuestionUuid}-type`).select('ItemSelect')
        cy.get(`#km-editor-${itemSelectQuestionUuid}-title`).type(itemSelectQuestionTitle)
        cy.get(`#km-editor-${itemSelectQuestionUuid}-listQuestion`).select(listQuestionUuid)
        cy.getCy(`km-editor_tree_entity_${itemSelectQuestionUuid}`).should('contain.text', itemSelectQuestionTitle)

        waitForSave()
        reopen(kmEditorUuid, itemSelectQuestionUuid)
        cy.get(`#km-editor-${itemSelectQuestionUuid}-title`).should('have.value', itemSelectQuestionTitle)
        cy.get(`#km-editor-${itemSelectQuestionUuid}-listQuestion`).should('have.value', listQuestionUuid)

        deleteKmEditor(kmEditorUuid)
      })
    })
  })
}

export function addFileQuestion() {
  const questionTitle = `Test File Question ${Date.now()}`
  const fileTypes = '.csv,.xlsx'
  const maxSize = '12000'

  createChapter().then(({ kmEditorUuid, chapterUuid }) => {
    addChild(`km-editor-${chapterUuid}-questions-add`).then((questionUuid) => {
      cy.get(`#km-editor-${questionUuid}-type`).select('File')
      cy.get(`#km-editor-${questionUuid}-title`).type(questionTitle)
      cy.get(`#km-editor-${questionUuid}-fileTypes`).type(fileTypes)
      cy.get(`#km-editor-${questionUuid}-maxSize`).type(maxSize)
      cy.getCy(`km-editor_tree_entity_${questionUuid}`).should('contain.text', questionTitle)

      waitForSave()
      reopen(kmEditorUuid, questionUuid)
      cy.get(`#km-editor-${questionUuid}-title`).should('have.value', questionTitle)
      cy.get(`#km-editor-${questionUuid}-fileTypes`).should('have.value', fileTypes)
      cy.get(`#km-editor-${questionUuid}-maxSize`).should('have.value', maxSize)

      deleteKmEditor(kmEditorUuid)
    })
  })
}
