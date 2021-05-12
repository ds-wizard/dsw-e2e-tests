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

        cy.contains('Add question')
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
        
        cy.clickBtn('Apply')
        migration.finishMigrationAndPublish(1, 1, 0)
        migration.verifyChildPackageForMigration(config, '1.1.0', '1.0.0')
    })

    it('can migrate with applying "edit multi-choice question"', () => {
        migration.createMigration(config, '1.1.0', '1.2.0')

        cy.contains('Edit question')
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
        
        cy.clickBtn('Apply')
        migration.finishMigrationAndPublish(1, 2, 0)
        migration.verifyChildPackageForMigration(config, '1.2.0', '1.1.0')
    })

    it('can migrate with applying "delete multi-choice question"', () => {
        migration.createMigration(config, '1.2.0', '1.3.0')

        cy.contains('Delete question')
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
        
        cy.clickBtn('Apply')
        migration.finishMigrationAndPublish(1, 3, 0)
        migration.verifyChildPackageForMigration(config, '1.3.0', '1.2.0')
    })

    it('can migrate with applying "move multi-choice question"', () => {
        migration.createMigration(config, '1.3.0', '1.4.0')

        cy.contains('Move question')
        migration.checkNoChanges()
        migration.checkDiffTreeDeleted(['Multi-Choice Question 1'])
        migration.checkDiffTreeAdded(['Multi-Choice Question 1'])

        cy.clickBtn('Apply')
        migration.finishMigrationAndPublish(1, 4, 0)
        migration.verifyChildPackageForMigration(config, '1.4.0', '1.3.0')
    })

    // Choice

    it('can migrate with applying "add choice"', () => {
        migration.createMigration(config, '1.4.0', '1.5.0')

        cy.contains('Add choice')
        migration.checkMigrationForm([{
            label: 'Label',
            validate: (x) => x.get('ins').contains('Choice 2')
        }])
        migration.checkDiffTreeAdded(['Choice 2'])
        
        cy.clickBtn('Apply')
        migration.finishMigrationAndPublish(1, 5, 0)
        migration.verifyChildPackageForMigration(config, '1.5.0', '1.4.0')
    })

    it('can migrate with applying "edit choice"', () => {
        migration.createMigration(config, '1.5.0', '1.6.0')

        cy.contains('Edit choice')
        migration.checkMigrationForm([{
            label: 'Label',
            validate: (x) => {
                x.get('del').contains('Choice 2')
                x.get('ins').contains('Another Choice 2')
            }
        }])
        migration.checkDiffTreeEdited(['Another Choice 2'])
        
        cy.clickBtn('Apply')
        migration.finishMigrationAndPublish(1, 6, 0)
        migration.verifyChildPackageForMigration(config, '1.6.0', '1.5.0')
    })

    it('can migrate with applying "delete choice"', () => {
        migration.createMigration(config, '1.6.0', '1.7.0')

        cy.contains('Delete choice')
        migration.checkMigrationForm([{
            label: 'Label',
            validate: (x) => x.get('del').contains('Another Choice 2')
        }])
        migration.checkDiffTreeDeleted(['Another Choice 2'])
        
        cy.clickBtn('Apply')
        migration.finishMigrationAndPublish(1, 7, 0)
        migration.verifyChildPackageForMigration(config, '1.7.0', '1.6.0')
    })

    it('can migrate with applying "move choice"', () => {
        migration.createMigration(config, '1.7.0', '1.8.0')

        cy.contains('Move choice')
        migration.checkNoChanges()
        migration.checkDiffTreeDeleted(['Choice 1'])
        migration.checkDiffTreeAdded(['Choice 1'])

        cy.clickBtn('Apply')
        migration.finishMigrationAndPublish(1, 8, 0)
        migration.verifyChildPackageForMigration(config, '1.8.0', '1.7.0')
    })
})