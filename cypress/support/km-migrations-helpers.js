export const childKmId = 'child-km'
export const parentKmId = 'parent-km'
export const editorName = 'Child KM'
export const getParentKM = (version) => `km-migration/dsw_${parentKmId}_${version}.json`
export const getChildKM = (version) => `km-migration/dsw_${childKmId}_${version}.json`
export const getParentPackageId = (version) => `dsw:${parentKmId}:${version}`
export const getChildPackageId = (version) => `dsw:${childKmId}:${version}`

export function verifyPackageWithBundle(packageId, fixtureName, pkgParams) {
  cy.task('mongo:findOne', {
      collection: 'packages',
      args: { id: packageId }
  }).then(pkg => {
      cy.fixture(fixtureName).then(parentPkgBundle => {
          const parentPkg = parentPkgBundle.packages.filter(innerPkg => {
              return innerPkg.id == packageId
          })[0]
          Object.keys(pkgParams).forEach((key) => {
            cy.wrap(pkg).its(key).should('be', pkgParams[key])
          })
          cy.wrap(pkg).its('events').should('have.length', parentPkg.events.length)

          pkg.events.forEach((childEvent, index) => {
              Object.keys(parentPkg.events[index]).forEach((key) => {
                  cy.wrap(childEvent).its(key).should('be', parentPkg.events[index][key])
              })
          })
      })
  })
}

export function verifyChildPackageForMigration(newVersion, oldVersion) {
    verifyPackageWithBundle(
        getChildPackageId(newVersion),
        getChildKM(newVersion),
        {
            'previousPackageId': getChildPackageId(oldVersion),
            'forkOfPackageId': getParentPackageId(newVersion)
        }
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

export function createMigration(version, parentVersion) {
    prepareChildKmEditor(version)
    cy.clickListingItemAction(editorName, 'Upgrade')
    cy.get('#targetPackageId').select(getParentPackageId(parentVersion))
    cy.get('.modal-dialog .btn').filter(':visible').contains('Create').click()
}

export function prepareChildKmEditor(version) {
    cy.fixture(getChildKM(version)).then((km) => {
        cy.importKM(km)
    })
    cy.createKMEditor({ kmId: childKmId, name: editorName, previousPackageId: getChildPackageId(version) })
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
