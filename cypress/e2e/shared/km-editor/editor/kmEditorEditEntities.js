// Edits every kind of KM editor entity (matching kmEditorAddEntities.js's own
// breadth, one function per kind/subtype) two ways: changing a field right after
// creating the entity, and changing a field on an entity inherited from a forked
// package (one function per kind there - subtype coverage isn't needed twice, see
// kmEditorDeleteEntities.js for why). Each edit sets a field to one value, then
// immediately changes it to a different one, to prove the CHANGE persists - not just
// whatever was typed first.
//
// See kmEditorAddEntities.js for the shared conventions this reuses: entity ids
// ("km-editor-<uuid>-<field>"), the knowledge model's own generated uuid (fetched via
// getKnowledgeModelUuid) for root-level add triggers, markdown fields needing the
// mode-switch before typing, and waiting for the saving indicator before reopening/
// forking (debounced saves can otherwise be lost to a hard navigation).

function createKmEditor(kmName, kmId) {
  cy.visitApp('/knowledge-models/editors/create')
  cy.getField('name').type(kmName || `Test KM ${Date.now()}`)
  cy.getField('id').clear().type(kmId || `km-${Date.now()}`)
  cy.getField('versionMajor').clear().type('1')
  cy.getField('versionMinor').clear().type('0')
  cy.getField('versionPatch').clear().type('0')
  cy.getCy('form-submit').click()

  return cy.url()
    .should('match', /\/knowledge-models\/editors\/[0-9a-f-]{36}$/)
    .then((url) => url.split('/').pop())
    .then((kmEditorUuid) => {
      return cy.apiToken().then((token) => {
        return cy.request({
          method: 'GET',
          url: `${Cypress.expose('apiUrl')}/knowledge-model-editors/${kmEditorUuid}`,
          headers: { Authorization: `Bearer ${token}` }
        }).then(({ body }) => ({ kmEditorUuid, knowledgeModelUuid: body.knowledgeModel.uuid }))
      })
    })
}

function addChild(triggerId) {
  cy.get(`#${triggerId}`).click()
  return cy.url()
    .should('match', /\/edit\/[0-9a-f-]{36}$/)
    .then((url) => url.split('/').pop())
}

function typeMarkdown(fieldId, content) {
  cy.getCy('markdown-editor_mode-markdown').click()
  cy.get(`#${fieldId}`).type(content)
}

function waitForSave() {
  cy.wait(1200)
  cy.getCy('saving-indicator').should('not.have.attr', 'data-state', 'saving')
}

function reopen(kmEditorUuid, entityUuid) {
  cy.visitApp(`/knowledge-models/editors/${kmEditorUuid}/edit/${entityUuid}`)
}

