import { create } from "./project-helpers"

export class Config {
    constructor(childKmId, parentKmId, editorName) {
        this.childKmId = childKmId
        this.parentKmId = parentKmId
        this.editorName = editorName
    }

    getParentKM(version) {
        return `km-migration/dsw_${this.parentKmId}_${version}.json`
    }

    getChildKM(version) {
        return `km-migration/dsw_${this.childKmId}_${version}.json`
    }

    getParentPackageId(version) {
        return `dsw:${this.parentKmId}:${version}`
    }

    getChildPackageId(version) {
        return `dsw:${this.childKmId}:${version}`
    }
}


// 3.6.0 - Integration fields renamed and now using Jinja templating with item property
function updateIntegrationEvent(event) {
    const fields = [
        ['responseItemId', 'responseIdField', true],
        ['responseItemTemplate', 'responseNameField', true],
        ['responseItemUrl', 'itemUrl', false],
    ]

    fields.forEach(([fieldName, oldFieldName, wrapTemplateValue]) => {
        if (event[fieldName] === undefined && event[oldFieldName] !== undefined) {
            event[fieldName] = event[oldFieldName]
            if (wrapTemplateValue) {
                if (event[fieldName].changed && event[fieldName].value) {
                    event[fieldName].value = `{{item.${event[fieldName].value}}}`
                } else {
                    event[fieldName] = `{{item.${event[fieldName]}}}`
                }
            }
        }
    })

    return event
}

// 3.8.0 - requestHeaders changed from dict to list
function updateIntegrationRequestHeaders(event) {
    const updateHeaders = (headers) => {
        return Object.entries(headers).map(([key, value]) => ({ key, value }))
    }

    if (event['requestHeaders']) {
        if (event['requestHeaders'].value && !Array.isArray(event['requestHeaders'].value)) {
            // edit event
            event['requestHeaders'].value = updateHeaders(event['requestHeaders'].value)
        } else if (!Array.isArray(event['requestHeaders'])) {
            // add event
            event['requestHeaders'] = updateHeaders(event['requestHeaders'])
        }
    }

    return event
}

// 3.10.0 - integrationType and requestEmptySearch added
function updateIntegrationEvent2(event) {

    const newFields = [
        ['integrationType', 'ApiIntegration'],
        ['requestEmptySearch', true],
    ]

    if (event.eventType === 'AddIntegrationEvent') {
        newFields.forEach(([fieldName, defaultValue]) => {
            if (event[fieldName] === undefined) {
                event[fieldName] = defaultValue
            }
        })
    } else if (event.eventType === 'EditIntegrationEvent') {
        if (event.integrationType === undefined) {
            event.integrationType = 'ApiIntegration'
        }

        if (event.requestEmptySearch === undefined) {
            event.requestEmptySearch = { changed: false }
        }
    }

    return event
}

// 4.13.0 - validations added to ValueQuestion
function updateValidations(event) {
    const newFields = [
        ['validations', []],
    ]

    if (event.eventType === 'AddQuestionEvent' && event.questionType === 'ValueQuestion') {
        newFields.forEach(([fieldName, defaultValue]) => {
            if (event[fieldName] === undefined) {
                event[fieldName] = defaultValue
            }
        })
    } else if (event.eventType === 'EditQuestionEvent' && event.questionType === 'ValueQuestion') {
        if (event.validations === undefined) {
            event.validations = { changed: false }
        }
    }

    return event
}

// 4.22.0 - New API integration and renamed props to variables
function updatePropsToVariables(event) {
    if (event['props'] !== undefined && event['integrationType'] === 'ApiIntegration') {
        event['integrationType'] = 'ApiLegacyIntegration'
    }

    if (event['variables'] === undefined && event['props'] !== undefined) {
        event['variables'] = event['props']
    }

    return event
}


function updateEventFormat(event) {
    if (event['content'] !== undefined) {
        return event
    }

    const content = { ...event }
    delete content.uuid
    delete content.entityUuid
    delete content.parentUuid
    delete content.createdAt

    return {
        uuid: event.uuid,
        entity_uuid: event.entityUuid,
        parent_uuid: event.parentUuid,
        created_at: event.createdAt,
        content
    }
}

function updateEvent(event) {
    const updates = [
        updateIntegrationEvent,
        updateIntegrationRequestHeaders,
        updateIntegrationEvent2,
        updateValidations,
        updatePropsToVariables,
        updateEventFormat
    ]

    return updates.reduce((acc, update) => update(acc), event)
}

function validateKeyInEventObject(parent, child, key, skipKeys, forceSkip = false) {
    const shouldSkip = forceSkip || skipKeys.includes(key)
    if (!shouldSkip) {
        if (parent[key] === null) {
            cy.wrap(child).its(key).should('be.null')
        } else {
            cy.wrap(child).its(key).should('deep.equal', parent[key])
        }
    }
}

