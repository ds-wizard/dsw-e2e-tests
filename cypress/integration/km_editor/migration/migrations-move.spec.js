import * as migration from '../../../support/migration-helpers'

describe('KM Editor Migrations Move', () => {
    const config = new migration.Config(
        'move-child-km',
        'move-parent-km',
        'Child Editor'
    )


    before(() => {
        cy.task('mongo:delete', {
            collection: 'packages',
            args: { kmId: config.parentKmId }
        })
        cy.putDefaultAppConfig()
        cy.clearServerCache()

        cy.fixture(config.getParentKM('1.4.0')).then(cy.importKM)
    })


    beforeEach(() => {
        cy.task('mongo:delete', {
            collection: 'packages',
            args: { kmId: config.childKmId }
        })
        cy.task('mongo:delete', {
            collection: 'branches',
            args: {}
        })
        cy.clearServerCache()

        cy.loginAs('datasteward')
    })


    it('can migrate with applying "move reference"', () => {
        migration.createMigration(config, '1.0.0', '1.1.0')

        cy.contains('Move reference')
        migration.checkNoChanges()
        migration.checkDiffTreeDeleted(['Reference 1.1'])
        migration.checkDiffTreeAdded(['Reference 1.1'])

        cy.clickBtn('Apply')
        migration.finishMigrationAndPublish(1, 1, 0)
        migration.verifyChildPackageForMigration(config, '1.1.0', '1.0.0')
    })

    it('can migrate applying "move expert"', () => {
        migration.createMigration(config, '1.1.0', '1.2.0')

        cy.contains('Move expert')
        migration.checkNoChanges()
        migration.checkDiffTreeDeleted(['Expert 1.1'])
        migration.checkDiffTreeAdded(['Expert 1.1'])

        cy.clickBtn('Apply')
        migration.finishMigrationAndPublish(1, 2, 0)
        migration.verifyChildPackageForMigration(config, '1.2.0', '1.1.0')
    })

    it('can migrate applying "move answer"', () => {
        migration.createMigration(config, '1.2.0', '1.3.0')

        cy.contains('Move answer')
        migration.checkNoChanges()
        migration.checkDiffTreeDeleted(['Answer 1.1'])
        migration.checkDiffTreeAdded(['Answer 1.1'])

        cy.clickBtn('Apply')
        migration.finishMigrationAndPublish(1, 3, 0)
        migration.verifyChildPackageForMigration(config, '1.3.0', '1.2.0')
    })

    it('can migrate applying "move question"', () => {
        migration.createMigration(config, '1.3.0', '1.4.0')

        cy.contains('Move question')
        migration.checkNoChanges()
        migration.checkDiffTreeDeleted(['Question 1'])
        migration.checkDiffTreeAdded(['Question 1'])

        cy.clickBtn('Apply')
        migration.finishMigrationAndPublish(1, 4, 0)
        migration.verifyChildPackageForMigration(config, '1.4.0', '1.3.0')
    })
})