function deleteKmEditor(kmEditorUuid) {
  cy.apiToken().then((token) => {
    cy.request({
      method: 'DELETE',
      url: `${Cypress.expose('apiUrl')}/knowledge-model-editors/${kmEditorUuid}`,
      headers: { Authorization: `Bearer ${token}` }
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

function createChapterWithQuestion() {
  return createChapter().then(({ kmEditorUuid, chapterUuid, knowledgeModelUuid }) => {
    return addChild(`km-editor-${chapterUuid}-questions-add`).then((questionUuid) => {
      return { kmEditorUuid, questionUuid, knowledgeModelUuid }
    })
  })
}

// ---- Same-session edits ----

export function editChapterFields() {
  const chapterTitle = `Test Chapter ${Date.now()}`
  const chapterText = `Test chapter text ${Date.now()}`
  const updatedChapterTitle = `Updated Chapter ${Date.now()}`
  const updatedChapterText = `Updated chapter text ${Date.now()}`

  createKmEditor().then(({ kmEditorUuid, knowledgeModelUuid }) => {
    addChild(`km-editor-${knowledgeModelUuid}-chapters-add`).then((chapterUuid) => {
      cy.get(`#km-editor-${chapterUuid}-title`).type(chapterTitle)
      typeMarkdown(`km-editor-${chapterUuid}-text`, chapterText)

      cy.get(`#km-editor-${chapterUuid}-title`).clear().type(updatedChapterTitle)
      cy.get(`#km-editor-${chapterUuid}-text`).clear().type(updatedChapterText)
      cy.getCy(`km-editor_tree_entity_${chapterUuid}`).should('contain.text', updatedChapterTitle)

      waitForSave()
      reopen(kmEditorUuid, chapterUuid)
      cy.get(`#km-editor-${chapterUuid}-title`).should('have.value', updatedChapterTitle)
      cy.get(`#km-editor-${chapterUuid}-text`).should('have.value', updatedChapterText)

      deleteKmEditor(kmEditorUuid)
    })
  })
}

export function editMetricFields() {
  const metricTitle = `Test Metric ${Date.now()}`
  const metricAbbreviation = `M${Date.now()}`
  const metricDescription = `Test metric description ${Date.now()}`
  const updatedMetricTitle = `Updated Metric ${Date.now()}`
  const updatedMetricAbbreviation = `UM${Date.now()}`
  const updatedMetricDescription = `Updated metric description ${Date.now()}`

  createKmEditor().then(({ kmEditorUuid, knowledgeModelUuid }) => {
    addChild(`km-editor-${knowledgeModelUuid}-metrics-add`).then((metricUuid) => {
      cy.get(`#km-editor-${metricUuid}-title`).type(metricTitle)
      cy.get(`#km-editor-${metricUuid}-abbreviation`).type(metricAbbreviation)
      typeMarkdown(`km-editor-${metricUuid}-description`, metricDescription)

      cy.get(`#km-editor-${metricUuid}-title`).clear().type(updatedMetricTitle)
      cy.get(`#km-editor-${metricUuid}-abbreviation`).clear().type(updatedMetricAbbreviation)
      cy.get(`#km-editor-${metricUuid}-description`).clear().type(updatedMetricDescription)
      cy.getCy(`km-editor_tree_entity_${metricUuid}`).should('contain.text', updatedMetricTitle)

      waitForSave()
      reopen(kmEditorUuid, metricUuid)
      cy.get(`#km-editor-${metricUuid}-title`).should('have.value', updatedMetricTitle)
      cy.get(`#km-editor-${metricUuid}-abbreviation`).should('have.value', updatedMetricAbbreviation)
      cy.get(`#km-editor-${metricUuid}-description`).should('have.value', updatedMetricDescription)

      deleteKmEditor(kmEditorUuid)
    })
  })
}

export function editPhaseFields() {
  const phaseTitle = `Test Phase ${Date.now()}`
  const phaseDescription = `Test phase description ${Date.now()}`
  const updatedPhaseTitle = `Updated Phase ${Date.now()}`
  const updatedPhaseDescription = `Updated phase description ${Date.now()}`

  createKmEditor().then(({ kmEditorUuid, knowledgeModelUuid }) => {
    addChild(`km-editor-${knowledgeModelUuid}-phases-add`).then((phaseUuid) => {
      cy.get(`#km-editor-${phaseUuid}-title`).type(phaseTitle)
      cy.get(`#km-editor-${phaseUuid}-description`).type(phaseDescription)

      cy.get(`#km-editor-${phaseUuid}-title`).clear().type(updatedPhaseTitle)
      cy.get(`#km-editor-${phaseUuid}-description`).clear().type(updatedPhaseDescription)
      cy.getCy(`km-editor_tree_entity_${phaseUuid}`).should('contain.text', updatedPhaseTitle)

      waitForSave()
      reopen(kmEditorUuid, phaseUuid)
      cy.get(`#km-editor-${phaseUuid}-title`).should('have.value', updatedPhaseTitle)
      cy.get(`#km-editor-${phaseUuid}-description`).should('have.value', updatedPhaseDescription)

      deleteKmEditor(kmEditorUuid)
    })
  })
}

export function editTagFields() {
  const tagName = `Test Tag ${Date.now()}`
  const tagDescription = `Test tag description ${Date.now()}`
  const tagColor = '#34495e'
  const updatedTagName = `Updated Tag ${Date.now()}`
  const updatedTagDescription = `Updated tag description ${Date.now()}`
  const updatedTagColor = '#e74c3c'

  createKmEditor().then(({ kmEditorUuid, knowledgeModelUuid }) => {
    addChild(`km-editor-${knowledgeModelUuid}-tags-add`).then((tagUuid) => {
      cy.get(`#km-editor-${tagUuid}-name`).type(tagName)
      cy.get(`#km-editor-${tagUuid}-description`).type(tagDescription)
      cy.get(`#km-editor-${tagUuid}-color`).clear().type(tagColor)

      cy.get(`#km-editor-${tagUuid}-name`).clear().type(updatedTagName)
      cy.get(`#km-editor-${tagUuid}-description`).clear().type(updatedTagDescription)
      cy.get(`#km-editor-${tagUuid}-color`).clear().type(updatedTagColor)
      cy.getCy(`km-editor_tree_entity_${tagUuid}`).should('contain.text', updatedTagName)

      waitForSave()
      reopen(kmEditorUuid, tagUuid)
      cy.get(`#km-editor-${tagUuid}-name`).should('have.value', updatedTagName)
      cy.get(`#km-editor-${tagUuid}-description`).should('have.value', updatedTagDescription)
      cy.get(`#km-editor-${tagUuid}-color`).should('have.value', updatedTagColor)

      deleteKmEditor(kmEditorUuid)
    })
  })
}

export function editResourceCollectionFields() {
  const resourceCollectionTitle = `Test Resource Collection ${Date.now()}`
  const updatedResourceCollectionTitle = `Updated Resource Collection ${Date.now()}`

  createKmEditor().then(({ kmEditorUuid, knowledgeModelUuid }) => {
    addChild(`km-editor-${knowledgeModelUuid}-resourceCollections-add`).then((resourceCollectionUuid) => {
      cy.get(`#km-editor-${resourceCollectionUuid}-title`).type(resourceCollectionTitle)

      cy.get(`#km-editor-${resourceCollectionUuid}-title`).clear().type(updatedResourceCollectionTitle)
      cy.getCy(`km-editor_tree_entity_${resourceCollectionUuid}`).should('contain.text', updatedResourceCollectionTitle)

      waitForSave()
      reopen(kmEditorUuid, resourceCollectionUuid)
      cy.get(`#km-editor-${resourceCollectionUuid}-title`).should('have.value', updatedResourceCollectionTitle)

      deleteKmEditor(kmEditorUuid)
    })
  })
}

export function editResourcePageFields() {
  const resourcePageTitle = `Test Resource Page ${Date.now()}`
  const resourcePageContent = `Test resource page content ${Date.now()}`
  const updatedResourcePageTitle = `Updated Resource Page ${Date.now()}`
  const updatedResourcePageContent = `Updated resource page content ${Date.now()}`

  createKmEditor().then(({ kmEditorUuid, knowledgeModelUuid }) => {
    addChild(`km-editor-${knowledgeModelUuid}-resourceCollections-add`).then((resourceCollectionUuid) => {
      addChild(`km-editor-${resourceCollectionUuid}-resourcePages-add`).then((resourcePageUuid) => {
        cy.get(`#km-editor-${resourcePageUuid}-title`).type(resourcePageTitle)
        typeMarkdown(`km-editor-${resourcePageUuid}-content`, resourcePageContent)

        cy.get(`#km-editor-${resourcePageUuid}-title`).clear().type(updatedResourcePageTitle)
        cy.get(`#km-editor-${resourcePageUuid}-content`).clear().type(updatedResourcePageContent)
        cy.getCy(`km-editor_tree_entity_${resourcePageUuid}`).should('contain.text', updatedResourcePageTitle)

        waitForSave()
        reopen(kmEditorUuid, resourcePageUuid)
        cy.get(`#km-editor-${resourcePageUuid}-title`).should('have.value', updatedResourcePageTitle)
        cy.get(`#km-editor-${resourcePageUuid}-content`).should('have.value', updatedResourcePageContent)

        deleteKmEditor(kmEditorUuid)
      })
    })
  })
}

export function editOptionsQuestionFields() {
  const questionTitle = `Test Options Question ${Date.now()}`
  const questionText = 'What is the answer?'
  const updatedQuestionTitle = `Updated Options Question ${Date.now()}`
  const updatedQuestionText = 'What is the real answer?'

  createChapter().then(({ kmEditorUuid, chapterUuid }) => {
    addChild(`km-editor-${chapterUuid}-questions-add`).then((questionUuid) => {
      cy.get(`#km-editor-${questionUuid}-title`).type(questionTitle)
      typeMarkdown(`km-editor-${questionUuid}-text`, questionText)

      cy.get(`#km-editor-${questionUuid}-title`).clear().type(updatedQuestionTitle)
      cy.get(`#km-editor-${questionUuid}-text`).clear().type(updatedQuestionText)
      cy.getCy(`km-editor_tree_entity_${questionUuid}`).should('contain.text', updatedQuestionTitle)

      waitForSave()
      reopen(kmEditorUuid, questionUuid)
      cy.get(`#km-editor-${questionUuid}-type`).should('have.value', 'Options')
      cy.get(`#km-editor-${questionUuid}-title`).should('have.value', updatedQuestionTitle)
      cy.get(`#km-editor-${questionUuid}-text`).should('have.value', updatedQuestionText)

      deleteKmEditor(kmEditorUuid)
    })
  })
}

export function editMultiChoiceQuestionFields() {
  const questionTitle = `Test MultiChoice Question ${Date.now()}`
  const questionText = 'What is the answer?'
  const updatedQuestionTitle = `Updated MultiChoice Question ${Date.now()}`
  const updatedQuestionText = 'What is the real answer?'

  createChapter().then(({ kmEditorUuid, chapterUuid }) => {
    addChild(`km-editor-${chapterUuid}-questions-add`).then((questionUuid) => {
      cy.get(`#km-editor-${questionUuid}-type`).select('MultiChoice')
      cy.get(`#km-editor-${questionUuid}-title`).type(questionTitle)
      typeMarkdown(`km-editor-${questionUuid}-text`, questionText)

      cy.get(`#km-editor-${questionUuid}-title`).clear().type(updatedQuestionTitle)
      cy.get(`#km-editor-${questionUuid}-text`).clear().type(updatedQuestionText)
      cy.getCy(`km-editor_tree_entity_${questionUuid}`).should('contain.text', updatedQuestionTitle)

      waitForSave()
      reopen(kmEditorUuid, questionUuid)
      cy.get(`#km-editor-${questionUuid}-type`).should('have.value', 'MultiChoice')
      cy.get(`#km-editor-${questionUuid}-title`).should('have.value', updatedQuestionTitle)
      cy.get(`#km-editor-${questionUuid}-text`).should('have.value', updatedQuestionText)

      deleteKmEditor(kmEditorUuid)
    })
  })
}

export function editListQuestionFields() {
  const questionTitle = `Test List Question ${Date.now()}`
  const questionText = 'What is the answer?'
  const updatedQuestionTitle = `Updated List Question ${Date.now()}`
  const updatedQuestionText = 'What is the real answer?'

  createChapter().then(({ kmEditorUuid, chapterUuid }) => {
    addChild(`km-editor-${chapterUuid}-questions-add`).then((questionUuid) => {
      cy.get(`#km-editor-${questionUuid}-type`).select('List')
      cy.get(`#km-editor-${questionUuid}-title`).type(questionTitle)
      typeMarkdown(`km-editor-${questionUuid}-text`, questionText)

      cy.get(`#km-editor-${questionUuid}-title`).clear().type(updatedQuestionTitle)
      cy.get(`#km-editor-${questionUuid}-text`).clear().type(updatedQuestionText)
      cy.getCy(`km-editor_tree_entity_${questionUuid}`).should('contain.text', updatedQuestionTitle)

      waitForSave()
      reopen(kmEditorUuid, questionUuid)
      cy.get(`#km-editor-${questionUuid}-type`).should('have.value', 'List')
      cy.get(`#km-editor-${questionUuid}-title`).should('have.value', updatedQuestionTitle)
      cy.get(`#km-editor-${questionUuid}-text`).should('have.value', updatedQuestionText)

      deleteKmEditor(kmEditorUuid)
    })
  })
}

// Also edits valueType itself, from one raw value to another.
export function editValueQuestionFields() {
  const questionTitle = `Test Value Question ${Date.now()}`
  const questionText = 'What is the answer?'
  const updatedQuestionTitle = `Updated Value Question ${Date.now()}`
  const updatedQuestionText = 'What is the real answer?'

  createChapter().then(({ kmEditorUuid, chapterUuid }) => {
    addChild(`km-editor-${chapterUuid}-questions-add`).then((questionUuid) => {
      cy.get(`#km-editor-${questionUuid}-type`).select('Value')
      cy.get(`#km-editor-${questionUuid}-title`).type(questionTitle)
      typeMarkdown(`km-editor-${questionUuid}-text`, questionText)
      cy.get(`#km-editor-${questionUuid}-valueType`).select('NumberQuestionValueType')

      cy.get(`#km-editor-${questionUuid}-title`).clear().type(updatedQuestionTitle)
      cy.get(`#km-editor-${questionUuid}-text`).clear().type(updatedQuestionText)
      cy.get(`#km-editor-${questionUuid}-valueType`).select('StringQuestionValueType')
      cy.getCy(`km-editor_tree_entity_${questionUuid}`).should('contain.text', updatedQuestionTitle)

      waitForSave()
      reopen(kmEditorUuid, questionUuid)
      cy.get(`#km-editor-${questionUuid}-type`).should('have.value', 'Value')
      cy.get(`#km-editor-${questionUuid}-title`).should('have.value', updatedQuestionTitle)
      cy.get(`#km-editor-${questionUuid}-text`).should('have.value', updatedQuestionText)
      cy.get(`#km-editor-${questionUuid}-valueType`).should('have.value', 'StringQuestionValueType')

      deleteKmEditor(kmEditorUuid)
    })
  })
}

export function editAnswerFields() {
  const answerLabel = `Test Answer ${Date.now()}`
  const answerAdvice = `Test answer advice ${Date.now()}`
  const updatedAnswerLabel = `Updated Answer ${Date.now()}`
  const updatedAnswerAdvice = `Updated answer advice ${Date.now()}`

  createChapterWithQuestion().then(({ kmEditorUuid, questionUuid }) => {
    addChild(`km-editor-${questionUuid}-answers-add`).then((answerUuid) => {
      cy.get(`#km-editor-${answerUuid}-label`).type(answerLabel)
      typeMarkdown(`km-editor-${answerUuid}-advice`, answerAdvice)

      cy.get(`#km-editor-${answerUuid}-label`).clear().type(updatedAnswerLabel)
      cy.get(`#km-editor-${answerUuid}-advice`).clear().type(updatedAnswerAdvice)
      cy.getCy(`km-editor_tree_entity_${answerUuid}`).should('contain.text', updatedAnswerLabel)

      waitForSave()
      reopen(kmEditorUuid, answerUuid)
      cy.get(`#km-editor-${answerUuid}-label`).should('have.value', updatedAnswerLabel)
      cy.get(`#km-editor-${answerUuid}-advice`).should('have.value', updatedAnswerAdvice)

      deleteKmEditor(kmEditorUuid)
    })
  })
}

export function editChoiceFields() {
  const choiceLabel = `Test Choice ${Date.now()}`
  const updatedChoiceLabel = `Updated Choice ${Date.now()}`

  createChapter().then(({ kmEditorUuid, chapterUuid }) => {
    addChild(`km-editor-${chapterUuid}-questions-add`).then((questionUuid) => {
      cy.get(`#km-editor-${questionUuid}-type`).select('MultiChoice')

      addChild(`km-editor-${questionUuid}-choices-add`).then((choiceUuid) => {
        cy.get(`#km-editor-${choiceUuid}-label`).type(choiceLabel)

        cy.get(`#km-editor-${choiceUuid}-label`).clear().type(updatedChoiceLabel)
        cy.getCy(`km-editor_tree_entity_${choiceUuid}`).should('contain.text', updatedChoiceLabel)

        waitForSave()
        reopen(kmEditorUuid, choiceUuid)
        cy.get(`#km-editor-${choiceUuid}-label`).should('have.value', updatedChoiceLabel)

        deleteKmEditor(kmEditorUuid)
      })
    })
  })
}

export function editFollowUpQuestionFields() {
  const followUpTitle = `Test Follow-up Question ${Date.now()}`
  const updatedFollowUpTitle = `Updated Follow-up Question ${Date.now()}`

  createChapterWithQuestion().then(({ kmEditorUuid, questionUuid }) => {
    addChild(`km-editor-${questionUuid}-answers-add`).then((answerUuid) => {
      addChild(`km-editor-${answerUuid}-followUps-add`).then((followUpUuid) => {
        cy.get(`#km-editor-${followUpUuid}-title`).type(followUpTitle)

        cy.get(`#km-editor-${followUpUuid}-title`).clear().type(updatedFollowUpTitle)
        cy.getCy(`km-editor_tree_entity_${followUpUuid}`).should('contain.text', updatedFollowUpTitle)

        waitForSave()
        reopen(kmEditorUuid, followUpUuid)
        cy.get(`#km-editor-${followUpUuid}-title`).should('have.value', updatedFollowUpTitle)

        deleteKmEditor(kmEditorUuid)
      })
    })
  })
}

export function editItemQuestionFields() {
  const itemQuestionTitle = `Test Item Question ${Date.now()}`
  const updatedItemQuestionTitle = `Updated Item Question ${Date.now()}`

  createChapter().then(({ kmEditorUuid, chapterUuid }) => {
    addChild(`km-editor-${chapterUuid}-questions-add`).then((listQuestionUuid) => {
      cy.get(`#km-editor-${listQuestionUuid}-type`).select('List')

      addChild(`km-editor-${listQuestionUuid}-itemQuestions-add`).then((itemQuestionUuid) => {
        cy.get(`#km-editor-${itemQuestionUuid}-title`).type(itemQuestionTitle)

        cy.get(`#km-editor-${itemQuestionUuid}-title`).clear().type(updatedItemQuestionTitle)
        cy.getCy(`km-editor_tree_entity_${itemQuestionUuid}`).should('contain.text', updatedItemQuestionTitle)

        waitForSave()
        reopen(kmEditorUuid, itemQuestionUuid)
        cy.get(`#km-editor-${itemQuestionUuid}-title`).should('have.value', updatedItemQuestionTitle)

        deleteKmEditor(kmEditorUuid)
      })
    })
  })
}

export function editExpertFields() {
  const expertName = `Test Expert ${Date.now()}`
  const expertEmail = `expert-${Date.now()}@example.com`
  const updatedExpertName = `Updated Expert ${Date.now()}`
  const updatedExpertEmail = `updated-expert-${Date.now()}@example.com`

  createChapterWithQuestion().then(({ kmEditorUuid, questionUuid }) => {
    addChild(`km-editor-${questionUuid}-experts-add`).then((expertUuid) => {
      cy.get(`#km-editor-${expertUuid}-name`).type(expertName)
      cy.get(`#km-editor-${expertUuid}-email`).type(expertEmail)

      cy.get(`#km-editor-${expertUuid}-name`).clear().type(updatedExpertName)
      cy.get(`#km-editor-${expertUuid}-email`).clear().type(updatedExpertEmail)
      cy.getCy(`km-editor_tree_entity_${expertUuid}`).should('contain.text', updatedExpertName)

      waitForSave()
      reopen(kmEditorUuid, expertUuid)
      cy.get(`#km-editor-${expertUuid}-name`).should('have.value', updatedExpertName)
      cy.get(`#km-editor-${expertUuid}-email`).should('have.value', updatedExpertEmail)

      deleteKmEditor(kmEditorUuid)
    })
  })
}

export function editUrlReferenceFields() {
  const url = 'https://example.com'
  const label = `Test Reference ${Date.now()}`
  const updatedUrl = 'https://example.com/updated'
  const updatedLabel = `Updated Reference ${Date.now()}`

  createChapterWithQuestion().then(({ kmEditorUuid, questionUuid }) => {
    addChild(`km-editor-${questionUuid}-references-add`).then((referenceUuid) => {
      cy.get(`#km-editor-${referenceUuid}-referenceType`).select('URL')
      cy.get(`#km-editor-${referenceUuid}-url`).type(url)
      cy.get(`#km-editor-${referenceUuid}-label`).type(label)

      cy.get(`#km-editor-${referenceUuid}-url`).clear().type(updatedUrl)
      cy.get(`#km-editor-${referenceUuid}-label`).clear().type(updatedLabel)
      cy.getCy(`km-editor_tree_entity_${referenceUuid}`).should('contain.text', updatedLabel)

      waitForSave()
      reopen(kmEditorUuid, referenceUuid)
      cy.get(`#km-editor-${referenceUuid}-referenceType`).should('have.value', 'URL')
      cy.get(`#km-editor-${referenceUuid}-url`).should('have.value', updatedUrl)
      cy.get(`#km-editor-${referenceUuid}-label`).should('have.value', updatedLabel)

      deleteKmEditor(kmEditorUuid)
    })
  })
}

// Two resource pages under one collection, so editing the reference's "resourcePage"
// select has a genuinely different second option to switch to.
export function editResourcePageReferenceFields() {
  const firstResourcePageTitle = `Test Resource Page ${Date.now()}`
  const secondResourcePageTitle = `Updated Resource Page ${Date.now()}`

  createKmEditor().then(({ kmEditorUuid, knowledgeModelUuid }) => {
    addChild(`km-editor-${knowledgeModelUuid}-resourceCollections-add`).then((resourceCollectionUuid) => {
      addChild(`km-editor-${resourceCollectionUuid}-resourcePages-add`).then((firstResourcePageUuid) => {
        cy.get(`#km-editor-${firstResourcePageUuid}-title`).type(firstResourcePageTitle)
        waitForSave()

        cy.visitApp(`/knowledge-models/editors/${kmEditorUuid}/edit/${resourceCollectionUuid}`)
        addChild(`km-editor-${resourceCollectionUuid}-resourcePages-add`).then((secondResourcePageUuid) => {
          cy.get(`#km-editor-${secondResourcePageUuid}-title`).type(secondResourcePageTitle)
          waitForSave()

          cy.visitApp(`/knowledge-models/editors/${kmEditorUuid}`)
          addChild(`km-editor-${knowledgeModelUuid}-chapters-add`).then((chapterUuid) => {
            addChild(`km-editor-${chapterUuid}-questions-add`).then((questionUuid) => {
              addChild(`km-editor-${questionUuid}-references-add`).then((referenceUuid) => {
                cy.get(`#km-editor-${referenceUuid}-referenceType`).select('ResourcePage')
                cy.get(`#km-editor-${referenceUuid}-resourcePage`).select(firstResourcePageUuid)

                cy.get(`#km-editor-${referenceUuid}-resourcePage`).select(secondResourcePageUuid)
                cy.getCy(`km-editor_tree_entity_${referenceUuid}`).should('contain.text', secondResourcePageTitle)

                waitForSave()
                reopen(kmEditorUuid, referenceUuid)
                cy.get(`#km-editor-${referenceUuid}-referenceType`).should('have.value', 'ResourcePage')
                cy.get(`#km-editor-${referenceUuid}-resourcePage`).should('have.value', secondResourcePageUuid)

                deleteKmEditor(kmEditorUuid)
              })
            })
          })
        })
      })
    })
  })
}

// Two target questions, so editing the reference's "targetQuestion" select has a
// genuinely different second option to switch to.
export function editCrossReferenceFields() {
  const firstTargetTitle = `Test Target Question ${Date.now()}`
  const secondTargetTitle = `Updated Target Question ${Date.now()}`
  const description = `Test reference description ${Date.now()}`
  const updatedDescription = `Updated reference description ${Date.now()}`

  createChapterWithQuestion().then(({ kmEditorUuid, questionUuid: firstTargetUuid, knowledgeModelUuid }) => {
    cy.get(`#km-editor-${firstTargetUuid}-title`).type(firstTargetTitle)
    waitForSave()

    cy.visitApp(`/knowledge-models/editors/${kmEditorUuid}`)
    addChild(`km-editor-${knowledgeModelUuid}-chapters-add`).then((secondChapterUuid) => {
      addChild(`km-editor-${secondChapterUuid}-questions-add`).then((secondTargetUuid) => {
        cy.get(`#km-editor-${secondTargetUuid}-title`).type(secondTargetTitle)
        waitForSave()

        cy.visitApp(`/knowledge-models/editors/${kmEditorUuid}`)
        addChild(`km-editor-${knowledgeModelUuid}-chapters-add`).then((thirdChapterUuid) => {
          addChild(`km-editor-${thirdChapterUuid}-questions-add`).then((thirdQuestionUuid) => {
            addChild(`km-editor-${thirdQuestionUuid}-references-add`).then((referenceUuid) => {
              cy.get(`#km-editor-${referenceUuid}-referenceType`).select('Cross')
              cy.get(`#km-editor-${referenceUuid}-targetQuestion`).select(firstTargetUuid)
              cy.get(`#km-editor-${referenceUuid}-description`).type(description)

              cy.get(`#km-editor-${referenceUuid}-targetQuestion`).select(secondTargetUuid)
              cy.get(`#km-editor-${referenceUuid}-description`).clear().type(updatedDescription)
              cy.getCy(`km-editor_tree_entity_${referenceUuid}`).should('contain.text', secondTargetTitle)

              waitForSave()
              reopen(kmEditorUuid, referenceUuid)
              cy.get(`#km-editor-${referenceUuid}-referenceType`).should('have.value', 'Cross')
              cy.get(`#km-editor-${referenceUuid}-targetQuestion`).should('have.value', secondTargetUuid)
              cy.get(`#km-editor-${referenceUuid}-description`).should('have.value', updatedDescription)

              deleteKmEditor(kmEditorUuid)
            })
          })
        })
      })
    })
  })
}

export function editIntegrationFields() {
  const integrationName = `Test Integration ${Date.now()}`
  const integrationRequestUrl = `https://example.com/api/${Date.now()}`
  const updatedIntegrationName = `Updated Integration ${Date.now()}`
  const updatedIntegrationRequestUrl = `https://example.com/api/updated-${Date.now()}`

  createKmEditor().then(({ kmEditorUuid, knowledgeModelUuid }) => {
    addChild(`km-editor-${knowledgeModelUuid}-integrations-add`).then((integrationUuid) => {
      cy.get(`#km-editor-${integrationUuid}-name`).type(integrationName)
      cy.get(`#km-editor-${integrationUuid}-requestUrl`).type(integrationRequestUrl)

      cy.get(`#km-editor-${integrationUuid}-name`).clear().type(updatedIntegrationName)
      cy.get(`#km-editor-${integrationUuid}-requestUrl`).clear().type(updatedIntegrationRequestUrl)
      cy.getCy(`km-editor_tree_entity_${integrationUuid}`).should('contain.text', updatedIntegrationName)

      waitForSave()
      reopen(kmEditorUuid, integrationUuid)
      cy.get(`#km-editor-${integrationUuid}-name`).should('have.value', updatedIntegrationName)
      cy.get(`#km-editor-${integrationUuid}-requestUrl`).should('have.value', updatedIntegrationRequestUrl)

      deleteKmEditor(kmEditorUuid)
    })
  })
}

// Two integrations, so editing the question's "integration" select has a genuinely
// different second option to switch to.
export function editIntegrationQuestionFields() {
  const firstIntegrationName = `Test Integration ${Date.now()}`
  const secondIntegrationName = `Updated Integration ${Date.now()}`
  const questionTitle = `Test Integration Question ${Date.now()}`
  const updatedQuestionTitle = `Updated Integration Question ${Date.now()}`

  createKmEditor().then(({ kmEditorUuid, knowledgeModelUuid }) => {
    addChild(`km-editor-${knowledgeModelUuid}-integrations-add`).then((firstIntegrationUuid) => {
      cy.get(`#km-editor-${firstIntegrationUuid}-name`).type(firstIntegrationName)
      waitForSave()

      cy.visitApp(`/knowledge-models/editors/${kmEditorUuid}`)
      addChild(`km-editor-${knowledgeModelUuid}-integrations-add`).then((secondIntegrationUuid) => {
        cy.get(`#km-editor-${secondIntegrationUuid}-name`).type(secondIntegrationName)
        waitForSave()

        cy.visitApp(`/knowledge-models/editors/${kmEditorUuid}`)
        addChild(`km-editor-${knowledgeModelUuid}-chapters-add`).then((chapterUuid) => {
          addChild(`km-editor-${chapterUuid}-questions-add`).then((questionUuid) => {
            cy.get(`#km-editor-${questionUuid}-type`).select('Integration')
            cy.get(`#km-editor-${questionUuid}-title`).type(questionTitle)
            cy.get(`#km-editor-${questionUuid}-integration`).select(firstIntegrationUuid)

            cy.get(`#km-editor-${questionUuid}-title`).clear().type(updatedQuestionTitle)
            cy.get(`#km-editor-${questionUuid}-integration`).select(secondIntegrationUuid)
            cy.getCy(`km-editor_tree_entity_${questionUuid}`).should('contain.text', updatedQuestionTitle)

            waitForSave()
            reopen(kmEditorUuid, questionUuid)
            cy.get(`#km-editor-${questionUuid}-type`).should('have.value', 'Integration')
            cy.get(`#km-editor-${questionUuid}-title`).should('have.value', updatedQuestionTitle)
            cy.get(`#km-editor-${questionUuid}-integration`).should('have.value', secondIntegrationUuid)

            deleteKmEditor(kmEditorUuid)
          })
        })
      })
    })
  })
}

// Two list questions, so editing the ItemSelect question's "listQuestion" select has
// a genuinely different second option to switch to.
export function editItemSelectQuestionFields() {
  const firstListQuestionTitle = `Test List Question ${Date.now()}`
  const secondListQuestionTitle = `Updated List Question ${Date.now()}`
  const itemSelectQuestionTitle = `Test ItemSelect Question ${Date.now()}`
  const updatedItemSelectQuestionTitle = `Updated ItemSelect Question ${Date.now()}`

  createChapter().then(({ kmEditorUuid, chapterUuid }) => {
    addChild(`km-editor-${chapterUuid}-questions-add`).then((firstListQuestionUuid) => {
      cy.get(`#km-editor-${firstListQuestionUuid}-type`).select('List')
      cy.get(`#km-editor-${firstListQuestionUuid}-title`).type(firstListQuestionTitle)
      waitForSave()

      cy.visitApp(`/knowledge-models/editors/${kmEditorUuid}/edit/${chapterUuid}`)
      addChild(`km-editor-${chapterUuid}-questions-add`).then((secondListQuestionUuid) => {
        cy.get(`#km-editor-${secondListQuestionUuid}-type`).select('List')
        cy.get(`#km-editor-${secondListQuestionUuid}-title`).type(secondListQuestionTitle)
        waitForSave()

        cy.visitApp(`/knowledge-models/editors/${kmEditorUuid}/edit/${chapterUuid}`)
        addChild(`km-editor-${chapterUuid}-questions-add`).then((itemSelectQuestionUuid) => {
          cy.get(`#km-editor-${itemSelectQuestionUuid}-type`).select('ItemSelect')
          cy.get(`#km-editor-${itemSelectQuestionUuid}-title`).type(itemSelectQuestionTitle)
          cy.get(`#km-editor-${itemSelectQuestionUuid}-listQuestion`).select(firstListQuestionUuid)

          cy.get(`#km-editor-${itemSelectQuestionUuid}-title`).clear().type(updatedItemSelectQuestionTitle)
          cy.get(`#km-editor-${itemSelectQuestionUuid}-listQuestion`).select(secondListQuestionUuid)
          cy.getCy(`km-editor_tree_entity_${itemSelectQuestionUuid}`).should('contain.text', updatedItemSelectQuestionTitle)

          waitForSave()
          reopen(kmEditorUuid, itemSelectQuestionUuid)
          cy.get(`#km-editor-${itemSelectQuestionUuid}-title`).should('have.value', updatedItemSelectQuestionTitle)
          cy.get(`#km-editor-${itemSelectQuestionUuid}-listQuestion`).should('have.value', secondListQuestionUuid)

          deleteKmEditor(kmEditorUuid)
        })
      })
    })
  })
}

export function editFileQuestionFields() {
  const questionTitle = `Test File Question ${Date.now()}`
  const fileTypes = '.csv,.xlsx'
  const maxSize = '12000'
  const updatedQuestionTitle = `Updated File Question ${Date.now()}`
  const updatedFileTypes = '.pdf,.docx'
  const updatedMaxSize = '24000'

  createChapter().then(({ kmEditorUuid, chapterUuid }) => {
    addChild(`km-editor-${chapterUuid}-questions-add`).then((questionUuid) => {
      cy.get(`#km-editor-${questionUuid}-type`).select('File')
      cy.get(`#km-editor-${questionUuid}-title`).type(questionTitle)
      cy.get(`#km-editor-${questionUuid}-fileTypes`).type(fileTypes)
      cy.get(`#km-editor-${questionUuid}-maxSize`).type(maxSize)

      cy.get(`#km-editor-${questionUuid}-title`).clear().type(updatedQuestionTitle)
      cy.get(`#km-editor-${questionUuid}-fileTypes`).clear().type(updatedFileTypes)
      // maxSize grows a "≈ x KB" suffix once its value is positive (Widgets.fileSize),
      // which wraps the input in an extra element - clearing it back to "" flips that
      // structure and Elm replaces the input node, so .clear() and .type() must be
      // separate commands here rather than chained off the same (now stale) subject.
      cy.get(`#km-editor-${questionUuid}-maxSize`).clear()
      cy.get(`#km-editor-${questionUuid}-maxSize`).type(updatedMaxSize)
      cy.getCy(`km-editor_tree_entity_${questionUuid}`).should('contain.text', updatedQuestionTitle)

      waitForSave()
      reopen(kmEditorUuid, questionUuid)
      cy.get(`#km-editor-${questionUuid}-title`).should('have.value', updatedQuestionTitle)
      cy.get(`#km-editor-${questionUuid}-fileTypes`).should('have.value', updatedFileTypes)
      cy.get(`#km-editor-${questionUuid}-maxSize`).should('have.value', updatedMaxSize)

      deleteKmEditor(kmEditorUuid)
    })
  })
}

// ---- Edits on an entity inherited from a forked package ----
//
// One test per kind is enough here - see kmEditorDeleteEntities.js for why. Uuids are
// stable across a fork (it continues the same knowledge model, not a copy), so an
// entity created in the base editor can be reached in the forked editor by that same
// uuid.

// Publishes the base editor (from its settings tab, then its own Publish button/
// modal - see kmEditorPublish.js for why not the standalone "/publish" page) and
// forks a new editor from the resulting package.
// Clicking "form-submit" on the settings tab does not itself block navigation while
// its save PUT is in flight, so navigating away immediately can abort it.
// The "form-unsaved" bar stays visible until the save actually succeeds, so that's the
// signal to wait on before leaving the page.
function publishAndFork(baseEditorUuid) {
  waitForSave()

  cy.visitApp(`/knowledge-models/editors/${baseEditorUuid}/settings`)
  cy.getField('versionMajor').clear().type('1')
  cy.getField('versionMinor').clear().type('0')
  cy.getField('versionPatch').clear().type('0')
  cy.getField('license').type('MIT')
  cy.getField('description').type('Published by the KM Editor / edit entities E2E spec.')
  // "readme" is a markdown editor - needs the mode switch before it's typeable.
  cy.getCy('markdown-editor_mode-markdown').click()
  cy.getField('readme').type('# Readme')
  cy.getCy('form-submit').click()
  cy.getCy('form-unsaved').should('have.attr', 'hidden')

  cy.visitApp(`/knowledge-models/editors/${baseEditorUuid}`)
  cy.getCy('km-editor_publish').click()
  cy.getCy('km-editor_publish-modal_confirm').click()

  return cy.url()
    .should('match', /\/knowledge-models\/[0-9a-f-]{36}$/)
    .then((publishedUrl) => {
      const packageUuid = publishedUrl.split('/').pop()

      cy.visitApp(`/knowledge-models/editors/create?selected=${packageUuid}`)
      cy.getField('name').type(`Test KM Fork ${Date.now()}`)
      cy.getField('id').clear().type(`km-fork-${Date.now()}`)
      cy.getField('versionMajor').clear().type('1')
      cy.getField('versionMinor').clear().type('0')
      cy.getField('versionPatch').clear().type('0')
      cy.getCy('form-submit').click()

      return cy.url()
        .should('match', /\/knowledge-models\/editors\/[0-9a-f-]{36}$/)
        .then((forkedEditorUrl) => ({ forkedEditorUuid: forkedEditorUrl.split('/').pop(), packageUuid }))
    })
}

// Deleting the package cascades (DB-level, on its previous_package_uuid FK) to any
// editor forked from it too - deleting the fork separately would just 404.
function cleanupPackage(packageUuid) {
  cy.apiToken().then((token) => {
    cy.request({
      method: 'DELETE',
      url: `${Cypress.expose('apiUrl')}/knowledge-model-packages/${packageUuid}?allVersions=true`,
      headers: { Authorization: `Bearer ${token}` }
    })
  })
}

export function editInheritedChapterFields() {
  const chapterTitle = `Test Inherited Chapter ${Date.now()}`
  const updatedChapterTitle = `Updated Inherited Chapter ${Date.now()}`

  createKmEditor().then(({ kmEditorUuid: baseEditorUuid, knowledgeModelUuid }) => {
    addChild(`km-editor-${knowledgeModelUuid}-chapters-add`).then((chapterUuid) => {
      cy.get(`#km-editor-${chapterUuid}-title`).type(chapterTitle)

      publishAndFork(baseEditorUuid).then(({ forkedEditorUuid, packageUuid }) => {
        cy.visitApp(`/knowledge-models/editors/${forkedEditorUuid}/edit/${chapterUuid}`)
        cy.get(`#km-editor-${chapterUuid}-title`).clear().type(updatedChapterTitle)
        cy.getCy(`km-editor_tree_entity_${chapterUuid}`).should('contain.text', updatedChapterTitle)

        waitForSave()
        reopen(forkedEditorUuid, chapterUuid)
        cy.get(`#km-editor-${chapterUuid}-title`).should('have.value', updatedChapterTitle)

        cleanupPackage(packageUuid)
      })
    })
  })
}

export function editInheritedMetricFields() {
  const metricTitle = `Test Inherited Metric ${Date.now()}`
  const updatedMetricTitle = `Updated Inherited Metric ${Date.now()}`

  createKmEditor().then(({ kmEditorUuid: baseEditorUuid, knowledgeModelUuid }) => {
    addChild(`km-editor-${knowledgeModelUuid}-metrics-add`).then((metricUuid) => {
      cy.get(`#km-editor-${metricUuid}-title`).type(metricTitle)

      publishAndFork(baseEditorUuid).then(({ forkedEditorUuid, packageUuid }) => {
        cy.visitApp(`/knowledge-models/editors/${forkedEditorUuid}/edit/${metricUuid}`)
        cy.get(`#km-editor-${metricUuid}-title`).clear().type(updatedMetricTitle)
        cy.getCy(`km-editor_tree_entity_${metricUuid}`).should('contain.text', updatedMetricTitle)

        waitForSave()
        reopen(forkedEditorUuid, metricUuid)
        cy.get(`#km-editor-${metricUuid}-title`).should('have.value', updatedMetricTitle)

        cleanupPackage(packageUuid)
      })
    })
  })
}

export function editInheritedPhaseFields() {
  const phaseTitle = `Test Inherited Phase ${Date.now()}`
  const updatedPhaseTitle = `Updated Inherited Phase ${Date.now()}`

  createKmEditor().then(({ kmEditorUuid: baseEditorUuid, knowledgeModelUuid }) => {
    addChild(`km-editor-${knowledgeModelUuid}-phases-add`).then((phaseUuid) => {
      cy.get(`#km-editor-${phaseUuid}-title`).type(phaseTitle)

      publishAndFork(baseEditorUuid).then(({ forkedEditorUuid, packageUuid }) => {
        cy.visitApp(`/knowledge-models/editors/${forkedEditorUuid}/edit/${phaseUuid}`)
        cy.get(`#km-editor-${phaseUuid}-title`).clear().type(updatedPhaseTitle)
        cy.getCy(`km-editor_tree_entity_${phaseUuid}`).should('contain.text', updatedPhaseTitle)

        waitForSave()
        reopen(forkedEditorUuid, phaseUuid)
        cy.get(`#km-editor-${phaseUuid}-title`).should('have.value', updatedPhaseTitle)

        cleanupPackage(packageUuid)
      })
    })
  })
}

export function editInheritedTagFields() {
  const tagName = `Test Inherited Tag ${Date.now()}`
  const updatedTagName = `Updated Inherited Tag ${Date.now()}`

  createKmEditor().then(({ kmEditorUuid: baseEditorUuid, knowledgeModelUuid }) => {
    addChild(`km-editor-${knowledgeModelUuid}-tags-add`).then((tagUuid) => {
      cy.get(`#km-editor-${tagUuid}-name`).type(tagName)

      publishAndFork(baseEditorUuid).then(({ forkedEditorUuid, packageUuid }) => {
        cy.visitApp(`/knowledge-models/editors/${forkedEditorUuid}/edit/${tagUuid}`)
        cy.get(`#km-editor-${tagUuid}-name`).clear().type(updatedTagName)
        cy.getCy(`km-editor_tree_entity_${tagUuid}`).should('contain.text', updatedTagName)

        waitForSave()
        reopen(forkedEditorUuid, tagUuid)
        cy.get(`#km-editor-${tagUuid}-name`).should('have.value', updatedTagName)

        cleanupPackage(packageUuid)
      })
    })
  })
}

export function editInheritedResourceCollectionFields() {
  const resourceCollectionTitle = `Test Inherited Resource Collection ${Date.now()}`
  const updatedResourceCollectionTitle = `Updated Inherited Resource Collection ${Date.now()}`

  createKmEditor().then(({ kmEditorUuid: baseEditorUuid, knowledgeModelUuid }) => {
    addChild(`km-editor-${knowledgeModelUuid}-resourceCollections-add`).then((resourceCollectionUuid) => {
      cy.get(`#km-editor-${resourceCollectionUuid}-title`).type(resourceCollectionTitle)

      publishAndFork(baseEditorUuid).then(({ forkedEditorUuid, packageUuid }) => {
        cy.visitApp(`/knowledge-models/editors/${forkedEditorUuid}/edit/${resourceCollectionUuid}`)
        cy.get(`#km-editor-${resourceCollectionUuid}-title`).clear().type(updatedResourceCollectionTitle)
        cy.getCy(`km-editor_tree_entity_${resourceCollectionUuid}`).should('contain.text', updatedResourceCollectionTitle)

        waitForSave()
        reopen(forkedEditorUuid, resourceCollectionUuid)
        cy.get(`#km-editor-${resourceCollectionUuid}-title`).should('have.value', updatedResourceCollectionTitle)

        cleanupPackage(packageUuid)
      })
    })
  })
}

export function editInheritedResourcePageFields() {
  const resourcePageTitle = `Test Inherited Resource Page ${Date.now()}`
  const updatedResourcePageTitle = `Updated Inherited Resource Page ${Date.now()}`

  createKmEditor().then(({ kmEditorUuid: baseEditorUuid, knowledgeModelUuid }) => {
    addChild(`km-editor-${knowledgeModelUuid}-resourceCollections-add`).then((resourceCollectionUuid) => {
      addChild(`km-editor-${resourceCollectionUuid}-resourcePages-add`).then((resourcePageUuid) => {
        cy.get(`#km-editor-${resourcePageUuid}-title`).type(resourcePageTitle)

        publishAndFork(baseEditorUuid).then(({ forkedEditorUuid, packageUuid }) => {
          cy.visitApp(`/knowledge-models/editors/${forkedEditorUuid}/edit/${resourcePageUuid}`)
          cy.get(`#km-editor-${resourcePageUuid}-title`).clear().type(updatedResourcePageTitle)
          cy.getCy(`km-editor_tree_entity_${resourcePageUuid}`).should('contain.text', updatedResourcePageTitle)

          waitForSave()
          reopen(forkedEditorUuid, resourcePageUuid)
          cy.get(`#km-editor-${resourcePageUuid}-title`).should('have.value', updatedResourcePageTitle)

          cleanupPackage(packageUuid)
        })
      })
    })
  })
}

// Default question type (Options) is enough - subtype coverage lives in the
// same-session edit tests above.
export function editInheritedQuestionFields() {
  const questionTitle = `Test Inherited Question ${Date.now()}`
  const updatedQuestionTitle = `Updated Inherited Question ${Date.now()}`

  createKmEditor().then(({ kmEditorUuid: baseEditorUuid, knowledgeModelUuid }) => {
    addChild(`km-editor-${knowledgeModelUuid}-chapters-add`).then((chapterUuid) => {
      addChild(`km-editor-${chapterUuid}-questions-add`).then((questionUuid) => {
        cy.get(`#km-editor-${questionUuid}-title`).type(questionTitle)

        publishAndFork(baseEditorUuid).then(({ forkedEditorUuid, packageUuid }) => {
          cy.visitApp(`/knowledge-models/editors/${forkedEditorUuid}/edit/${questionUuid}`)
          cy.get(`#km-editor-${questionUuid}-title`).clear().type(updatedQuestionTitle)
          cy.getCy(`km-editor_tree_entity_${questionUuid}`).should('contain.text', updatedQuestionTitle)

          waitForSave()
          reopen(forkedEditorUuid, questionUuid)
          cy.get(`#km-editor-${questionUuid}-title`).should('have.value', updatedQuestionTitle)

          cleanupPackage(packageUuid)
        })
      })
    })
  })
}

export function editInheritedAnswerFields() {
  const answerLabel = `Test Inherited Answer ${Date.now()}`
  const updatedAnswerLabel = `Updated Inherited Answer ${Date.now()}`

  createKmEditor().then(({ kmEditorUuid: baseEditorUuid, knowledgeModelUuid }) => {
    addChild(`km-editor-${knowledgeModelUuid}-chapters-add`).then((chapterUuid) => {
      addChild(`km-editor-${chapterUuid}-questions-add`).then((questionUuid) => {
        addChild(`km-editor-${questionUuid}-answers-add`).then((answerUuid) => {
          cy.get(`#km-editor-${answerUuid}-label`).type(answerLabel)

          publishAndFork(baseEditorUuid).then(({ forkedEditorUuid, packageUuid }) => {
            cy.visitApp(`/knowledge-models/editors/${forkedEditorUuid}/edit/${answerUuid}`)
            cy.get(`#km-editor-${answerUuid}-label`).clear().type(updatedAnswerLabel)
            cy.getCy(`km-editor_tree_entity_${answerUuid}`).should('contain.text', updatedAnswerLabel)

            waitForSave()
            reopen(forkedEditorUuid, answerUuid)
            cy.get(`#km-editor-${answerUuid}-label`).should('have.value', updatedAnswerLabel)

            cleanupPackage(packageUuid)
          })
        })
      })
    })
  })
}

export function editInheritedChoiceFields() {
  const choiceLabel = `Test Inherited Choice ${Date.now()}`
  const updatedChoiceLabel = `Updated Inherited Choice ${Date.now()}`

  createKmEditor().then(({ kmEditorUuid: baseEditorUuid, knowledgeModelUuid }) => {
    addChild(`km-editor-${knowledgeModelUuid}-chapters-add`).then((chapterUuid) => {
      addChild(`km-editor-${chapterUuid}-questions-add`).then((questionUuid) => {
        cy.get(`#km-editor-${questionUuid}-type`).select('MultiChoice')

        addChild(`km-editor-${questionUuid}-choices-add`).then((choiceUuid) => {
          cy.get(`#km-editor-${choiceUuid}-label`).type(choiceLabel)

          publishAndFork(baseEditorUuid).then(({ forkedEditorUuid, packageUuid }) => {
            cy.visitApp(`/knowledge-models/editors/${forkedEditorUuid}/edit/${choiceUuid}`)
            cy.get(`#km-editor-${choiceUuid}-label`).clear().type(updatedChoiceLabel)
            cy.getCy(`km-editor_tree_entity_${choiceUuid}`).should('contain.text', updatedChoiceLabel)

            waitForSave()
            reopen(forkedEditorUuid, choiceUuid)
            cy.get(`#km-editor-${choiceUuid}-label`).should('have.value', updatedChoiceLabel)

            cleanupPackage(packageUuid)
          })
        })
      })
    })
  })
}

export function editInheritedFollowUpQuestionFields() {
  const followUpTitle = `Test Inherited Follow-up Question ${Date.now()}`
  const updatedFollowUpTitle = `Updated Inherited Follow-up Question ${Date.now()}`

  createKmEditor().then(({ kmEditorUuid: baseEditorUuid, knowledgeModelUuid }) => {
    addChild(`km-editor-${knowledgeModelUuid}-chapters-add`).then((chapterUuid) => {
      addChild(`km-editor-${chapterUuid}-questions-add`).then((questionUuid) => {
        addChild(`km-editor-${questionUuid}-answers-add`).then((answerUuid) => {
          addChild(`km-editor-${answerUuid}-followUps-add`).then((followUpUuid) => {
            cy.get(`#km-editor-${followUpUuid}-title`).type(followUpTitle)

            publishAndFork(baseEditorUuid).then(({ forkedEditorUuid, packageUuid }) => {
              cy.visitApp(`/knowledge-models/editors/${forkedEditorUuid}/edit/${followUpUuid}`)
              cy.get(`#km-editor-${followUpUuid}-title`).clear().type(updatedFollowUpTitle)
              cy.getCy(`km-editor_tree_entity_${followUpUuid}`).should('contain.text', updatedFollowUpTitle)

              waitForSave()
              reopen(forkedEditorUuid, followUpUuid)
              cy.get(`#km-editor-${followUpUuid}-title`).should('have.value', updatedFollowUpTitle)

              cleanupPackage(packageUuid)
            })
          })
        })
      })
    })
  })
}

export function editInheritedItemQuestionFields() {
  const itemQuestionTitle = `Test Inherited Item Question ${Date.now()}`
  const updatedItemQuestionTitle = `Updated Inherited Item Question ${Date.now()}`

  createKmEditor().then(({ kmEditorUuid: baseEditorUuid, knowledgeModelUuid }) => {
    addChild(`km-editor-${knowledgeModelUuid}-chapters-add`).then((chapterUuid) => {
      addChild(`km-editor-${chapterUuid}-questions-add`).then((listQuestionUuid) => {
        cy.get(`#km-editor-${listQuestionUuid}-type`).select('List')

        addChild(`km-editor-${listQuestionUuid}-itemQuestions-add`).then((itemQuestionUuid) => {
          cy.get(`#km-editor-${itemQuestionUuid}-title`).type(itemQuestionTitle)

          publishAndFork(baseEditorUuid).then(({ forkedEditorUuid, packageUuid }) => {
            cy.visitApp(`/knowledge-models/editors/${forkedEditorUuid}/edit/${itemQuestionUuid}`)
            cy.get(`#km-editor-${itemQuestionUuid}-title`).clear().type(updatedItemQuestionTitle)
            cy.getCy(`km-editor_tree_entity_${itemQuestionUuid}`).should('contain.text', updatedItemQuestionTitle)

            waitForSave()
            reopen(forkedEditorUuid, itemQuestionUuid)
            cy.get(`#km-editor-${itemQuestionUuid}-title`).should('have.value', updatedItemQuestionTitle)

            cleanupPackage(packageUuid)
          })
        })
      })
    })
  })
}

export function editInheritedExpertFields() {
  const expertName = `Test Inherited Expert ${Date.now()}`
  const updatedExpertName = `Updated Inherited Expert ${Date.now()}`

  createKmEditor().then(({ kmEditorUuid: baseEditorUuid, knowledgeModelUuid }) => {
    addChild(`km-editor-${knowledgeModelUuid}-chapters-add`).then((chapterUuid) => {
      addChild(`km-editor-${chapterUuid}-questions-add`).then((questionUuid) => {
        addChild(`km-editor-${questionUuid}-experts-add`).then((expertUuid) => {
          cy.get(`#km-editor-${expertUuid}-name`).type(expertName)

          publishAndFork(baseEditorUuid).then(({ forkedEditorUuid, packageUuid }) => {
            cy.visitApp(`/knowledge-models/editors/${forkedEditorUuid}/edit/${expertUuid}`)
            cy.get(`#km-editor-${expertUuid}-name`).clear().type(updatedExpertName)
            cy.getCy(`km-editor_tree_entity_${expertUuid}`).should('contain.text', updatedExpertName)

            waitForSave()
            reopen(forkedEditorUuid, expertUuid)
            cy.get(`#km-editor-${expertUuid}-name`).should('have.value', updatedExpertName)

            cleanupPackage(packageUuid)
          })
        })
      })
    })
  })
}

// Default reference type (URL) is enough - subtype coverage lives in the
// same-session edit tests above.
export function editInheritedReferenceFields() {
  const label = `Test Inherited Reference ${Date.now()}`
  const updatedLabel = `Updated Inherited Reference ${Date.now()}`

  createKmEditor().then(({ kmEditorUuid: baseEditorUuid, knowledgeModelUuid }) => {
    addChild(`km-editor-${knowledgeModelUuid}-chapters-add`).then((chapterUuid) => {
      addChild(`km-editor-${chapterUuid}-questions-add`).then((questionUuid) => {
        addChild(`km-editor-${questionUuid}-references-add`).then((referenceUuid) => {
          cy.get(`#km-editor-${referenceUuid}-label`).type(label)

          publishAndFork(baseEditorUuid).then(({ forkedEditorUuid, packageUuid }) => {
            cy.visitApp(`/knowledge-models/editors/${forkedEditorUuid}/edit/${referenceUuid}`)
            cy.get(`#km-editor-${referenceUuid}-label`).clear().type(updatedLabel)
            cy.getCy(`km-editor_tree_entity_${referenceUuid}`).should('contain.text', updatedLabel)

            waitForSave()
            reopen(forkedEditorUuid, referenceUuid)
            cy.get(`#km-editor-${referenceUuid}-label`).should('have.value', updatedLabel)

            cleanupPackage(packageUuid)
          })
        })
      })
    })
  })
}

export function editInheritedIntegrationFields() {
  const integrationName = `Test Inherited Integration ${Date.now()}`
  const updatedIntegrationName = `Updated Inherited Integration ${Date.now()}`

  createKmEditor().then(({ kmEditorUuid: baseEditorUuid, knowledgeModelUuid }) => {
    addChild(`km-editor-${knowledgeModelUuid}-integrations-add`).then((integrationUuid) => {
      cy.get(`#km-editor-${integrationUuid}-name`).type(integrationName)

      publishAndFork(baseEditorUuid).then(({ forkedEditorUuid, packageUuid }) => {
        cy.visitApp(`/knowledge-models/editors/${forkedEditorUuid}/edit/${integrationUuid}`)
        cy.get(`#km-editor-${integrationUuid}-name`).clear().type(updatedIntegrationName)
        cy.getCy(`km-editor_tree_entity_${integrationUuid}`).should('contain.text', updatedIntegrationName)

        waitForSave()
        reopen(forkedEditorUuid, integrationUuid)
        cy.get(`#km-editor-${integrationUuid}-name`).should('have.value', updatedIntegrationName)

        cleanupPackage(packageUuid)
      })
    })
  })
}
