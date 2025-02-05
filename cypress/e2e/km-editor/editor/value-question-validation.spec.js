import * as editor from '../../../support/editor-helpers'
import * as project from '../../../support/project-helpers'


describe('KM Editor Value Question Validation', () => {
    const kmName = 'Test Knowledge Model'
    const kmId = 'km-value-question-validation'
    const questionLabel = 'Question 1'

    const flatpickrOpen = () => {
        cy.get('.flatpickr-input').click()
    }

    const flatpickrPickDay = (day) => {
        flatpickrOpen()
        cy.get('.flatpickr-calendar.open').find('.flatpickr-day').contains(`${day}`).click()
    }

    const flatpickrPickTime = (hours, minutes) => {
        cy.get('.flatpickr-calendar.open').find('.flatpickr-hour').type(`${hours}`)
        cy.get('.flatpickr-calendar.open').find('.flatpickr-minute').type(`${minutes}`)
    }

    beforeEach(() => {
        cy.task('branch:delete', { km_id: kmId })
        cy.clearServerCache()

        cy.createKMEditor({ kmId, name: kmName, version: '1.0.0' })
        cy.loginAs('datasteward')
        cy.visitApp('/knowledge-model-editors')
        editor.open(kmId)
        editor.createChildren([
            ['chapter', { title: 'Chapter 1' }],
            ['question', { s_type: 'Value', title: questionLabel }]
        ])
    })

    it('Min Length', () => {
        cy.getCy('km-editor_question-validations_add-button').click()
        cy.fillFields({
            's_validation-0-type': 'MinLength',
            'validation-0-value': '5{del}'
        })
        editor.awaitSave()
        editor.openPreview()

        project.typeAnswer(questionLabel, 'abcd')
        cy.getCy('flash_alert-warning').should('exist')

        project.typeAnswer(questionLabel, 'abcde')
        cy.getCy('flash_alert-warning').should('not.exist')
    })

    it('Max Length', () => {
        cy.getCy('km-editor_question-validations_add-button').click()
        cy.fillFields({
            's_validation-0-type': 'MaxLength',
            'validation-0-value': '5{del}'
        })
        editor.awaitSave()
        editor.openPreview()

        project.typeAnswer(questionLabel, 'abcdef')
        cy.getCy('flash_alert-warning').should('exist')

        project.typeAnswer(questionLabel, 'abcde')
        cy.getCy('flash_alert-warning').should('not.exist')
    })

    it('Regex', () => {
        cy.getCy('km-editor_question-validations_add-button').click()
        cy.fillFields({
            's_validation-0-type': 'Regex',
            'validation-0-value': '[a-z]+'
        })
        editor.awaitSave()
        editor.openPreview()

        project.typeAnswer(questionLabel, '12345')
        cy.getCy('flash_alert-warning').should('exist')

        project.typeAnswer(questionLabel, 'abcde')
        cy.getCy('flash_alert-warning').should('not.exist')
    })

    it('ORCID', () => {
        cy.getCy('km-editor_question-validations_add-button').click()
        cy.fillFields({
            's_validation-0-type': 'Orcid'
        })
        editor.awaitSave()
        editor.openPreview()

        project.typeAnswer(questionLabel, '12345')
        cy.getCy('flash_alert-warning').should('exist')

        project.typeAnswer(questionLabel, '0000-0002-9079-593X')
        cy.getCy('flash_alert-warning').should('not.exist')
    })

    it('DOI', () => {
        cy.getCy('km-editor_question-validations_add-button').click()
        cy.fillFields({
            's_validation-0-type': 'Doi'
        })
        editor.awaitSave()
        editor.openPreview()

        project.typeAnswer(questionLabel, '12345')
        cy.getCy('flash_alert-warning').should('exist')

        project.typeAnswer(questionLabel, '10.5334/dsj-2019-059')
        cy.getCy('flash_alert-warning').should('not.exist')
    })

    it('Min Number', () => {
        cy.fillFields({ s_valueType: 'NumberQuestionValueType' })
        cy.getCy('km-editor_question-validations_add-button').click()
        cy.fillFields({
            's_validation-0-type': 'MinNumber',
            'validation-0-value': '5{del}'
        })
        editor.awaitSave()
        editor.openPreview()

        project.typeAnswer(questionLabel, '4')
        cy.getCy('flash_alert-warning').should('exist')

        project.typeAnswer(questionLabel, '5')
        cy.getCy('flash_alert-warning').should('not.exist')
    })

    it('Max Number', () => {
        cy.fillFields({ s_valueType: 'NumberQuestionValueType' })
        cy.getCy('km-editor_question-validations_add-button').click()
        cy.fillFields({
            's_validation-0-type': 'MaxNumber',
            'validation-0-value': '5{del}'
        })
        editor.awaitSave()
        editor.openPreview()

        project.typeAnswer(questionLabel, '6')
        cy.getCy('flash_alert-warning').should('exist')

        project.typeAnswer(questionLabel, '5')
        cy.getCy('flash_alert-warning').should('not.exist')
    })

    it('From Date', () => {
        cy.fillFields({ s_valueType: 'DateQuestionValueType' })
        cy.getCy('km-editor_question-validations_add-button').click()
        cy.fillFields({
            's_validation-0-type': 'FromDate',
        })
        flatpickrPickDay(5)
        editor.awaitSave()
        editor.openPreview()

        project.openDatePicker(questionLabel)
        project.selectDay(4)
        project.closeDatePicker(questionLabel)
        cy.getCy('flash_alert-warning').should('exist')

        project.openDatePicker(questionLabel)
        project.selectDay(5)
        project.closeDatePicker(questionLabel)
        cy.getCy('flash_alert-warning').should('not.exist')
    })

    it('To Date', () => {
        cy.fillFields({ s_valueType: 'DateQuestionValueType' })
        cy.getCy('km-editor_question-validations_add-button').click()
        cy.fillFields({
            's_validation-0-type': 'ToDate',
        })
        flatpickrPickDay(5)
        editor.awaitSave()
        editor.openPreview()

        project.openDatePicker(questionLabel)
        project.selectDay(6)
        project.closeDatePicker(questionLabel)
        cy.getCy('flash_alert-warning').should('exist')

        project.openDatePicker(questionLabel)
        project.selectDay(5)
        project.closeDatePicker(questionLabel)
        cy.getCy('flash_alert-warning').should('not.exist')
    })

    it('From Date Time', () => {
        cy.fillFields({ s_valueType: 'DateTimeQuestionValueType' })
        cy.getCy('km-editor_question-validations_add-button').click()
        cy.fillFields({
            's_validation-0-type': 'FromDateTime',
        })
        flatpickrPickDay(5)
        flatpickrPickTime(10, 15)
        editor.awaitSave()
        editor.openPreview()

        project.openDatePicker(questionLabel)
        project.selectDay(4)
        project.closeDatePicker(questionLabel)
        cy.getCy('flash_alert-warning').should('exist')

        project.openDatePicker(questionLabel)
        project.selectDay(5)
        project.selectTime(10, 10)
        project.closeDatePicker(questionLabel)
        cy.getCy('flash_alert-warning').should('exist')

        project.openDatePicker(questionLabel)
        project.selectDay(5)
        project.selectTime(10, 15)
        project.closeDatePicker(questionLabel)
        cy.getCy('flash_alert-warning').should('not.exist')

        project.openDatePicker(questionLabel)
        project.selectDay(6)
        project.closeDatePicker(questionLabel)
        cy.getCy('flash_alert-warning').should('not.exist')
    })

    it('To Date Time', () => {
        cy.fillFields({ s_valueType: 'DateTimeQuestionValueType' })
        cy.getCy('km-editor_question-validations_add-button').click()
        cy.fillFields({
            's_validation-0-type': 'ToDateTime',
        })
        flatpickrPickDay(5)
        flatpickrPickTime(10, 15)
        editor.awaitSave()
        editor.openPreview()

        project.openDatePicker(questionLabel)
        project.selectDay(6)
        project.closeDatePicker(questionLabel)
        cy.getCy('flash_alert-warning').should('exist')

        project.openDatePicker(questionLabel)
        project.selectDay(5)
        project.selectTime(10, 20)
        project.closeDatePicker(questionLabel)
        cy.getCy('flash_alert-warning').should('exist')

        project.openDatePicker(questionLabel)
        project.selectDay(5)
        project.selectTime(10, 15)
        project.closeDatePicker(questionLabel)
        cy.getCy('flash_alert-warning').should('not.exist')

        project.openDatePicker(questionLabel)
        project.selectDay(4)
        project.closeDatePicker(questionLabel)
        cy.getCy('flash_alert-warning').should('not.exist')
    })

    it('From Time', () => {
        cy.fillFields({ s_valueType: 'TimeQuestionValueType' })
        cy.getCy('km-editor_question-validations_add-button').click()
        cy.fillFields({
            's_validation-0-type': 'FromTime',
        })
        flatpickrOpen()
        flatpickrPickTime(10, 15)
        editor.awaitSave()
        editor.openPreview()

        project.openDatePicker(questionLabel)
        project.selectTime(10, 10)
        project.closeDatePicker(questionLabel)
        cy.getCy('flash_alert-warning').should('exist')

        project.openDatePicker(questionLabel)
        project.selectTime(10, 15)
        project.closeDatePicker(questionLabel)
        cy.getCy('flash_alert-warning').should('not.exist')
    })

    it('To Time', () => {
        cy.fillFields({ s_valueType: 'TimeQuestionValueType' })
        cy.getCy('km-editor_question-validations_add-button').click()
        cy.fillFields({
            's_validation-0-type': 'ToTime',
        })
        flatpickrOpen()
        flatpickrPickTime(10, 15)
        editor.awaitSave()
        editor.openPreview()

        project.openDatePicker(questionLabel)
        project.selectTime(10, 20)
        project.closeDatePicker(questionLabel)
        cy.getCy('flash_alert-warning').should('exist')

        project.openDatePicker(questionLabel)
        project.selectTime(10, 15)
        project.closeDatePicker(questionLabel)
        cy.getCy('flash_alert-warning').should('not.exist')
    })

    it('Domain', () => {
        cy.fillFields({ s_valueType: 'Email' })
        cy.getCy('km-editor_question-validations_add-button').click()
        cy.fillFields({
            's_validation-0-type': 'Domain',
            'validation-0-value': 'example.com, ds-wizard.org'
        })
        editor.awaitSave()
        editor.openPreview()

        project.typeAnswer(questionLabel, 'albert.einstein@gmail.com')
        cy.getCy('flash_alert-warning').should('exist')

        project.typeAnswer(questionLabel, 'albert.einstein@example.com')
        cy.getCy('flash_alert-warning').should('not.exist')

        project.typeAnswer(questionLabel, 'albert.einstein@ds-wizard.org')
        cy.getCy('flash_alert-warning').should('not.exist')
    })
})
