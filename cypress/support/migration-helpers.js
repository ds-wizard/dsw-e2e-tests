import * as packages from './packages-helpers'

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

function normalizeEvent(event) {
    return {
        uuid: event.uuid,
        entityUuid: event.entity_uuid,
        parentUuid: event.parent_uuid,
        createdAt: event.created_at,
        content: event.content
    }
}

export function verifyPackageWithBundle(packageId, fixtureName, pkgParams, checkEventUuid = true) {
    packages.getPackage(packageId)
        .then(pkg => {
            cy.fixture(fixtureName).then(parentPkgBundle => {
                const parentPkg = parentPkgBundle.packages.filter(innerPkg => innerPkg.id == packageId)[0]
                Object.keys(pkgParams).forEach((key) => {
                    cy.wrap(pkg).its(key).should('eq', pkgParams[key])
                })


                const parentEvents = parentPkg.events
                cy.wrap(pkg).its('events').should('have.length', parentEvents.length)

                pkg.events.forEach((childEvent, index) => {
                    const parentEvent = {...parentEvents[index]}
                    childEvent = normalizeEvent(childEvent)

                    Object.keys(childEvent).forEach((key) => {
                        if (key === 'content') {
                            Object.keys(childEvent.content).forEach((contentKey) => {
                                const skipContentKeys = ['requiredPhaseUuid', 'metricUuids', 'phaseUuids', 'annotations', 'createdAt', 'resourcePageUuid', 'resourceCollectionUuids']
                                validateKeyInEventObject(parentEvent.content, childEvent.content, contentKey, skipContentKeys)
                            })
                        } else {
                            const skipKeys = ['createdAt']
                            const forceSkip = !checkEventUuid && key === 'uuid'
                            validateKeyInEventObject(parentEvent, childEvent, key, skipKeys, forceSkip)
                        }
                    })
                })
            })
        })
}

export function verifyChildPackageForMigration(config, newVersion, oldVersion, checkEventUuid = true) {
    packages.getPackageUuid(config.getChildPackageId(oldVersion)).then((previousPackageUuid) => {
        verifyPackageWithBundle(
            config.getChildPackageId(newVersion),
            config.getChildKM(newVersion),
            {
                'previous_package_uuid': previousPackageUuid,
                'fork_of_package_id': config.getParentPackageId(newVersion)
            },
            checkEventUuid
        )
    })
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
    cy.get('.detail').should('exist')
}

export function checkMigrationForm(data) {
    cy.get('.card-body .form-group').should('have.length', data.length + 1) // data + annotations
    cy.get('.card-body .form-group').each(($el, index, $list) => {
        if (index < data.length - 1) { // we don't check annotations
            cy.wrap($el).get('.control-label').contains(data[index].label)
            if (data[index].validate) {
                data[index].validate(cy.wrap($el).get('.form-value'))
            }
        }
    })
}

export function createMigration(config, version, parentVersion) {
    prepareChildKmEditor(config, version)
    cy.clickListingItemAction(config.editorName, 'update')

    cy.expectModalOpen('km-editor-update')

    packages.getPackageUuid(config.getParentPackageId(parentVersion)).then((packageUuid) => {
        cy.fillFields({ s_targetPackageUuid: packageUuid })
    })
    cy.clickModalAction()
    cy.url().should('contain', 'migration')
}

export function prepareChildKmEditor(config, version) {
    cy.importKM(config.getChildKM(version))
    packages.getPackageUuid(config.getChildPackageId(version)).then((packageUuid) => {
        cy.createKMEditor({
            kmId: config.childKmId,
            name: config.editorName,
            version,
            previousPackageUuid: packageUuid
        })
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
