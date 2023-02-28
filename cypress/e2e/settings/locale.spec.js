describe('Locale', () => {
    before(() => {
        cy.putDefaultAppConfig()
    })

    beforeEach(() => {
        cy.task('locale:delete', { organization_id: 'dsw' })

        cy.loginAs('admin')
    })

    after(() => {
        cy.task('locale:delete', { organization_id: 'dsw' })
    })

    it('create', () => {
        // Navigate to locale create
        cy.visitApp('/locales')
        cy.clickBtn('Create')


        // Fill in the locale details
        cy.fillFields({
            name: 'Czech',
            description: 'Czech Language',
            code: 'cs',
            localeId: 'cs',
            localeMajor: '1',
            localeMinor: '0',
            localePatch: '0',
            license: 'MIT',
            readme: 'This is Czech locale',
            appMajor: '3',
            appMinor: '17',
            appPatch: '0'
        })
        cy.get('#locale-import-input').selectFile('cypress/fixtures/locale/cs.po', { force: true })
        cy.get('.file-view').should('exist')
        cy.clickBtn('Create')
        cy.url().should('not.contain', 'create')

        // Activate imported locale
        cy.clickListingItemAction('Czech', 'enable')
        cy.contains('disabled').should('not.exist')

        // Change language to Czech
        cy.get('#menu_profile').trigger('mouseenter')
        cy.getCy('menu_languages').click()
        cy.get('.nav-link').contains('Czech').click()

        // Check the new language
        cy.contains('Uživatelé').click()
        cy.url().should('contain', 'users')
        cy.contains('Projekty').click()
        cy.url().should('contain', 'projects')
    })

    it('import', () => {
        // Navigate to locale import
        cy.visitApp('/locales')
        cy.clickBtn('Import')

        // Import the language bundle
        cy.get('#locale-import-input').selectFile('cypress/fixtures/locale/cs.zip', { force: true })
        cy.get('.file-view').should('exist')
        cy.clickBtn('Import')
        cy.url().should('not.contain', 'import')

        // Open detail
        cy.clickListingItemAction('Czech', 'view')
        cy.get('.top-header-actions').contains('Enable').click()
        cy.get('.top-header-actions').contains('Set default').click()
        cy.get('.top-header-actions').contains('Enable').should('not.exist')

        // Change language to Czech
        cy.get('#menu_profile').trigger('mouseenter')
        cy.getCy('menu_languages').click()
        cy.get('.nav-link').contains('Czech').click()

        // Check the new language
        cy.contains('Uživatelé').click()
        cy.url().should('contain', 'users')
        cy.contains('Projekty').click()
        cy.url().should('contain', 'projects')
    })
})
