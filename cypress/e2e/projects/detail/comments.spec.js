import * as project from '../../../support/project-helpers'


describe('Comments', () => {
    const projectName = 'Test Project'
    const kmId = 'test-km-1'
    const packageId = 'dsw:test-km-1:1.0.0'
    let projectUuid = ''

    before(() => {
        cy.task('package:delete', { km_id: kmId })
        cy.clearServerCache()

        cy.importKM('test-km-1')
    })


    beforeEach(() => {
        cy.clearLocalStorage()

        cy.task('questionnaire:delete')
        cy.clearServerCache()

        cy.createQuestionnaire({
            visibility: project.VisibleView,
            sharing: project.Restricted,
            name: projectName,
            packageId
        }).then(result => {
            projectUuid = result.body.uuid
        })
        cy.loginAs('researcher')
        project.open(projectName)
    })

    const testComment = () => {
        project.openCommentsFor('Options Question 1')
        project.startNewCommentThread('This is a new thread')
        project.expectCommentCount(1)
        cy.clearCurrentQuestionnaireSidePanelLocalStorage()
        cy.reload()
        project.expectCommentCount(1)
    }

    const testNoComments = () => {
        cy.getCy('questionnaire_question-action_comment').should('not.exist')
    }

    const testPrivateNote = () => {
        project.openPrivateNotesFor('Options Question 1')
        project.startNewPrivateNotesThread('This is a new thread')
        project.expectCommentCount(2)
        cy.clearCurrentQuestionnaireSidePanelLocalStorage()
        cy.reload()
        project.expectCommentCount(2)
    }

    const testNoPrivateNotes = () => {
        project.openCommentsFor('Options Question 1')
        cy.getCy('comments_nav_private-notes').should('not.exist')
        cy.clearCurrentQuestionnaireSidePanelLocalStorage()
    }

    it('as Admin', () => {
        cy.logout()
        cy.loginAs('admin')
        project.open(projectName)

        testComment()
        testPrivateNote()
    })

    it('as Owner', () => {
        testComment()
        testPrivateNote()
    })

    it('as Editor', () => {
        project.addUser('Nikola Tesla', 'Editor')
        cy.logout()
        cy.loginAs('datasteward')
        project.open(projectName)

        testComment()
        testPrivateNote()
    })

    it('as Commenter', () => {
        project.addUser('Nikola Tesla', 'Commenter')
        cy.logout()
        cy.loginAs('datasteward')
        project.open(projectName)

        testComment()
        testNoPrivateNotes()
    })

    it('as Viewver', () => {
        project.addUser('Nikola Tesla', 'Viewer')
        cy.logout()
        cy.loginAs('datasteward')
        project.open(projectName)

        testNoComments()
    })

    it('as visibility - view', () => {
        project.setProjectVisibility(project.VisibleView)
        cy.logout()
        cy.loginAs('datasteward')
        project.open(projectName)

        testNoComments()
    })

    it('as visibility - comment', () => {
        project.setProjectVisibility(project.VisibleComment)
        cy.logout()
        cy.loginAs('datasteward')
        project.open(projectName)

        testComment()
        testNoPrivateNotes()
    })

    it('as visibility - edit', () => {
        project.setProjectVisibility(project.VisibleEdit)
        cy.logout()
        cy.loginAs('datasteward')
        project.open(projectName)

        testComment()
        testPrivateNote()
    })

    it('as sharing - view', () => {
        project.setProjectSharing(project.AnyoneWithLinkView)

        cy.url().then(url => {
            const projectId = url.split('/').pop()
            cy.logout()
            project.openAnonymous(projectId, projectName)

            testNoComments()
        })
    })

    it('as sharing - comment', () => {
        project.setProjectSharing(project.AnyoneWithLinkComment)

        cy.url().then(url => {
            const projectId = url.split('/').pop()
            cy.logout()
            project.openAnonymous(projectId, projectName)

            testComment()
            testNoPrivateNotes()
        })
    })

    it('as sharing - edit', () => {
        project.setProjectSharing(project.AnyoneWithLinkEdit)

        cy.url().then(url => {
            const projectId = url.split('/').pop()
            cy.logout()
            project.openAnonymous(projectId, projectName)

            testComment()
            testPrivateNote()
        })
    })

    it('resolve comment', () => {
        project.openCommentsFor('Options Question 1')
        project.startNewCommentThread('This is a new thread')
        project.expectCommentCount(1)
        cy.getCy('comments_comment_resolve').click()
        project.expectCommentCount(0)
    })

    it('resolve private note', () => {
        project.openPrivateNotesFor('Options Question 1')
        project.startNewPrivateNotesThread('This is a new thread')
        project.expectCommentCount(1)
        cy.getCy('comments_comment_resolve').click()
        project.expectCommentCount(0)
    })

    it('reply to comment', () => {
        project.openCommentsFor('Options Question 1')
        project.startNewCommentThread('This is a new thread')
        project.expectCommentCount(1)
        project.replyCommentThread('This is my reply')
        project.expectCommentCount(2)
        project.replyCommentThread('This is another reply')
        project.expectCommentCount(3)
    })

    it('reply to private note', () => {
        project.openPrivateNotesFor('Options Question 1')
        project.startNewPrivateNotesThread('This is a new thread')
        project.expectCommentCount(1)
        project.replyPrivateNoteThread('This is my reply')
        project.expectCommentCount(2)
        project.replyPrivateNoteThread('This is another reply')
        project.expectCommentCount(3)
    })

    it('delete comment', () => {
        project.openCommentsFor('Options Question 1')
        project.startNewCommentThread('This is a new thread')
        project.expectCommentCount(1)
        cy.getCy('comments_comment_menu').click()
        cy.getCy('comments_comment_menu_delete').click()
        cy.getCy('comments_delete-modal_delete').click()
        project.expectCommentCount(0)
        cy.reload()
        project.expectCommentCount(0)
    })

    it('delete private note', () => {
        project.openPrivateNotesFor('Options Question 1')
        project.startNewPrivateNotesThread('This is a new thread')
        project.expectCommentCount(1)
        cy.getCy('comments_comment_menu').click()
        cy.getCy('comments_comment_menu_delete').click()
        cy.getCy('comments_delete-modal_delete').click()
        project.expectCommentCount(0)
        cy.reload()
        project.expectCommentCount(0)
    })

    it('can only resolve comment by other user', () => {
        project.openCommentsFor('Options Question 1')
        project.startNewCommentThread('This is a new thread')
        project.addUser('Nikola Tesla', 'Commenter')
        cy.logout()
        cy.clearLocalStorage()

        cy.loginAs('datasteward')
        project.open(projectName)
        project.openCommentsFor('Options Question 1')
        cy.getCy('comments_comment_menu').should('not.exist')
        cy.getCy('comments_comment_resolve').click()
        project.expectCommentCount(0)
    })

    it('can only resolve private note by other user', () => {
        project.openPrivateNotesFor('Options Question 1')
        project.startNewPrivateNotesThread('This is a new thread')
        project.addUser('Nikola Tesla', 'Editor')
        cy.logout()
        cy.clearLocalStorage()

        cy.loginAs('datasteward')
        project.open(projectName)
        project.openPrivateNotesFor('Options Question 1')
        cy.getCy('comments_comment_menu').should('not.exist')
        cy.getCy('comments_comment_resolve').click()
        project.expectCommentCount(0)
    })

    it('websocket', () => {
        project.setProjectSharing(project.AnyoneWithLinkEdit)

        const msg = {
            type: 'SetContent_ClientQuestionnaireAction',
            data: {
                type: 'AddCommentEvent',
                uuid: 'd805310f-62f4-4559-88b2-df425c9ded5d',
                path: '99196c79-3de5-4add-a6c9-20e6ba179fae.49cdf436-5de7-43d9-8226-a33dfabbce3e',
                newThread: true,
                threadUuid: '291812c8-f58e-4cee-addd-47544d0d5a5b',
                commentUuid: 'c9a9ba07-0d94-4fb2-810c-f71c8f759305',
                text: 'This is a comment',
                private: false
            }
        }

        project.open(projectName)
        project.expectCommentCount(0)
        cy.wsSend(`/questionnaires/${projectUuid}/websocket`, msg)
        project.openCommentsFor('Options Question 1')
        cy.get('.Comment_MD').contains('This is a comment').should('exist')
    })
})
