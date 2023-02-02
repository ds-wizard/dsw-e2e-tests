import * as migration from '../../../support/migration-helpers'

describe('KM Editor Migrations Multi-Choice', () => {
    const config = new migration.Config(
        'multi-choice-events-child',
        'multi-choice-events-parent',
        'Child Editor'
    )

    before(() => {
        cy.task('package:delete', { km_id: config.parentKmId })
        cy.putDefaultAppConfig()
        cy.clearServerCache()

        cy.importKM(config.getParentKM('1.8.0'))
    })

    beforeEach(() => {
        cy.task('package:delete', { km_id: config.childKmId })
        cy.task('branch:delete')
        cy.clearServerCache()

        cy.loginAs('datasteward')
    })

    // Multi-Choice Question

    it('can migrate with applying "add multi-choice question"', () => {
        migration.createMigration(config, '1.0.0', '1.1.0')

        migration.expectEvent('0a275a4a-5a4e-42b8-be5d-82aea3fc3193')
        migration.checkMigrationForm([{
            label: 'Type',
            validate: (x) => x.get('ins').contains('MultiChoice')
        }, {
            label: 'Title',
            validate: (x) => x.get('ins').contains('Multi-Choice Question 3')
        }, {
            label: 'Text',
            validate: () => {}
        }, {
            label: 'Tags',
            validate: () => {}
        }])
        migration.checkDiffTreeAdded(['Multi-Choice Question 3'])
        migration.apply()

        migration.finishMigrationAndPublish(1, 1, 0)
        migration.verifyChildPackageForMigration(config, '1.1.0', '1.0.0')
    })

    it('can migrate with applying "edit multi-choice question"', () => {
        migration.createMigration(config, '1.1.0', '1.2.0')

        migration.expectEvent('08241653-cf1f-4110-9407-9b9956f4fd6a')
        migration.checkMigrationForm([{
            label: 'Type',
            validate: (x) => x.contains('MultiChoice')
        }, {
            label: 'Title',
            validate: (x) => {
                x.get('del').contains('Multi-Choice Question 3')
                x.get('ins').contains('Another Multi-Choice Question 3')
            }
        }, {
            label: 'Text',
            validate: () => {}
        }, {
            label: 'Tags',
            validate: (x) => x.contains('-')
        }, {
            label: 'Choices',
            validate: (x) => x.contains('-')
        }, {
            label: 'References',
            validate: (x) => x.contains('-')
        }, {
            label: 'Experts',
            'validate': (x) => x.contains('-')
        }])
        migration.checkDiffTreeEdited(['Another Multi-Choice Question 3'])
        migration.apply()

        migration.finishMigrationAndPublish(1, 2, 0)
        migration.verifyChildPackageForMigration(config, '1.2.0', '1.1.0')
    })

    it('can migrate with applying "delete multi-choice question"', () => {
        migration.createMigration(config, '1.2.0', '1.3.0')

        migration.expectEvent('4610ebb1-2745-4758-82d0-918294b1c209')
        migration.checkMigrationForm([{
            label: 'Type',
            validate: (x) => x.get('del').contains('MultiChoice')
        }, {
            label: 'Title',
            validate: (x) => {
                x.get('del').contains('Another Multi-Choice Question 3')
            }
        }, {
            label: 'Text',
            validate: () => {}
        }, {
            label: 'Tags',
            validate: (x) => x.contains('-')
        }, {
            label: 'Choices',
            validate: (x) => x.contains('-')
        }, {
            label: 'References',
            validate: (x) => x.contains('-')
        }, {
            label: 'Experts',
            'validate': (x) => x.contains('-')
        }])
        migration.checkDiffTreeDeleted(['Another Multi-Choice Question 3'])
        migration.apply()
        
        migration.finishMigrationAndPublish(1, 3, 0)
        migration.verifyChildPackageForMigration(config, '1.3.0', '1.2.0')
    })

    it('can migrate with applying "move multi-choice question"', () => {
        migration.createMigration(config, '1.3.0', '1.4.0')

        migration.expectEvent('b83d3e94-2504-4978-8a78-8a2d1c175eff')
        migration.checkNoChanges()
        migration.checkDiffTreeDeleted(['Multi-Choice Question 1'])
        migration.checkDiffTreeAdded(['Multi-Choice Question 1'])
        migration.apply()

        migration.finishMigrationAndPublish(1, 4, 0)
        migration.verifyChildPackageForMigration(config, '1.4.0', '1.3.0')
    })

    // Choice

    it('can migrate with applying "add choice"', () => {
        migration.createMigration(config, '1.4.0', '1.5.0')

        migration.expectEvent('0522e221-6f51-40d4-9c4f-120e6cc5afba')
        migration.checkMigrationForm([{
            label: 'Label',
            validate: (x) => x.get('ins').contains('Choice 2')
        }])
        migration.checkDiffTreeAdded(['Choice 2'])
        migration.apply()
        
        migration.finishMigrationAndPublish(1, 5, 0)
        migration.verifyChildPackageForMigration(config, '1.5.0', '1.4.0')
    })

    it('can migrate with applying "edit choice"', () => {
        migration.createMigration(config, '1.5.0', '1.6.0')

        migration.expectEvent('34958553-92ff-4310-9cf4-23d6f719a017')
        migration.checkMigrationForm([{
            label: 'Label',
            validate: (x) => {
                x.get('del').contains('Choice 2')
                x.get('ins').contains('Another Choice 2')
            }
        }])
        migration.checkDiffTreeEdited(['Another Choice 2'])
        migration.apply()
        
        migration.finishMigrationAndPublish(1, 6, 0)
        migration.verifyChildPackageForMigration(config, '1.6.0', '1.5.0')
    })

    it('can migrate with applying "delete choice"', () => {
        migration.createMigration(config, '1.6.0', '1.7.0')

        migration.expectEvent('d0a1b6df-4bba-4d33-884d-754f585e89c2')
        migration.checkMigrationForm([{
            label: 'Label',
            validate: (x) => x.get('del').contains('Another Choice 2')
        }])
        migration.checkDiffTreeDeleted(['Another Choice 2'])
        migration.apply()
        
        migration.finishMigrationAndPublish(1, 7, 0)
        migration.verifyChildPackageForMigration(config, '1.7.0', '1.6.0')
    })

    it('can migrate with applying "move choice"', () => {
        migration.createMigration(config, '1.7.0', '1.8.0')

        migration.expectEvent('81070c82-0d2a-4d45-a590-127ed7bdc6c2')
        migration.checkNoChanges()
        migration.checkDiffTreeDeleted(['Choice 1'])
        migration.checkDiffTreeAdded(['Choice 1'])
        migration.apply()

        migration.finishMigrationAndPublish(1, 8, 0)
        migration.verifyChildPackageForMigration(config, '1.8.0', '1.7.0')
    })
})