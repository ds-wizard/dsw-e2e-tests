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

export function verifyPackageWithBundle(packageId, fixtureName, pkgParams, checkEventUuid = true) {
    cy.task('mongo:findOne', {
        collection: 'packages',
        args: { id: packageId }
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
                Object.keys(parentPkg.events[index]).forEach((key) => {
                    const shouldSkip = !checkEventUuid && key === 'uuid'
                    if (!shouldSkip) {
                        cy.wrap(childEvent).its(key).should('deep.equal', parentPkg.events[index][key])
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
            'previousPackageId': config.getChildPackageId(oldVersion),
            'forkOfPackageId': config.getParentPackageId(newVersion)
        },
        checkEventUuid
    )
}

export function finishMigrationAndPublish(major, minor, patch) {
    cy.contains('Migration successfully completed.')
    cy.clickBtn('Publish') // no more migrations
    cy.get('.version-inputs input:nth-child(1)').type(major)
    cy.get('.version-inputs input:nth-child(2)').type(minor)
    cy.get('.version-inputs input:nth-child(3)').type(patch)
    cy.clickBtn('Publish') // finish migration
}

export function checkMigrationForm(data) {
    cy.get('.card-body .form-group').should('have.length', data.length)
    cy.get('.card-body .form-group').each(($el, index, $list) => {
        cy.wrap($el).get('.control-label').contains(data[index].label)
        data[index].validate(cy.wrap($el).get('.form-value'))
    })
}

export function createMigration(config, version, parentVersion) {
    prepareChildKmEditor(config, version)
    cy.clickListingItemAction(config.editorName, 'Upgrade')
    cy.get('#targetPackageId').select(config.getParentPackageId(parentVersion))
    cy.get('.modal-dialog .btn').filter(':visible').contains('Create').click()
    cy.url().should('contain', 'migration')
}

export function prepareChildKmEditor(config, version) {
    cy.fixture(config.getChildKM(version)).then(cy.importKM)
    cy.createKMEditor({
        kmId: config.childKmId,
        name: config.editorName,
        previousPackageId: config.getChildPackageId(version)
    })
    cy.visitApp('/km-editor')
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
    const elements = cy.get('.diff-tree').get(`.state-${what}`)
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
