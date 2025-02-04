import * as project from '../../../support/project-helpers'

describe('Document Template Editor / Editor / Preview', () => {
    const projectName = 'My Project'
    const kmId = 'basic-questionnaire-test-km'
    const kmName = 'Basic Questionnaire Test KM'
    const packageId = 'dsw:basic-questionnaire-test-km:1.0.0'

    const createAndOpenDTEditor = () => {
        cy.visitApp('/document-template-editors/create?selected=dsw:questionnaire-report:2.14.1&edit=true')
        cy.submitForm()
        cy.url().should('contain', '/document-template-editors/dsw:questionnaire-report:2.15.0')
        cy.getCy('dt-editor_nav_preview').click()
    }

    const getElemInsideIFrame = (iFrameselector, elementSelector) =>
        cy
          .get(iFrameselector)
          .find('iframe')
          .then(($el) => {
            if (!$el || $el.length === 0) {
              return cy.wrap(null);
            }
            return cy.wrap($el[0].contentWindow?.document.body.querySelector(elementSelector));
            });

    before(() => {
        cy.task('package:delete', { km_id: kmId })
        cy.task('branch:delete', { km_id: kmId })
        cy.putDefaultAppConfig()
        cy.clearServerCache()

        cy.importKM(kmId)
    })

    beforeEach(() => {
        // prepare base document template
        cy.task('documentTemplate:delete')
        cy.task('questionnaire:delete')
        cy.clearServerCache()
        cy.importTemplate('templates/template.zip')

        // create project to use for preview
        cy.createQuestionnaire({
            visibility: project.VisibleView,
            sharing: project.Restricted,
            name: projectName,
            packageId
        })

        // create document template editor
        cy.loginAs('datasteward')

        // create KM editor
        cy.createKMEditor({ kmId, name: kmName, version: '1.0.1', previousPackageId: null })
    })

    it('preview in browser', () => {
        createAndOpenDTEditor()
        cy.fillFields({
            th_uuid: projectName,
            s_format: 'JSON Data'
        })
        cy.getCy('document-preview').should('exist')
    })

    it('preview download', () => {
        createAndOpenDTEditor()
        cy.fillFields({
            th_uuid: projectName,
            s_format: 'MS Word Document'
        })
        cy.wait(2000)
        cy.getCy('illustrated-message_format-not-supported').should('exist')
    })

    // test development with KM editor values
    it.only('preview in browser with KM', () => {
        cy.visitApp('/km-editor')
        cy.clickListingItemAction(kmId, 'open-editor')

        createAndOpenDTEditor()
        cy.getCy('dt-editor_preview-mode_km-editor').click()
        cy.fillFields({
            th_uuid: kmName,
            s_format: 'HTML Document'
        })

        getElemInsideIFrame('iframe', kmName).should('contain', kmName)
    })



        // create KM editor

        // insert values

        // open DT preview

        // validate values

        // change KM editor questions and values

        // validate values

        // delete Km editor questions and values

        // validate values
        
})
