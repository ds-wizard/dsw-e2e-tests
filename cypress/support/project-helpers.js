import { dataCy } from './utils'

export const VisibleEdit = 'VisibleEditQuestionnaire'
export const VisibleComment = 'VisibleCommentQuestionnaire'
export const VisibleView = 'VisibleViewQuestionnaire'
export const Private = 'PrivateQuestionnaire'

export const Restricted = 'RestrictedQuestionnaire'
export const AnyoneWithLinkView = 'AnyoneWithLinkViewQuestionnaire'
export const AnyoneWithLinkComment = 'AnyoneWithLinkCommentQuestionnaire'
export const AnyoneWithLinkEdit = 'AnyoneWithLinkEditQuestionnaire'

export const TemplateAndCustomQuestionnaireCreation = 'TemplateAndCustomQuestionnaireCreation'
export const TemplateQuestionnaireCreation = 'TemplateQuestionnaireCreation'
export const CustomQuestionnaireCreation = 'CustomQuestionnaireCreation'

export const TodoUUID = '615b9028-5e3f-414f-b245-12d2ae2eeb20'

export function open(projectName) {
    cy.visitApp('/projects')
    cy.clickListingItemAction(projectName, 'open')
    expectTitle(projectName)
}


export function openAnonymous(projectId, projectName) {
    cy.visitApp(`/projects/${projectId}`)
    cy.get('.DetailNavigation__Row__Section .title').contains(projectName)
}


export function create(projectName, packageName) {
    cy.visitApp('/projects/create/custom')
    cy.fillFields({
        name: projectName,
        th_packageId: packageName
    })
    cy.clickBtn('Save')
    cy.url().should('match', /\/projects\/.+/)
    expectTitle(projectName)
}


export function addUser(name, perms) {
    cy.clickBtn('Share')
    cy.fillFields({ th_memberId: name })
    cy.fillFields({ 's_permissions\\.1\\.perms': perms })
    cy.clickModalAction()
}


export function visibilityToPerm(visibility) {
    if (visibility == VisibleEdit) {
        return 'edit'
    } else if (visibility == VisibleComment) {
        return 'comment'
    }
    return 'view'
}


export function sharingToPerm(sharing) {
    if (sharing == AnyoneWithLinkEdit) {
        return 'edit'
    } else if (sharing == AnyoneWithLinkComment) {
        return 'comment'
    }
    return 'view'
}


export function setProjectVisibility(visibility) {
    cy.clickBtn('Share')

    if (visibility !== Private) {
        cy.checkToggle('visibilityEnabled')
        cy.fillFields({ s_visibilityPermission: visibilityToPerm(visibility) })
    } else {
        cy.uncheckToggle('visibilityEnabled')
    }

    cy.clickModalAction() 
}

export function setProjectSharing(sharing) {
    cy.clickBtn('Share')

    if (sharing !== Restricted) {
        cy.checkToggle('sharingEnabled')
        cy.fillFields({ s_sharingPermission: sharingToPerm(sharing) })
    } else {
        cy.uncheckToggle('sharingEnabled')
    }

    cy.clickModalAction() 
}


export function expectTitle(questionnaireName) {
    cy.get('.DetailNavigation__Row__Section .title').contains(questionnaireName)
}


export function expectViewer() {
    cy.url().should('match', /\/projects\/.+/)
    cy.get('.questionnaire__form .form-group input[type=text]').should('be.disabled')
    cy.get('.questionnaire__left-panel__phase select').should('be.disabled')
    cy.getCy('questionnaire_question-action_comment').should('not.exist')
    checkDisabledShareAndSettings()
}

export function expectCommenter() {
    cy.url().should('match', /\/projects\/.+/)
    cy.get('.questionnaire__form .form-group input[type=text]').should('be.disabled')
    cy.get('.questionnaire__left-panel__phase select').should('be.disabled')
    cy.getCy('questionnaire_question-action_comment').should('exist')
    checkDisabledShareAndSettings()
}


export function expectEditor() {
    cy.url().should('match', /\/projects\/.+/)
    cy.get('.questionnaire__form .form-group input[type=text]').should('not.be.disabled')
    cy.get('.questionnaire__left-panel__phase select').should('not.be.disabled')
    checkDisabledShareAndSettings()
}


export function expectOwner() {
    cy.url().should('match', /\/projects\/.+/)
    cy.get('.questionnaire__form .form-group input[type=text]').should('not.be.disabled')
    cy.get('.questionnaire__left-panel__phase select').should('not.be.disabled')
    cy.getCy('project_detail_share-button').should('exist')
    cy.get('.DetailNavigation__Row .nav-link').contains('Settings').should('exist')
}


function checkDisabledShareAndSettings() {
    cy.getCy('project_detail_share-button').should('not.exist')
    cy.get('.DetailNavigation__Row .nav-link').contains('Settings').should('not.exist')
}

export function expectQuestion(question, visible) {
    const predicate = visible ? 'exist' : 'not.exist'
    cy.get('.form-group label').contains(question).should(predicate)
}


