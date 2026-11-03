// Deletion is soft and navigates away - the same navigateToActive machinery used when
// adding moves the URL to the parent's own edit route (the KM's own root, for a
// root-level entity, whose entity uuid is the knowledge model's own generated uuid and
// has no "edit" URL segment of its own).
//
// Whether the deleted entity still shows up in the tree afterwards (disabled, with a
// "Deleted" badge) depends on whether it was added via an event recorded in THIS
// editor's own history, or inherited from a package it was forked from: added-and-
// deleted within the same editor's history is dropped from the tree with no trace,
// but one inherited from a fork stays, marked deleted - covered for every kind below,
// alongside the same-session delete.
//
// One test per entity kind is enough - subtype variation within a kind (different
// question types, reference types, ...) is covered by the add-entity tests instead.
// Uuids are stable across a fork (it continues the same knowledge model, not a copy -
// forking from an already-published package means the fork's own compiled knowledge
// model, Shared.Service.KnowledgeModel.Editor.EditorService.getEditorByUuid, starts
// from that package's already-settled uuid rather than minting a new one), so an
// entity created in the base editor - including the knowledge model's own root uuid -
// can be reached in the forked editor by that same uuid.

function waitForSave() {
  cy.wait(1200)
  cy.getCy('saving-indicator').should('not.have.attr', 'data-state', 'saving')
}

