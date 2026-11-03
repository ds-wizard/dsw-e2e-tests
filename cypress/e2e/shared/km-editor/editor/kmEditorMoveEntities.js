// Move only exists for 5 entity kinds (Common.Pages.KMEditor.Editor.Move's own
// MovingEntity type): question (which also covers follow-up and item questions - both
// are just questions under the hood, moved the same way), answer, choice, reference,
// expert. Every other kind (chapter, metric, phase, tag, resource collection, resource
// page, integration) is reordered in place via the form's own drag list instead, with
// no Move button at all - so there's nothing to test for them here.
//
// The move modal's target tree nodes all share one data-cy, so the target is picked by
// its own visible title via cy.contains() - the sanctioned exception for non-unique
// nodes used elsewhere in these tests. Answer/choice targets must be another question
// of the SAME subtype (Options/MultiChoice); reference/expert can target any question.
//
// To confirm where the moved entity landed, this checks a PARENT's own children list
// (rendered in its edit page's own form body, e.g. a chapter's "Questions" section) by
// uuid, rather than the navigation tree - the tree can be collapsed, so a child's row
// may simply not be in the DOM there even though it does exist.

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

function waitForSave() {
  cy.wait(1200)
  cy.getCy('saving-indicator').should('not.have.attr', 'data-state', 'saving')
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

function childItem(parentUuid, fieldName, childUuid) {
  return `[data-cy="km-editor-${parentUuid}-${fieldName}_item_${childUuid}"]`
}

// Assumes the entity to move is already the active (open) one on the page.
function moveActiveEntityTo(targetTitle) {
  cy.getCy('km-editor_move').click()
  cy.getCy('km-editor_move-modal').within(() => {
    cy.get('[data-cy="km-editor_move-modal_item"]').contains(targetTitle).click()
  })
  cy.getCy('km-editor_move-modal_move').click()
  waitForSave()
}

export function moveQuestionBetweenChapters() {
  const chapterATitle = `Chapter A ${Date.now()}`
  const chapterBTitle = `Chapter B ${Date.now()}`
  const questionTitle = `Movable Question ${Date.now()}`

  createKmEditor().then(({ kmEditorUuid, knowledgeModelUuid }) => {
    addChild(`km-editor-${knowledgeModelUuid}-chapters-add`).then((chapterAUuid) => {
      cy.get(`#km-editor-${chapterAUuid}-title`).type(chapterATitle)

      addChild(`km-editor-${chapterAUuid}-questions-add`).then((questionUuid) => {
        cy.get(`#km-editor-${questionUuid}-title`).type(questionTitle)
        waitForSave()

        cy.visitApp(`/knowledge-models/editors/${kmEditorUuid}`)
        addChild(`km-editor-${knowledgeModelUuid}-chapters-add`).then((chapterBUuid) => {
          cy.get(`#km-editor-${chapterBUuid}-title`).type(chapterBTitle)
          waitForSave()

          cy.visitApp(`/knowledge-models/editors/${kmEditorUuid}/edit/${questionUuid}`)
          moveActiveEntityTo(chapterBTitle)

          cy.visitApp(`/knowledge-models/editors/${kmEditorUuid}/edit/${chapterBUuid}`)
          cy.get(childItem(chapterBUuid, 'questions', questionUuid)).should('exist')

          cy.visitApp(`/knowledge-models/editors/${kmEditorUuid}/edit/${chapterAUuid}`)
          cy.get(childItem(chapterAUuid, 'questions', questionUuid)).should('not.exist')

          deleteKmEditor(kmEditorUuid)
        })
      })
    })
  })
}

export function moveFollowUpQuestionOutOfAnswer() {
  const chapterBTitle = `Chapter B ${Date.now()}`
  const followUpTitle = `Movable Follow-up Question ${Date.now()}`

  createKmEditor().then(({ kmEditorUuid, knowledgeModelUuid }) => {
    addChild(`km-editor-${knowledgeModelUuid}-chapters-add`).then((chapterAUuid) => {
      addChild(`km-editor-${chapterAUuid}-questions-add`).then((questionUuid) => {
        addChild(`km-editor-${questionUuid}-answers-add`).then((answerUuid) => {
          addChild(`km-editor-${answerUuid}-followUps-add`).then((followUpUuid) => {
            cy.get(`#km-editor-${followUpUuid}-title`).type(followUpTitle)
            waitForSave()

            cy.visitApp(`/knowledge-models/editors/${kmEditorUuid}`)
            addChild(`km-editor-${knowledgeModelUuid}-chapters-add`).then((chapterBUuid) => {
              cy.get(`#km-editor-${chapterBUuid}-title`).type(chapterBTitle)
              waitForSave()

              cy.visitApp(`/knowledge-models/editors/${kmEditorUuid}/edit/${followUpUuid}`)
              moveActiveEntityTo(chapterBTitle)

              cy.visitApp(`/knowledge-models/editors/${kmEditorUuid}/edit/${chapterBUuid}`)
              cy.get(childItem(chapterBUuid, 'questions', followUpUuid)).should('exist')

              cy.visitApp(`/knowledge-models/editors/${kmEditorUuid}/edit/${answerUuid}`)
              cy.get(childItem(answerUuid, 'followUps', followUpUuid)).should('not.exist')

              deleteKmEditor(kmEditorUuid)
            })
          })
        })
      })
    })
  })
}

export function moveItemQuestionOutOfListQuestion() {
  const chapterBTitle = `Chapter B ${Date.now()}`
  const itemQuestionTitle = `Movable Item Question ${Date.now()}`

  createKmEditor().then(({ kmEditorUuid, knowledgeModelUuid }) => {
    addChild(`km-editor-${knowledgeModelUuid}-chapters-add`).then((chapterAUuid) => {
      addChild(`km-editor-${chapterAUuid}-questions-add`).then((listQuestionUuid) => {
        cy.get(`#km-editor-${listQuestionUuid}-type`).select('List')

        addChild(`km-editor-${listQuestionUuid}-itemQuestions-add`).then((itemQuestionUuid) => {
          cy.get(`#km-editor-${itemQuestionUuid}-title`).type(itemQuestionTitle)
          waitForSave()

          cy.visitApp(`/knowledge-models/editors/${kmEditorUuid}`)
          addChild(`km-editor-${knowledgeModelUuid}-chapters-add`).then((chapterBUuid) => {
            cy.get(`#km-editor-${chapterBUuid}-title`).type(chapterBTitle)
            waitForSave()

            cy.visitApp(`/knowledge-models/editors/${kmEditorUuid}/edit/${itemQuestionUuid}`)
            moveActiveEntityTo(chapterBTitle)

            cy.visitApp(`/knowledge-models/editors/${kmEditorUuid}/edit/${chapterBUuid}`)
            cy.get(childItem(chapterBUuid, 'questions', itemQuestionUuid)).should('exist')

            cy.visitApp(`/knowledge-models/editors/${kmEditorUuid}/edit/${listQuestionUuid}`)
            cy.get(childItem(listQuestionUuid, 'itemQuestions', itemQuestionUuid)).should('not.exist')

            deleteKmEditor(kmEditorUuid)
          })
        })
      })
    })
  })
}

export function moveAnswerBetweenOptionsQuestions() {
  const sourceQuestionTitle = `Source Question ${Date.now()}`
  const targetQuestionTitle = `Target Question ${Date.now()}`
  const answerLabel = `Movable Answer ${Date.now()}`

  createKmEditor().then(({ kmEditorUuid, knowledgeModelUuid }) => {
    addChild(`km-editor-${knowledgeModelUuid}-chapters-add`).then((chapterUuid) => {
      addChild(`km-editor-${chapterUuid}-questions-add`).then((sourceQuestionUuid) => {
        cy.get(`#km-editor-${sourceQuestionUuid}-title`).type(sourceQuestionTitle)

        addChild(`km-editor-${sourceQuestionUuid}-answers-add`).then((answerUuid) => {
          cy.get(`#km-editor-${answerUuid}-label`).type(answerLabel)
          waitForSave()

          cy.visitApp(`/knowledge-models/editors/${kmEditorUuid}/edit/${chapterUuid}`)
          addChild(`km-editor-${chapterUuid}-questions-add`).then((targetQuestionUuid) => {
            cy.get(`#km-editor-${targetQuestionUuid}-title`).type(targetQuestionTitle)
            waitForSave()

            cy.visitApp(`/knowledge-models/editors/${kmEditorUuid}/edit/${answerUuid}`)
            moveActiveEntityTo(targetQuestionTitle)

            cy.visitApp(`/knowledge-models/editors/${kmEditorUuid}/edit/${targetQuestionUuid}`)
            cy.get(childItem(targetQuestionUuid, 'answers', answerUuid)).should('exist')

            cy.visitApp(`/knowledge-models/editors/${kmEditorUuid}/edit/${sourceQuestionUuid}`)
            cy.get(childItem(sourceQuestionUuid, 'answers', answerUuid)).should('not.exist')

            deleteKmEditor(kmEditorUuid)
          })
        })
      })
    })
  })
}

export function moveChoiceBetweenMultiChoiceQuestions() {
  const sourceQuestionTitle = `Source Question ${Date.now()}`
  const targetQuestionTitle = `Target Question ${Date.now()}`
  const choiceLabel = `Movable Choice ${Date.now()}`

  createKmEditor().then(({ kmEditorUuid, knowledgeModelUuid }) => {
    addChild(`km-editor-${knowledgeModelUuid}-chapters-add`).then((chapterUuid) => {
      addChild(`km-editor-${chapterUuid}-questions-add`).then((sourceQuestionUuid) => {
        cy.get(`#km-editor-${sourceQuestionUuid}-type`).select('MultiChoice')
        cy.get(`#km-editor-${sourceQuestionUuid}-title`).type(sourceQuestionTitle)

        addChild(`km-editor-${sourceQuestionUuid}-choices-add`).then((choiceUuid) => {
          cy.get(`#km-editor-${choiceUuid}-label`).type(choiceLabel)
          waitForSave()

          cy.visitApp(`/knowledge-models/editors/${kmEditorUuid}/edit/${chapterUuid}`)
          addChild(`km-editor-${chapterUuid}-questions-add`).then((targetQuestionUuid) => {
            cy.get(`#km-editor-${targetQuestionUuid}-type`).select('MultiChoice')
            cy.get(`#km-editor-${targetQuestionUuid}-title`).type(targetQuestionTitle)
            waitForSave()

            cy.visitApp(`/knowledge-models/editors/${kmEditorUuid}/edit/${choiceUuid}`)
            moveActiveEntityTo(targetQuestionTitle)

            cy.visitApp(`/knowledge-models/editors/${kmEditorUuid}/edit/${targetQuestionUuid}`)
            cy.get(childItem(targetQuestionUuid, 'choices', choiceUuid)).should('exist')

            cy.visitApp(`/knowledge-models/editors/${kmEditorUuid}/edit/${sourceQuestionUuid}`)
            cy.get(childItem(sourceQuestionUuid, 'choices', choiceUuid)).should('not.exist')

            deleteKmEditor(kmEditorUuid)
          })
        })
      })
    })
  })
}

export function moveReferenceBetweenQuestions() {
  const sourceQuestionTitle = `Source Question ${Date.now()}`
  const targetQuestionTitle = `Target Question ${Date.now()}`
  const referenceLabel = `Movable Reference ${Date.now()}`

  createKmEditor().then(({ kmEditorUuid, knowledgeModelUuid }) => {
    addChild(`km-editor-${knowledgeModelUuid}-chapters-add`).then((chapterUuid) => {
      addChild(`km-editor-${chapterUuid}-questions-add`).then((sourceQuestionUuid) => {
        cy.get(`#km-editor-${sourceQuestionUuid}-title`).type(sourceQuestionTitle)

        addChild(`km-editor-${sourceQuestionUuid}-references-add`).then((referenceUuid) => {
          cy.get(`#km-editor-${referenceUuid}-label`).type(referenceLabel)
          waitForSave()

          cy.visitApp(`/knowledge-models/editors/${kmEditorUuid}/edit/${chapterUuid}`)
          addChild(`km-editor-${chapterUuid}-questions-add`).then((targetQuestionUuid) => {
            cy.get(`#km-editor-${targetQuestionUuid}-title`).type(targetQuestionTitle)
            waitForSave()

            cy.visitApp(`/knowledge-models/editors/${kmEditorUuid}/edit/${referenceUuid}`)
            moveActiveEntityTo(targetQuestionTitle)

            cy.visitApp(`/knowledge-models/editors/${kmEditorUuid}/edit/${targetQuestionUuid}`)
            cy.get(childItem(targetQuestionUuid, 'references', referenceUuid)).should('exist')

            cy.visitApp(`/knowledge-models/editors/${kmEditorUuid}/edit/${sourceQuestionUuid}`)
            cy.get(childItem(sourceQuestionUuid, 'references', referenceUuid)).should('not.exist')

            deleteKmEditor(kmEditorUuid)
          })
        })
      })
    })
  })
}

export function moveExpertBetweenQuestions() {
  const sourceQuestionTitle = `Source Question ${Date.now()}`
  const targetQuestionTitle = `Target Question ${Date.now()}`
  const expertName = `Movable Expert ${Date.now()}`

  createKmEditor().then(({ kmEditorUuid, knowledgeModelUuid }) => {
    addChild(`km-editor-${knowledgeModelUuid}-chapters-add`).then((chapterUuid) => {
      addChild(`km-editor-${chapterUuid}-questions-add`).then((sourceQuestionUuid) => {
        cy.get(`#km-editor-${sourceQuestionUuid}-title`).type(sourceQuestionTitle)

        addChild(`km-editor-${sourceQuestionUuid}-experts-add`).then((expertUuid) => {
          cy.get(`#km-editor-${expertUuid}-name`).type(expertName)
          waitForSave()

          cy.visitApp(`/knowledge-models/editors/${kmEditorUuid}/edit/${chapterUuid}`)
          addChild(`km-editor-${chapterUuid}-questions-add`).then((targetQuestionUuid) => {
            cy.get(`#km-editor-${targetQuestionUuid}-title`).type(targetQuestionTitle)
            waitForSave()

            cy.visitApp(`/knowledge-models/editors/${kmEditorUuid}/edit/${expertUuid}`)
            moveActiveEntityTo(targetQuestionTitle)

            cy.visitApp(`/knowledge-models/editors/${kmEditorUuid}/edit/${targetQuestionUuid}`)
            cy.get(childItem(targetQuestionUuid, 'experts', expertUuid)).should('exist')

            cy.visitApp(`/knowledge-models/editors/${kmEditorUuid}/edit/${sourceQuestionUuid}`)
            cy.get(childItem(sourceQuestionUuid, 'experts', expertUuid)).should('not.exist')

            deleteKmEditor(kmEditorUuid)
          })
        })
      })
    })
  })
}