export function expectQuestions(questions, visible) {
    questions.forEach(q => expectQuestion(q, visible))
}


export function expectTypehints(label, typehints, query = '') {
    if (query === "") {
        cy.get('label').contains(label).closest('.form-group').find('input').focus()
    } else {
        typeAnswer(label, query)
    }
    if (typehints.length === 0) {
        cy.get('label').contains(label).closest('.form-group').find('.typehints > ul > li').should('not.exist')
    } else {
        cy.get('label').contains(label).closest('.form-group').find('.typehints > ul > li').should('have.length', typehints.length)
        cy.get('label').contains(label).closest('.form-group').find('.typehints > ul > li').each(($item, index) => {
            cy.wrap($item).contains(typehints[index].name)
        })
    }
}


export function expectTypehintsError(label, message) {
    cy.get('label').contains(label).closest('.form-group').find('input').focus()
    cy.get('label').contains(label).closest('.form-group').find('.typehints > .error').contains(message)
}


export function useNthTypehint(label, n, typehint) {
    cy.get('label').contains(label).closest('.form-group').find('input').focus()
    cy.get('label').contains(label).closest('.form-group').find('.typehints > ul > li').eq(n).contains(typehint.name).click()
}


export function checkIntegrationLink(label, link, logo = false) {
    cy.get('label').contains(label).closest('.form-group').find('.card-footer > img').should(logo ? 'exist' : 'not.exist')
    cy.get('label').contains(label).closest('.form-group').find('.card-footer > a').should('have.text', link)
}


export function selectAnswer(answer) {
    cy.get('label').contains(answer).click()
}


export function openChapter(chapter) {
    cy.get('.DetailNavigation__Row .nav-link').contains('Questionnaire').click()
    cy.get('.questionnaire__left-panel__chapters .nav-link').contains(chapter).click()
}


export function openSummaryReport() {
    cy.get('.DetailNavigation__Row .nav-link').contains('Metrics').click()
}


export function openPreview() {
    cy.get('.DetailNavigation__Row .nav-link').contains('Preview').click()
}


export function openDocuments() {
    cy.get('.DetailNavigation__Row .nav-link').contains('Documents').click()
}


export function openSettings() {
    cy.get('.DetailNavigation__Row .nav-link').contains('Settings').click()
}

export function saveSettings() {
    cy.clickBtn('Save')
}

export function checkAnswerChecked(answer) {
    cy.get('label').contains(answer).find('input').should('be.checked')
}


export function checkAnswerNotChecked(answer) {
    cy.get('label').contains(answer).find('input').should('not.be.checked')
}


export function clearAnswer(answer) {
    cy.get('label').contains(answer).closest('.form-group').find('a').contains('Clear answer').click()
}


export function typeAnswer(label, answer) {
    cy.get('label').contains(label).closest('.form-group').find('input').clear().type(answer, { delay: 200 })
}


export function checkAnswer(label, answer) {
    cy.get('label').contains(label).closest('.form-group').find('input').should('have.value', answer)
}


export function checkIntegrationAnswer(label, answer) {
    cy.get('label').contains(label).closest('.form-group').find('.card-body.item-md').contains(answer)
}


export function typeAnswerText(label, answer) {
    cy.get('label').contains(label).closest('.form-group').find('textarea').clear().type(answer)
}


export function checkAnswerText(label, answer) {
    cy.get('label').contains(label).closest('.form-group').find('textarea').should('have.value', answer)
}


export function addTodoFor(question) {
    cy.get('.form-group').contains(question).find('.action-add-todo').click()
}


export function removeTodoFor(question) {
    cy.get('.form-group').contains(question).find('.action-todo a').click()
}


export function expectTodoFor(question) {
    cy.get('.form-group').contains(question).find('.action-todo a').should('exist')
}


export function expectTodo(question) {
    cy.get('.questionnaire__toolbar .item').contains('TODOs').click()
    cy.get('.todos a').contains(question).click()
    cy.get('.form-group').contains(question).should('be.visible')
        .find('.action-todo').contains('TODO')

}


export function expectTodoCount(count) {
    cy.get('.questionnaire__toolbar .item').contains('TODOs').parent().find('.badge').contains(count)
}


export function expectNoTodo() {
    cy.get('.questionnaire__toolbar .item').contains('TODOs').parent().find('.badge').should('not.exist')
    cy.get('.action-todo').should('not.exist')
}


export function openCommentsFor(question) {
    cy.get('.form-group').contains(question).find(dataCy('questionnaire_question-action_comment')).click()
}


export function openPrivateNotesFor(question) {
    openCommentsFor(question)
    cy.getCy('comments_nav_private-notes').click()
}


export function startNewCommentThread(text) {
    cy.getCy('comments_reply-form_input_new_public').clear().type(text)
    cy.getCy('comments_reply-form_submit_new_public').click()
}


