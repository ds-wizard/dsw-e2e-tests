describe('Settings / Knowledge Model', () => {
    const orgId = 'dsw'
    const kmId = 'parent-km'


    const openKMVersion = (version) => {
        cy.visitApp(`/knowledge-models/${orgId}:${kmId}:${version}`)
    }

    const expectVersionForbidden = (version) => {
        openKMVersion(version)
        cy.contains('Error').should('exist')
        cy.contains('You do not have permission to view this page.').should('exist')
    }

    const expectVersionAvailable = (version) => {
        openKMVersion(version)
        cy.get('.KnowledgeModels__Detail').should('exist')
    }


    before(() => {
        cy.task('package:delete', { km_id: kmId })
        cy.clearServerCache()

        cy.importKM('km-migration/dsw_parent-km_1.11.0')
    })

    beforeEach(() => {
        cy.putDefaultAppConfig()
    })

    it('public KM - specific version', () => {
        // Should not be available without login
        expectVersionForbidden('1.10.0')

        // Go to admin and set a public questionnaire
        cy.loginAs('admin')
        cy.visitApp('/settings/knowledge-models')
        cy.checkToggle('publicEnabled')
        cy.get('.btn-secondary').contains('Add').click()
        cy.fillFields({
            'publicPackages\\.0\\.orgId': orgId,
            'publicPackages\\.0\\.kmId': kmId,
            'publicPackages\\.0\\.minVersion': '1.10.0',
            'publicPackages\\.0\\.maxVersion': '1.10.0',
        })
        cy.clickBtn('Save')
        cy.logout()

        // Version should be available
        expectVersionAvailable('1.10.0')

        // Other versions should not
        expectVersionForbidden('1.9.0')
        expectVersionForbidden('1.11.0')
    })

    it('public KM - version range', () => {
        // Should not be available without login
        expectVersionForbidden('1.7.0')
        expectVersionForbidden('1.9.0')

        // Go to admin and set a public questionnaire
        cy.loginAs('admin')
        cy.visitApp('/settings/knowledge-models')
        cy.checkToggle('publicEnabled')
        cy.get('.btn-secondary').contains('Add').click()
        cy.fillFields({
            'publicPackages\\.0\\.orgId': orgId,
            'publicPackages\\.0\\.kmId': kmId,
            'publicPackages\\.0\\.minVersion': '1.7.0',
            'publicPackages\\.0\\.maxVersion': '1.9.0',
        })
        cy.clickBtn('Save')
        cy.logout()

        // Versions should be available
        expectVersionAvailable('1.7.0')
        expectVersionAvailable('1.8.0')
        expectVersionAvailable('1.9.0')

        // Other versions should not
        expectVersionForbidden('1.5.0')
        expectVersionForbidden('1.6.0')
        expectVersionForbidden('1.10.0')
        expectVersionForbidden('1.11.0')
    })

    it('public KM - Knowledge Model ID', () => {
        // Should not be available without login
        expectVersionForbidden('1.7.0')
        expectVersionForbidden('1.9.0')

        // Go to admin and set a public questionnaire
        cy.loginAs('admin')
        cy.visitApp('/settings/knowledge-models')
        cy.checkToggle('publicEnabled')
        cy.get('.btn-secondary').contains('Add').click()
        cy.fillFields({
            'publicPackages\\.0\\.orgId': orgId,
            'publicPackages\\.0\\.kmId': kmId
        })
        cy.clickBtn('Save')
        cy.logout()

        // Versions should be available
        expectVersionAvailable('1.1.0')
        expectVersionAvailable('1.4.0')
        expectVersionAvailable('1.7.0')
        expectVersionAvailable('1.11.0')
    })

    it.only('public KM - Organization ID', () => {
        // Should not be available without login
        expectVersionForbidden('1.7.0')
        expectVersionForbidden('1.9.0')

        // Go to admin and set a public questionnaire
        cy.loginAs('admin')
        cy.visitApp('/settings/knowledge-models')
        cy.checkToggle('publicEnabled')
        cy.get('.btn-secondary').contains('Add').click()
        cy.fillFields({
            'publicPackages\\.0\\.orgId': orgId,
        })
        cy.clickBtn('Save')
        cy.logout()

        // Versions should be available
        expectVersionAvailable('1.1.0')
        expectVersionAvailable('1.4.0')
        expectVersionAvailable('1.7.0')
        expectVersionAvailable('1.11.0')
    })

    it('public KM - Multiple Entries', () => {
        // Should not be available without login
        expectVersionForbidden('1.7.0')
        expectVersionForbidden('1.9.0')

        // Go to admin and set a public questionnaire
        cy.loginAs('admin')
        cy.visitApp('/settings/knowledge-models')
        cy.checkToggle('publicEnabled')
        cy.get('.btn-secondary').contains('Add').click()
        cy.get('.btn-secondary').contains('Add').click()
        cy.fillFields({
            'publicPackages\\.0\\.orgId': orgId,
            'publicPackages\\.0\\.kmId': kmId,
            'publicPackages\\.0\\.minVersion': '1.7.0',
            'publicPackages\\.0\\.maxVersion': '1.9.0',
            'publicPackages\\.1\\.orgId': orgId,
            'publicPackages\\.1\\.kmId': kmId,
            'publicPackages\\.1\\.minVersion': '1.2.0',
            'publicPackages\\.1\\.maxVersion': '1.3.0',
        })
        cy.clickBtn('Save')
        cy.logout()

        // Versions should be available
        expectVersionAvailable('1.2.0')
        expectVersionAvailable('1.3.0')
        expectVersionAvailable('1.7.0')
        expectVersionAvailable('1.8.0')
        expectVersionAvailable('1.9.0')


        // Other versions should not
        expectVersionForbidden('1.1.0')
        expectVersionForbidden('1.4.0')
        expectVersionForbidden('1.6.0')
        expectVersionForbidden('1.10.0')
    })
})