// Resolves to { kmEditorUuid, knowledgeModelUuid } - the knowledge model's own uuid is
// generated per editor (not the editor's own uuid, which keys entities instead), so it
// has to be fetched rather than assumed.
function createKmEditor(kmName, kmId) {
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

// parentUuid is the knowledge model's own uuid for a root-level entity, or the real
// parent entity's own uuid otherwise.
function deleteActiveEntityAndAssertGone(kmEditorUuid, parentUuid, knowledgeModelUuid, entityName) {
  cy.getCy('km-editor_delete').click()
  cy.getCy('km-editor_delete-modal_confirm').click()

  if (parentUuid === knowledgeModelUuid) {
    cy.url().should('match', new RegExp(`/knowledge-models/editors/${kmEditorUuid}$`))
    cy.get('#km-editor-entity').should('contain.text', 'Knowledge Model')
  } else {
    cy.url().should('match', new RegExp(`/knowledge-models/editors/${kmEditorUuid}/edit/${parentUuid}$`))
  }

  // Added and deleted within this same editor's history, so it leaves no trace.
  cy.contains('[data-cy^="km-editor_tree_entity_"]', entityName).should('not.exist')
}

// Publishes the base editor (from its settings tab, then its own Publish button/
// modal - see kmEditorPublish.js for why not the standalone "/publish" page) and forks
// a new editor from the resulting package.
//
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
  cy.getField('description').type('Published by the KM Editor / delete entities E2E spec.')
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

// Reaches the inherited entity directly by its (fork-stable) uuid, deletes it, and
// asserts it stays in the tree marked deleted rather than vanishing.
function deleteInheritedEntityAndAssertMarked(forkedEditorUuid, parentUuid, knowledgeModelUuid, entityUuid, entityName) {
  cy.visitApp(`/knowledge-models/editors/${forkedEditorUuid}/edit/${entityUuid}`)
  cy.getCy('km-editor_delete').click()
  cy.getCy('km-editor_delete-modal_confirm').click()

  if (parentUuid === knowledgeModelUuid) {
    cy.url().should('match', new RegExp(`/knowledge-models/editors/${forkedEditorUuid}$`))
    cy.get('#km-editor-entity').should('contain.text', 'Knowledge Model')
  } else {
    cy.url().should('match', new RegExp(`/knowledge-models/editors/${forkedEditorUuid}/edit/${parentUuid}$`))
  }

  cy.getCy(`km-editor_tree_entity_${entityUuid}`).find('[data-cy="km-editor_tree_badge_deleted"]').should('exist')
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

function cleanupKmEditor(kmEditorUuid) {
  cy.apiToken().then((token) => {
    cy.request({
      method: 'DELETE',
      url: `${Cypress.expose('apiUrl')}/knowledge-model-editors/${kmEditorUuid}`,
      headers: { Authorization: `Bearer ${token}` }
    })
  })
}

export function deleteChapterFromKmEditor() {
  const chapterTitle = `Test Chapter ${Date.now()}`

  createKmEditor(`Test KM ${Date.now()}`, `km-${Date.now()}`).then(({ kmEditorUuid, knowledgeModelUuid }) => {
    addChild(`km-editor-${knowledgeModelUuid}-chapters-add`).then((chapterUuid) => {
      cy.get(`#km-editor-${chapterUuid}-title`).type(chapterTitle)

      deleteActiveEntityAndAssertGone(kmEditorUuid, knowledgeModelUuid, knowledgeModelUuid, chapterTitle)
      cleanupKmEditor(kmEditorUuid)
    })
  })
}

export function deleteMetricFromKmEditor() {
  const metricTitle = `Test Metric ${Date.now()}`

  createKmEditor(`Test KM ${Date.now()}`, `km-${Date.now()}`).then(({ kmEditorUuid, knowledgeModelUuid }) => {
    addChild(`km-editor-${knowledgeModelUuid}-metrics-add`).then((metricUuid) => {
      cy.get(`#km-editor-${metricUuid}-title`).type(metricTitle)

      deleteActiveEntityAndAssertGone(kmEditorUuid, knowledgeModelUuid, knowledgeModelUuid, metricTitle)
      cleanupKmEditor(kmEditorUuid)
    })
  })
}

export function deletePhaseFromKmEditor() {
  const phaseTitle = `Test Phase ${Date.now()}`

  createKmEditor(`Test KM ${Date.now()}`, `km-${Date.now()}`).then(({ kmEditorUuid, knowledgeModelUuid }) => {
    addChild(`km-editor-${knowledgeModelUuid}-phases-add`).then((phaseUuid) => {
      cy.get(`#km-editor-${phaseUuid}-title`).type(phaseTitle)

      deleteActiveEntityAndAssertGone(kmEditorUuid, knowledgeModelUuid, knowledgeModelUuid, phaseTitle)
      cleanupKmEditor(kmEditorUuid)
    })
  })
}

export function deleteTagFromKmEditor() {
  const tagName = `Test Tag ${Date.now()}`

  createKmEditor(`Test KM ${Date.now()}`, `km-${Date.now()}`).then(({ kmEditorUuid, knowledgeModelUuid }) => {
    addChild(`km-editor-${knowledgeModelUuid}-tags-add`).then((tagUuid) => {
      cy.get(`#km-editor-${tagUuid}-name`).type(tagName)

      deleteActiveEntityAndAssertGone(kmEditorUuid, knowledgeModelUuid, knowledgeModelUuid, tagName)
      cleanupKmEditor(kmEditorUuid)
    })
  })
}

export function deleteResourceCollectionFromKmEditor() {
  const resourceCollectionTitle = `Test Resource Collection ${Date.now()}`

  createKmEditor(`Test KM ${Date.now()}`, `km-${Date.now()}`).then(({ kmEditorUuid, knowledgeModelUuid }) => {
    addChild(`km-editor-${knowledgeModelUuid}-resourceCollections-add`).then((resourceCollectionUuid) => {
      cy.get(`#km-editor-${resourceCollectionUuid}-title`).type(resourceCollectionTitle)

      deleteActiveEntityAndAssertGone(kmEditorUuid, knowledgeModelUuid, knowledgeModelUuid, resourceCollectionTitle)
      cleanupKmEditor(kmEditorUuid)
    })
  })
}

export function deleteResourcePageFromKmEditor() {
  const resourcePageTitle = `Test Resource Page ${Date.now()}`

  createKmEditor(`Test KM ${Date.now()}`, `km-${Date.now()}`).then(({ kmEditorUuid, knowledgeModelUuid }) => {
    addChild(`km-editor-${knowledgeModelUuid}-resourceCollections-add`).then((resourceCollectionUuid) => {
      addChild(`km-editor-${resourceCollectionUuid}-resourcePages-add`).then((resourcePageUuid) => {
        cy.get(`#km-editor-${resourcePageUuid}-title`).type(resourcePageTitle)

        deleteActiveEntityAndAssertGone(kmEditorUuid, resourceCollectionUuid, knowledgeModelUuid, resourcePageTitle)
        cleanupKmEditor(kmEditorUuid)
      })
    })
  })
}

// Default question type (Options) is enough - subtype coverage lives in the
// add-entity tests.
export function deleteQuestionFromKmEditor() {
  const questionTitle = `Test Question ${Date.now()}`

  createKmEditor(`Test KM ${Date.now()}`, `km-${Date.now()}`).then(({ kmEditorUuid, knowledgeModelUuid }) => {
    addChild(`km-editor-${knowledgeModelUuid}-chapters-add`).then((chapterUuid) => {
      addChild(`km-editor-${chapterUuid}-questions-add`).then((questionUuid) => {
        cy.get(`#km-editor-${questionUuid}-title`).type(questionTitle)

        deleteActiveEntityAndAssertGone(kmEditorUuid, chapterUuid, knowledgeModelUuid, questionTitle)
        cleanupKmEditor(kmEditorUuid)
      })
    })
  })
}

export function deleteAnswerFromKmEditor() {
  const answerLabel = `Test Answer ${Date.now()}`

  createKmEditor(`Test KM ${Date.now()}`, `km-${Date.now()}`).then(({ kmEditorUuid, knowledgeModelUuid }) => {
    addChild(`km-editor-${knowledgeModelUuid}-chapters-add`).then((chapterUuid) => {
      addChild(`km-editor-${chapterUuid}-questions-add`).then((questionUuid) => {
        addChild(`km-editor-${questionUuid}-answers-add`).then((answerUuid) => {
          cy.get(`#km-editor-${answerUuid}-label`).type(answerLabel)

          deleteActiveEntityAndAssertGone(kmEditorUuid, questionUuid, knowledgeModelUuid, answerLabel)
          cleanupKmEditor(kmEditorUuid)
        })
      })
    })
  })
}

export function deleteChoiceFromKmEditor() {
  const choiceLabel = `Test Choice ${Date.now()}`

  createKmEditor(`Test KM ${Date.now()}`, `km-${Date.now()}`).then(({ kmEditorUuid, knowledgeModelUuid }) => {
    addChild(`km-editor-${knowledgeModelUuid}-chapters-add`).then((chapterUuid) => {
      addChild(`km-editor-${chapterUuid}-questions-add`).then((questionUuid) => {
        cy.get(`#km-editor-${questionUuid}-type`).select('MultiChoice')

        addChild(`km-editor-${questionUuid}-choices-add`).then((choiceUuid) => {
          cy.get(`#km-editor-${choiceUuid}-label`).type(choiceLabel)

          deleteActiveEntityAndAssertGone(kmEditorUuid, questionUuid, knowledgeModelUuid, choiceLabel)
          cleanupKmEditor(kmEditorUuid)
        })
      })
    })
  })
}

export function deleteFollowUpQuestionFromKmEditor() {
  const followUpTitle = `Test Follow-up Question ${Date.now()}`

  createKmEditor(`Test KM ${Date.now()}`, `km-${Date.now()}`).then(({ kmEditorUuid, knowledgeModelUuid }) => {
    addChild(`km-editor-${knowledgeModelUuid}-chapters-add`).then((chapterUuid) => {
      addChild(`km-editor-${chapterUuid}-questions-add`).then((questionUuid) => {
        addChild(`km-editor-${questionUuid}-answers-add`).then((answerUuid) => {
          addChild(`km-editor-${answerUuid}-followUps-add`).then((followUpUuid) => {
            cy.get(`#km-editor-${followUpUuid}-title`).type(followUpTitle)

            deleteActiveEntityAndAssertGone(kmEditorUuid, answerUuid, knowledgeModelUuid, followUpTitle)
            cleanupKmEditor(kmEditorUuid)
          })
        })
      })
    })
  })
}

export function deleteItemQuestionFromKmEditor() {
  const itemQuestionTitle = `Test Item Question ${Date.now()}`

  createKmEditor(`Test KM ${Date.now()}`, `km-${Date.now()}`).then(({ kmEditorUuid, knowledgeModelUuid }) => {
    addChild(`km-editor-${knowledgeModelUuid}-chapters-add`).then((chapterUuid) => {
      addChild(`km-editor-${chapterUuid}-questions-add`).then((listQuestionUuid) => {
        cy.get(`#km-editor-${listQuestionUuid}-type`).select('List')

        addChild(`km-editor-${listQuestionUuid}-itemQuestions-add`).then((itemQuestionUuid) => {
          cy.get(`#km-editor-${itemQuestionUuid}-title`).type(itemQuestionTitle)

          deleteActiveEntityAndAssertGone(kmEditorUuid, listQuestionUuid, knowledgeModelUuid, itemQuestionTitle)
          cleanupKmEditor(kmEditorUuid)
        })
      })
    })
  })
}

export function deleteExpertFromKmEditor() {
  const expertName = `Test Expert ${Date.now()}`

  createKmEditor(`Test KM ${Date.now()}`, `km-${Date.now()}`).then(({ kmEditorUuid, knowledgeModelUuid }) => {
    addChild(`km-editor-${knowledgeModelUuid}-chapters-add`).then((chapterUuid) => {
      addChild(`km-editor-${chapterUuid}-questions-add`).then((questionUuid) => {
        addChild(`km-editor-${questionUuid}-experts-add`).then((expertUuid) => {
          cy.get(`#km-editor-${expertUuid}-name`).type(expertName)

          deleteActiveEntityAndAssertGone(kmEditorUuid, questionUuid, knowledgeModelUuid, expertName)
          cleanupKmEditor(kmEditorUuid)
        })
      })
    })
  })
}

// Default reference type (URL) is enough - subtype coverage lives in the add-entity
// tests.
export function deleteReferenceFromKmEditor() {
  const label = `Test Reference ${Date.now()}`

  createKmEditor(`Test KM ${Date.now()}`, `km-${Date.now()}`).then(({ kmEditorUuid, knowledgeModelUuid }) => {
    addChild(`km-editor-${knowledgeModelUuid}-chapters-add`).then((chapterUuid) => {
      addChild(`km-editor-${chapterUuid}-questions-add`).then((questionUuid) => {
        addChild(`km-editor-${questionUuid}-references-add`).then((referenceUuid) => {
          cy.get(`#km-editor-${referenceUuid}-label`).type(label)

          deleteActiveEntityAndAssertGone(kmEditorUuid, questionUuid, knowledgeModelUuid, label)
          cleanupKmEditor(kmEditorUuid)
        })
      })
    })
  })
}

export function deleteIntegrationFromKmEditor() {
  const integrationName = `Test Integration ${Date.now()}`

  createKmEditor(`Test KM ${Date.now()}`, `km-${Date.now()}`).then(({ kmEditorUuid, knowledgeModelUuid }) => {
    addChild(`km-editor-${knowledgeModelUuid}-integrations-add`).then((integrationUuid) => {
      cy.get(`#km-editor-${integrationUuid}-name`).type(integrationName)

      deleteActiveEntityAndAssertGone(kmEditorUuid, knowledgeModelUuid, knowledgeModelUuid, integrationName)
      cleanupKmEditor(kmEditorUuid)
    })
  })
}

export function deleteInheritedChapterFromKmEditor() {
  const chapterTitle = `Test Inherited Chapter ${Date.now()}`

  createKmEditor(`Test KM ${Date.now()}`, `km-${Date.now()}`).then(({ kmEditorUuid: baseEditorUuid, knowledgeModelUuid }) => {
    addChild(`km-editor-${knowledgeModelUuid}-chapters-add`).then((chapterUuid) => {
      cy.get(`#km-editor-${chapterUuid}-title`).type(chapterTitle)

      publishAndFork(baseEditorUuid).then(({ forkedEditorUuid, packageUuid }) => {
        deleteInheritedEntityAndAssertMarked(forkedEditorUuid, knowledgeModelUuid, knowledgeModelUuid, chapterUuid, chapterTitle)
        cleanupPackage(packageUuid)
      })
    })
  })
}

export function deleteInheritedMetricFromKmEditor() {
  const metricTitle = `Test Inherited Metric ${Date.now()}`

  createKmEditor(`Test KM ${Date.now()}`, `km-${Date.now()}`).then(({ kmEditorUuid: baseEditorUuid, knowledgeModelUuid }) => {
    addChild(`km-editor-${knowledgeModelUuid}-metrics-add`).then((metricUuid) => {
      cy.get(`#km-editor-${metricUuid}-title`).type(metricTitle)

      publishAndFork(baseEditorUuid).then(({ forkedEditorUuid, packageUuid }) => {
        deleteInheritedEntityAndAssertMarked(forkedEditorUuid, knowledgeModelUuid, knowledgeModelUuid, metricUuid, metricTitle)
        cleanupPackage(packageUuid)
      })
    })
  })
}

export function deleteInheritedPhaseFromKmEditor() {
  const phaseTitle = `Test Inherited Phase ${Date.now()}`

  createKmEditor(`Test KM ${Date.now()}`, `km-${Date.now()}`).then(({ kmEditorUuid: baseEditorUuid, knowledgeModelUuid }) => {
    addChild(`km-editor-${knowledgeModelUuid}-phases-add`).then((phaseUuid) => {
      cy.get(`#km-editor-${phaseUuid}-title`).type(phaseTitle)

      publishAndFork(baseEditorUuid).then(({ forkedEditorUuid, packageUuid }) => {
        deleteInheritedEntityAndAssertMarked(forkedEditorUuid, knowledgeModelUuid, knowledgeModelUuid, phaseUuid, phaseTitle)
        cleanupPackage(packageUuid)
      })
    })
  })
}

export function deleteInheritedTagFromKmEditor() {
  const tagName = `Test Inherited Tag ${Date.now()}`

  createKmEditor(`Test KM ${Date.now()}`, `km-${Date.now()}`).then(({ kmEditorUuid: baseEditorUuid, knowledgeModelUuid }) => {
    addChild(`km-editor-${knowledgeModelUuid}-tags-add`).then((tagUuid) => {
      cy.get(`#km-editor-${tagUuid}-name`).type(tagName)

      publishAndFork(baseEditorUuid).then(({ forkedEditorUuid, packageUuid }) => {
        deleteInheritedEntityAndAssertMarked(forkedEditorUuid, knowledgeModelUuid, knowledgeModelUuid, tagUuid, tagName)
        cleanupPackage(packageUuid)
      })
    })
  })
}

export function deleteInheritedResourceCollectionFromKmEditor() {
  const resourceCollectionTitle = `Test Inherited Resource Collection ${Date.now()}`

  createKmEditor(`Test KM ${Date.now()}`, `km-${Date.now()}`).then(({ kmEditorUuid: baseEditorUuid, knowledgeModelUuid }) => {
    addChild(`km-editor-${knowledgeModelUuid}-resourceCollections-add`).then((resourceCollectionUuid) => {
      cy.get(`#km-editor-${resourceCollectionUuid}-title`).type(resourceCollectionTitle)

      publishAndFork(baseEditorUuid).then(({ forkedEditorUuid, packageUuid }) => {
        deleteInheritedEntityAndAssertMarked(
          forkedEditorUuid,
          knowledgeModelUuid,
          knowledgeModelUuid,
          resourceCollectionUuid,
          resourceCollectionTitle
        )
        cleanupPackage(packageUuid)
      })
    })
  })
}

export function deleteInheritedResourcePageFromKmEditor() {
  const resourcePageTitle = `Test Inherited Resource Page ${Date.now()}`

  createKmEditor(`Test KM ${Date.now()}`, `km-${Date.now()}`).then(({ kmEditorUuid: baseEditorUuid, knowledgeModelUuid }) => {
    addChild(`km-editor-${knowledgeModelUuid}-resourceCollections-add`).then((resourceCollectionUuid) => {
      addChild(`km-editor-${resourceCollectionUuid}-resourcePages-add`).then((resourcePageUuid) => {
        cy.get(`#km-editor-${resourcePageUuid}-title`).type(resourcePageTitle)

        publishAndFork(baseEditorUuid).then(({ forkedEditorUuid, packageUuid }) => {
          deleteInheritedEntityAndAssertMarked(forkedEditorUuid, resourceCollectionUuid, knowledgeModelUuid, resourcePageUuid, resourcePageTitle)
          cleanupPackage(packageUuid)
        })
      })
    })
  })
}

export function deleteInheritedQuestionFromKmEditor() {
  const questionTitle = `Test Inherited Question ${Date.now()}`

  createKmEditor(`Test KM ${Date.now()}`, `km-${Date.now()}`).then(({ kmEditorUuid: baseEditorUuid, knowledgeModelUuid }) => {
    addChild(`km-editor-${knowledgeModelUuid}-chapters-add`).then((chapterUuid) => {
      addChild(`km-editor-${chapterUuid}-questions-add`).then((questionUuid) => {
        cy.get(`#km-editor-${questionUuid}-title`).type(questionTitle)

        publishAndFork(baseEditorUuid).then(({ forkedEditorUuid, packageUuid }) => {
          deleteInheritedEntityAndAssertMarked(forkedEditorUuid, chapterUuid, knowledgeModelUuid, questionUuid, questionTitle)
          cleanupPackage(packageUuid)
        })
      })
    })
  })
}

export function deleteInheritedAnswerFromKmEditor() {
  const answerLabel = `Test Inherited Answer ${Date.now()}`

  createKmEditor(`Test KM ${Date.now()}`, `km-${Date.now()}`).then(({ kmEditorUuid: baseEditorUuid, knowledgeModelUuid }) => {
    addChild(`km-editor-${knowledgeModelUuid}-chapters-add`).then((chapterUuid) => {
      addChild(`km-editor-${chapterUuid}-questions-add`).then((questionUuid) => {
        addChild(`km-editor-${questionUuid}-answers-add`).then((answerUuid) => {
          cy.get(`#km-editor-${answerUuid}-label`).type(answerLabel)

          publishAndFork(baseEditorUuid).then(({ forkedEditorUuid, packageUuid }) => {
            deleteInheritedEntityAndAssertMarked(forkedEditorUuid, questionUuid, knowledgeModelUuid, answerUuid, answerLabel)
            cleanupPackage(packageUuid)
          })
        })
      })
    })
  })
}

export function deleteInheritedChoiceFromKmEditor() {
  const choiceLabel = `Test Inherited Choice ${Date.now()}`

  createKmEditor(`Test KM ${Date.now()}`, `km-${Date.now()}`).then(({ kmEditorUuid: baseEditorUuid, knowledgeModelUuid }) => {
    addChild(`km-editor-${knowledgeModelUuid}-chapters-add`).then((chapterUuid) => {
      addChild(`km-editor-${chapterUuid}-questions-add`).then((questionUuid) => {
        cy.get(`#km-editor-${questionUuid}-type`).select('MultiChoice')

        addChild(`km-editor-${questionUuid}-choices-add`).then((choiceUuid) => {
          cy.get(`#km-editor-${choiceUuid}-label`).type(choiceLabel)

          publishAndFork(baseEditorUuid).then(({ forkedEditorUuid, packageUuid }) => {
            deleteInheritedEntityAndAssertMarked(forkedEditorUuid, questionUuid, knowledgeModelUuid, choiceUuid, choiceLabel)
            cleanupPackage(packageUuid)
          })
        })
      })
    })
  })
}

export function deleteInheritedFollowUpQuestionFromKmEditor() {
  const followUpTitle = `Test Inherited Follow-up Question ${Date.now()}`

  createKmEditor(`Test KM ${Date.now()}`, `km-${Date.now()}`).then(({ kmEditorUuid: baseEditorUuid, knowledgeModelUuid }) => {
    addChild(`km-editor-${knowledgeModelUuid}-chapters-add`).then((chapterUuid) => {
      addChild(`km-editor-${chapterUuid}-questions-add`).then((questionUuid) => {
        addChild(`km-editor-${questionUuid}-answers-add`).then((answerUuid) => {
          addChild(`km-editor-${answerUuid}-followUps-add`).then((followUpUuid) => {
            cy.get(`#km-editor-${followUpUuid}-title`).type(followUpTitle)

            publishAndFork(baseEditorUuid).then(({ forkedEditorUuid, packageUuid }) => {
              deleteInheritedEntityAndAssertMarked(forkedEditorUuid, answerUuid, knowledgeModelUuid, followUpUuid, followUpTitle)
              cleanupPackage(packageUuid)
            })
          })
        })
      })
    })
  })
}

export function deleteInheritedItemQuestionFromKmEditor() {
  const itemQuestionTitle = `Test Inherited Item Question ${Date.now()}`

  createKmEditor(`Test KM ${Date.now()}`, `km-${Date.now()}`).then(({ kmEditorUuid: baseEditorUuid, knowledgeModelUuid }) => {
    addChild(`km-editor-${knowledgeModelUuid}-chapters-add`).then((chapterUuid) => {
      addChild(`km-editor-${chapterUuid}-questions-add`).then((listQuestionUuid) => {
        cy.get(`#km-editor-${listQuestionUuid}-type`).select('List')

        addChild(`km-editor-${listQuestionUuid}-itemQuestions-add`).then((itemQuestionUuid) => {
          cy.get(`#km-editor-${itemQuestionUuid}-title`).type(itemQuestionTitle)

          publishAndFork(baseEditorUuid).then(({ forkedEditorUuid, packageUuid }) => {
            deleteInheritedEntityAndAssertMarked(forkedEditorUuid, listQuestionUuid, knowledgeModelUuid, itemQuestionUuid, itemQuestionTitle)
            cleanupPackage(packageUuid)
          })
        })
      })
    })
  })
}

export function deleteInheritedExpertFromKmEditor() {
  const expertName = `Test Inherited Expert ${Date.now()}`

  createKmEditor(`Test KM ${Date.now()}`, `km-${Date.now()}`).then(({ kmEditorUuid: baseEditorUuid, knowledgeModelUuid }) => {
    addChild(`km-editor-${knowledgeModelUuid}-chapters-add`).then((chapterUuid) => {
      addChild(`km-editor-${chapterUuid}-questions-add`).then((questionUuid) => {
        addChild(`km-editor-${questionUuid}-experts-add`).then((expertUuid) => {
          cy.get(`#km-editor-${expertUuid}-name`).type(expertName)

          publishAndFork(baseEditorUuid).then(({ forkedEditorUuid, packageUuid }) => {
            deleteInheritedEntityAndAssertMarked(forkedEditorUuid, questionUuid, knowledgeModelUuid, expertUuid, expertName)
            cleanupPackage(packageUuid)
          })
        })
      })
    })
  })
}

// Default reference type (URL) is enough - subtype coverage lives in the add-entity
// tests.
export function deleteInheritedReferenceFromKmEditor() {
  const label = `Test Inherited Reference ${Date.now()}`

  createKmEditor(`Test KM ${Date.now()}`, `km-${Date.now()}`).then(({ kmEditorUuid: baseEditorUuid, knowledgeModelUuid }) => {
    addChild(`km-editor-${knowledgeModelUuid}-chapters-add`).then((chapterUuid) => {
      addChild(`km-editor-${chapterUuid}-questions-add`).then((questionUuid) => {
        addChild(`km-editor-${questionUuid}-references-add`).then((referenceUuid) => {
          cy.get(`#km-editor-${referenceUuid}-label`).type(label)

          publishAndFork(baseEditorUuid).then(({ forkedEditorUuid, packageUuid }) => {
            deleteInheritedEntityAndAssertMarked(forkedEditorUuid, questionUuid, knowledgeModelUuid, referenceUuid, label)
            cleanupPackage(packageUuid)
          })
        })
      })
    })
  })
}

export function deleteInheritedIntegrationFromKmEditor() {
  const integrationName = `Test Inherited Integration ${Date.now()}`

  createKmEditor(`Test KM ${Date.now()}`, `km-${Date.now()}`).then(({ kmEditorUuid: baseEditorUuid, knowledgeModelUuid }) => {
    addChild(`km-editor-${knowledgeModelUuid}-integrations-add`).then((integrationUuid) => {
      cy.get(`#km-editor-${integrationUuid}-name`).type(integrationName)

      publishAndFork(baseEditorUuid).then(({ forkedEditorUuid, packageUuid }) => {
        deleteInheritedEntityAndAssertMarked(forkedEditorUuid, knowledgeModelUuid, knowledgeModelUuid, integrationUuid, integrationName)
        cleanupPackage(packageUuid)
      })
    })
  })
}