export function verifyPackageWithBundle(packageId, fixtureName, pkgParams, checkEventUuid = true) {
    cy.task('knowledgeModelPackage:get', {
        id: packageId
    }).then(pkg => {
        cy.fixture(fixtureName).then(parentPkgBundle => {
            const parentPkg = parentPkgBundle.packages.filter(innerPkg => innerPkg.id == packageId)[0]
            Object.keys(pkgParams).forEach((key) => {
                cy.wrap(pkg).its(key).should('eq', pkgParams[key])
            })

            cy.wrap(pkg).its('events').should('have.length', parentPkg.events.length)

            pkg.events.forEach((childEvent, index) => {
                const parentEvent = updateEvent(parentPkg.events[index])

                Object.keys(childEvent).forEach((key) => {
                    if (key === 'content') {
                        Object.keys(childEvent.content).forEach((contentKey) => {
                            const skipContentKeys = ['requiredPhaseUuid', 'metricUuids', 'phaseUuids', 'annotations', 'createdAt', 'resourcePageUuid', 'resourceCollectionUuids']
                            validateKeyInEventObject(parentEvent.content, childEvent.content, contentKey, skipContentKeys)
                        })
                    } else {
                        const skipKeys = ['package_id', 'tenant_uuid', 'created_at']
                        const forceSkip = !checkEventUuid && key === 'uuid'
                        validateKeyInEventObject(parentEvent, childEvent, key, skipKeys, forceSkip)
                    }
                })
            })
        })
    })
}

export function verifyChildPackageForMigration(config, newVersion, oldVersion, checkEventUuid = true) {
    verifyPackageWithBundle(
        config.getChildPackageId(newVersion),
        config.getChildKM(newVersion),
        {
            'previous_package_id': config.getChildPackageId(oldVersion),
            'fork_of_package_id': config.getParentPackageId(newVersion)
        },
        checkEventUuid
    )
}

export function finishMigrationAndPublish(major, minor, patch) {
    cy.getCy('km-migration_completed')
    cy.getCy('km-migration_publish-button').click()

    // Wait for KM fields to be filled
    cy.get('#license').invoke('val').should('not.be.empty')

    // Fill fields and submit
    cy.fillFields({
        'version-major': `${major}`,
        'version-minor': `${minor}`,
        'version-patch': `${patch}`
    })
    cy.getCy('km-publish_publish-button').click()

    // Wait until it is published
    cy.get('.DetailPage').should('exist')
}

export function checkMigrationForm(data) {
    cy.get('.card-body .form-group').should('have.length', data.length + 1) // data + annotations
    cy.get('.card-body .form-group').each(($el, index, $list) => {
        if (index < data.length - 1) { // we don't check annotations
            cy.wrap($el).get('.control-label').contains(data[index].label)
            data[index].validate(cy.wrap($el).get('.form-value'))
        }
    })
}

export function createMigration(config, version, parentVersion) {
    prepareChildKmEditor(config, version)
    cy.clickListingItemAction(config.editorName, 'update')

    cy.expectModalOpen('km-editor-update')
    cy.fillFields({
        s_targetPackageId: config.getParentPackageId(parentVersion)
    })
    cy.clickModalAction()
    cy.url().should('contain', 'migration')
}

export function prepareChildKmEditor(config, version) {
    cy.importKM(config.getChildKM(version))
    cy.createKMEditor({
        kmId: config.childKmId,
        name: config.editorName,
        version,
        previousPackageId: config.getChildPackageId(version)
    })
    cy.visitApp('/knowledge-model-editors')
}

export function apply() {
    cy.getCy('km-migration_apply-button').click()
}

export function reject() {
    cy.getCy('km-migration_reject-button').click()
}

export function expectEvent(eventUuid) {
    cy.getCy(`km-migration_event_${eventUuid}`).should('be.visible')
}

export function checkDiffTreeAdded(data) {
    checkDiffTree('ins', data)
}

export function checkDiffTreeEdited(data) {
    checkDiffTree('edited', data)
}

export function checkDiffTreeDeleted(data) {
    checkDiffTree('del', data)
}

export function checkDiffTree(what, data) {
    const elements = cy.getCy(`km-migration_diff-tree-node_${what}`)
    elements.should('have.length', data.length)
    for (let i = 0; i < data.length; i++) {
        elements.eq(i).contains(data[i])
    }
}

export function checkNoChanges() {
    const changes = ['del', '.del', 'ins', '.ins']
    changes.forEach((change) => {
        cy.get(`.card-body ${change}`).should('not.exist')
    })
}
