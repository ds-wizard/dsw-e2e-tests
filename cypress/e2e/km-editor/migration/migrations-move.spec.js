import * as migration from '../../../support/migration-helpers'

describe('KM Editor Migrations Move', () => {
    const config = new migration.Config(
        'move-child-km',
        'move-parent-km',
        'Child Editor'
    )


    before(() => {
        cy.task('package:delete', { km_id: config.parentKmId })
        cy.putDefaultAppConfig()
        cy.clearServerCache()

        cy.importKM(config.getParentKM('1.4.0'))
    })


    beforeEach(() => {
        cy.task('package:delete', { km_id: config.childKmId })
        cy.task('branch:delete')
        cy.clearServerCache()

        cy.loginAs('datasteward')
    })


    it('can migrate with applying "move reference"', () => {
        migration.createMigration(config, '1.0.0', '1.1.0')

        migration.expectEvent('c0561ae4-bfa0-421f-937e-0b6a65f919a3')
        migration.checkNoChanges()
        migration.checkDiffTreeDeleted(['Reference 1.1'])
        migration.checkDiffTreeAdded(['Reference 1.1'])
        migration.apply()

        migration.finishMigrationAndPublish(1, 1, 0)
        migration.verifyChildPackageForMigration(config, '1.1.0', '1.0.0')
    })

    it('can migrate applying "move expert"', () => {
        migration.createMigration(config, '1.1.0', '1.2.0')

        migration.expectEvent('1604a30b-e2fe-49c5-88cc-b9e9dc3857c5')
        migration.checkNoChanges()
        migration.checkDiffTreeDeleted(['Expert 1.1'])
        migration.checkDiffTreeAdded(['Expert 1.1'])
        migration.apply()

        migration.finishMigrationAndPublish(1, 2, 0)
        migration.verifyChildPackageForMigration(config, '1.2.0', '1.1.0')
    })

    it('can migrate applying "move answer"', () => {
        migration.createMigration(config, '1.2.0', '1.3.0')

        migration.expectEvent('33578d69-2e82-4229-8969-39b246b698a4')
        migration.checkNoChanges()
        migration.checkDiffTreeDeleted(['Answer 1.1'])
        migration.checkDiffTreeAdded(['Answer 1.1'])
        migration.apply()

        migration.finishMigrationAndPublish(1, 3, 0)
        migration.verifyChildPackageForMigration(config, '1.3.0', '1.2.0')
    })

    it('can migrate applying "move question"', () => {
        migration.createMigration(config, '1.3.0', '1.4.0')

        migration.expectEvent('8add1939-a2e9-4131-a285-d209a061a0a6')
        migration.checkNoChanges()
        migration.checkDiffTreeDeleted(['Question 1'])
        migration.checkDiffTreeAdded(['Question 1'])
        migration.apply()

        migration.finishMigrationAndPublish(1, 4, 0)
        migration.verifyChildPackageForMigration(config, '1.4.0', '1.3.0')
    })
})