export function replyCommentThread(text) {
    cy.getCy('comments_reply-form_input_reply_public').clear().type(text)
    cy.getCy('comments_reply-form_submit_reply_public').click()
}


export function startNewPrivateNotesThread(text) {
    cy.getCy('comments_reply-form_input_new_private').clear().type(text)
    cy.getCy('comments_reply-form_submit_new_private').click()
}


export function replyPrivateNoteThread(text) {
    cy.getCy('comments_reply-form_input_reply_private').clear().type(text)
    cy.getCy('comments_reply-form_submit_reply_private').click()
}


export function expectCommentCount(count) {
    if (count > 0) {
        cy.getCy('questionnaire_toolbar_comments_count').contains(count)
    } else {
        cy.getCy('questionnaire_toolbar_comments_count').should('not.exist')
    }
}


export function expectSummaryReportAnswered(indication, chapter) {
    openSummaryReport()

    const checkCells = ($cells, text) => {
        cy.wrap($cells).should('have.length', 2)
        cy.wrap($cells[0]).should('contain.text', text)
    }

    const checkRows = ($rows) => {
        cy.wrap($rows).should('have.length', 2)
        cy.wrap($rows[0]).find('td').then(($cells) => { 
            checkCells($cells, `Answered (current phase): ${indication.current.answered}/${indication.current.all}`)
        })
        cy.wrap($rows[1]).find('td').then(($cells) => {
            checkCells($cells, `Answered: ${indication.all.answered}/${indication.all.all}`)
        })
    }

    if (chapter === undefined) {
        cy.get('.questionnaire__summary-report > table.indication-table').find('tr.indication').then(($rows) => {
            checkRows($rows)
        })
    } else {
        cy.get('.questionnaire__summary-report').contains('h3', chapter).parent().find('table.indication-table tr.indication').then(($rows) => {
            checkRows($rows)
        })
    }
}


export function expectSummaryReportMetrics(metrics, chapter) {
    openSummaryReport()

    const checkCells = ($cells, metric) => {
        cy.wrap($cells).should('have.length', 3)
        cy.wrap($cells[0]).should('contain.text', metric.name)
        cy.wrap($cells[1]).should('contain.text', metric.value)
    }

    if (chapter === undefined) {
        if (metrics.length === 0) {
            cy.get('.questionnaire__summary-report > div.row').find('.table-metrics-report').should('not.exist')
        } else {
            cy.get('.questionnaire__summary-report > div.row').find('.table-metrics-report').should('exist')
            cy.get('.questionnaire__summary-report > div.row').find('.table-metrics-report tbody tr').should('have.length', metrics.length)
            metrics.forEach((metric, index) => {
                cy.get('.questionnaire__summary-report > div.row').find('.table-metrics-report tbody tr').eq(index).find('td').then(($cells) => {
                    checkCells($cells, metric)
                })
            })
        }
    } else {
        if (metrics.length === 0) {
            cy.get('.questionnaire__summary-report').contains('h3', chapter).parent().find('.table-metrics-report').should('not.exist')
        } else {
            cy.get('.questionnaire__summary-report').contains('h3', chapter).parent().find('.table-metrics-report').should('exist')
            cy.get('.questionnaire__summary-report').contains('h3', chapter).parent().find('.table-metrics-report tbody tr').should('have.length', metrics.length)
            metrics.forEach((metric, index) => {
                cy.get('.questionnaire__summary-report').contains('h3', chapter).parent().find('.table-metrics-report tbody tr').eq(index).find('td').then(($cells) => {
                    checkCells($cells, metric)
                })
            })
        }
    }
}


export function awaitSave() {
    cy.get('.questionnaire-header__saving').contains('Saved')
}


export function resolveAndFinalizeMigration() {
    cy.clickBtn('Resolve')
    finalizeMigration()
}


export function finalizeMigration() {
    cy.clickBtn('Finalize migration')
    cy.url().should('match', /\/projects\/.+/)
    cy.get('.Questionnaire__Migration').should('not.exist')
    cy.get('.questionnaire__form').should('exist')
}


export function awaitOpen() {
    cy.get('.DetailNavigation__Row__Section').should('exist')
}


export function addProjectTag(projectTag) {
    cy.fillFields({ projectTag })
    cy.getCy('project_settings_add-tag-button').click()
}


export function removeProjectTag(projectTag) {
    cy.getCy('project_settings_tag').contains(projectTag).find(dataCy('project_settings_tag-remove')).click()
}


export function expectProjectTag(projectTag, exists = true) {
    cy.getCy('project_settings_tag').contains(projectTag).should(exists ? 'exist' : 'not.exist')
}


export function expectProjectTagSuggestion(projectTag, exists = true) {
    cy.getCy('project_settings_tag-suggestion').contains(projectTag).should(exists ? 'exist' : 'not.exist')
}


export function pickProjectTagSuggestion(projectTag) {
    cy.getCy('project_settings_tag-suggestion').contains(projectTag).click()
    cy.getCy('project_settings_add-tag-button').click()
}