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

export function verifyPackageWithBundle(packageId, fixtureName, pkgParams, checkEventUuid = true) {
    cy.task('package:get', { 
        id: packageId
    }).then(pkg => {
        cy.fixture(fixtureName).then(parentPkgBundle => {
            const parentPkg = parentPkgBundle.packages.filter(innerPkg => {
                return innerPkg.id == packageId
            })[0]
            Object.keys(pkgParams).forEach((key) => {
                cy.wrap(pkg).its(key).should('eq', pkgParams[key])
            })
            cy.wrap(pkg).its('events').should('have.length', parentPkg.events.length)

            pkg.events.forEach((childEvent, index) => {
                Object.keys(childEvent).forEach((key) => {
                    const shouldSkip = (!checkEventUuid && key === 'uuid') || ['requiredPhaseUuid', 'metricUuids', 'phaseUuids', 'annotations'].includes(key)
                    if (!shouldSkip) {
                        cy.wrap(childEvent).its(key).should('deep.equal', updateIntegrationEvent(parentPkg.events[index])[key])
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
    cy.fillFields({
        'version-major': `${major}`,
        'version-minor': `${minor}`,
        'version-patch': `${patch}`
    })
    cy.getCy('km-publish_publish-button').click()
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
    cy.clickListingItemAction(config.editorName, 'upgrade')
    
    cy.expectModalOpen('km-editor-upgrade')
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
        previousPackageId: config.getChildPackageId(version)
    })
    cy.visitApp('/km-editor')
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
    checkDiffTree('added', data)
}

export function checkDiffTreeEdited(data) {
    checkDiffTree('edited', data)
}

export function checkDiffTreeDeleted(data) {
    checkDiffTree('deleted', data)
}

export function checkDiffTree(what, data) {
    const elements = cy.getCy(`km-migration_diff-tree-node_state-${what}`)
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
