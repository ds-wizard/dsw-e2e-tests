import * as editor from '../../../support/editor-helpers'


describe('KM Editor Tags', () => {
    const kmName = 'Test Knowledge Model'
    const kmId = 'km-with-tags'
    const previousPackageId = 'mto:km-with-tags:1.0.0'

    before(() => {
        cy.task('package:delete', { km_id: kmId })
        cy.clearServerCache()

        cy.importKM('km-with-tags')
    })


    beforeEach(() => {
        cy.task('branch:delete', { km_id: kmId })
        cy.clearServerCache()

        cy.createKMEditor({ kmId, name: kmName, version: '1.0.0', previousPackageId })
        cy.loginAs('datasteward')
        cy.visitApp('/km-editor')
    })

    it('create phase visible by question and in tags editor', () => {
        const phaseName = 'My phase'

        editor.open(kmId)

        // Create a new phase
        const phase = { title: phaseName }
        editor.createChildren([['phase', phase]])

        // Navigate to a question and check that the new phase is there
        cy.getCy('breadcrumb-item', ':first-child').click()
        editor.traverseChildren(['Chapter 1', 'Question 1'])
        cy.fillFields({ s_requiredPhaseUuid: phaseName })

        // Open phases editor and check that the new phase is there
        editor.openPhases()
        cy.getCy('km-editor_phase-editor_phase').contains(phaseName).should('exist')
    })

    it('select phase by the question', () => {
        const phaseName = 'Before Submitting the DMP'
        const phaseUuid = '1796fa3c-9f53-475f-89ff-c66a0453c42e'
        const questionUuid = '73afb3ae-c1f6-4c02-8e4c-f87930695e5e'

        // Open editor, select tag and save
        editor.open(kmId)
        editor.traverseChildren(['Chapter 1', 'Question 3'])
        cy.fillFields({ s_requiredPhaseUuid: phaseName })

        // Open editor again and check that it is selected
        cy.visitApp('/km-editor')
        editor.open(kmId)
        editor.traverseChildren(['Chapter 1', 'Question 3'])
        cy.checkFields({ s_requiredPhaseUuid: phaseUuid })

        // Check that it is also selected in tags editor
        editor.openPhases()

        cy
            .getCy(`km-editor_phase-editor_row_question-${questionUuid}_phase-${phaseUuid}`)
            .should('be.checked')
    })

    it('select phase in phase editor', () => {
        const phaseName = 'Before Submitting the DMP'
        const phaseUuid = '1796fa3c-9f53-475f-89ff-c66a0453c42e'
        const questionUuid = '73afb3ae-c1f6-4c02-8e4c-f87930695e5e'

        // Open editor, select tag and save
        editor.open(kmId)
        editor.openPhases()
        cy
            .getCy(`km-editor_phase-editor_row_question-${questionUuid}_phase-${phaseUuid}`)
            .click()

        // Open editor again and check that it is selected
        cy.visitApp('/km-editor')
        editor.open(kmId)
        editor.openPhases()
        cy
            .getCy(`km-editor_phase-editor_row_question-${questionUuid}_phase-${phaseUuid}`)
            .should('be.checked')

        // Check that it is also selected by the question
        editor.openKM()
        editor.traverseChildren(['Chapter 1', 'Question 3'])
        cy.checkFields({ s_requiredPhaseUuid: phaseUuid })
    })
})