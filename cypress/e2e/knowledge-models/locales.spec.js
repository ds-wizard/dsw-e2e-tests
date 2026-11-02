import * as project from '../../support/project-helpers'

describe('Knowledge Models / Locales', () => {
    const kmId = 'test-km-1'
    const localeName = 'Czech'
    const localeCode = 'cs'
    const localeFile = 'cypress/fixtures/km-locale/cs.po'
    const projectName = 'Locale Test Project'
    let knowledgeModelPackageUuid

    before(() => {
        cy.putDefaultAppConfig()

        cy.task('project:delete')
        cy.task('knowledgeModelPackage:delete', { km_id: kmId })
        cy.clearServerCache()

        cy.importKM(kmId, (uuid) => {
            knowledgeModelPackageUuid = uuid
        })
    })

    after(() => {
        cy.task('project:delete')
        cy.task('knowledgeModelPackage:delete', { km_id: kmId })
    })

    const importLocale = () => {
        cy.loginAs('datasteward')
        cy.visitApp(`/knowledge-models/${knowledgeModelPackageUuid}/locales`)
        cy.getCy('illustrated-message_km-locales-empty').should('exist')

        // Import the locale from a PO file
        cy.getCy('km-detail_import-locale').click()
        cy.fillFields({ name: localeName })
        cy.getCy('km-locale-dropzone').find('.dropzone').selectFile(localeFile, {
            action: 'drag-drop'
        })
        cy.getCy('km-locale-dropzone').should('contain', 'cs.po')
        cy.clickModalAction()

        // Check the locale is in the table
        cy.get('table').contains('tr', localeName).should('contain', localeCode)
    }

    const setProjectLanguage = (language) => {
        project.openSettings()
        cy.fillFields({ s_language: language })
        project.saveSettings()
        cy.wait(100)
    }

    it('import locale and use it in a project', () => {
        importLocale()

        // Create a project using the same knowledge model
        cy.loginAs('researcher')
        cy.createProject({
            visibility: project.Private,
            sharing: project.Restricted,
            name: projectName,
            knowledgeModelPackageUuid
        })
        project.open(projectName)

        // Select the imported locale in the project settings
        setProjectLanguage(localeCode)
        project.open(projectName)


        // Questionnaire is localized
        project.openQuestionnaire()

        // ... chapters in the navigation
        cy.get('.questionnaireNavigation').should('contain', 'Kapitola 1')
        cy.get('.questionnaireNavigation').should('contain', 'Kapitola 2')
        cy.get('.questionnaireNavigation').should('not.contain', 'Chapter 1')
        cy.get('.questionnaireNavigation').should('not.contain', 'Chapter 2')

        // ... chapter text
        cy.get('.questionnaireContent').should('contain', 'Text kapitoly')

        // ... question titles
        project.expectQuestions([
            'Otázka s možnostmi 1',
            'Hodnotová otázka 1',
            'Seznamová otázka 1',
            'Otázka 1',
            'Integrační otázka 1',
            'Otázka s více volbami 1'
        ], true)
        project.expectQuestions([
            'Options Question 1',
            'Value Question 1',
            'List Question 1',
            'Question 1',
            'Integration Question 1',
            'Multi-Choice Question 1'
        ], false)

        // ... answers and choices
        cy.get('.questionnaireContent__option').contains('Odpověď 1').should('exist')
        cy.get('.questionnaireContent__option').contains('Volba 1').should('exist')
        cy.get('.questionnaireContent__option').contains('Volba 2').should('exist')

        // ... phases
        cy.getCy('phase-selection').should('contain', 'Před podáním návrhu')

        // ... questions in another chapter
        project.openChapter('Kapitola 2')
        project.expectQuestions(['Referenční otázka 1', 'Referenční otázka 2'], true)
        project.expectQuestions(['Reference Question 1', 'Reference Question 2'], false)


        // Metrics are localized
        project.openSummaryReport()

        // ... chapters
        cy.get('.questionnaire__summary-report').contains('h3', 'Kapitola 1').should('exist')
        cy.get('.questionnaire__summary-report').contains('h3', 'Kapitola 2').should('exist')

        // ... metrics
        const metrics = [
            'Nalezitelnost',
            'Přístupnost',
            'Interoperabilita',
            'Znovupoužitelnost',
            'Správná praxe DMP',
            'Otevřenost'
        ]
        metrics.forEach((metric) => {
            cy.get('.questionnaire__summary-report').contains('h4', metric).should('exist')
        })

        cy.get('.questionnaire__summary-report').should('not.contain', 'Chapter 1')
        cy.get('.questionnaire__summary-report').should('not.contain', 'Chapter 2')
        cy.get('.questionnaire__summary-report').should('not.contain', 'Findability')
    })
})
