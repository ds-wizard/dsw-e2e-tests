import * as editor from '../../../support/editor-helpers'

describe('KMEditor WebSocket Tests', () => {
    const kmName = 'Test Knowledge Model'
    const kmId = 'test-km'
    let kmEditorUuid = ''

    beforeEach(() => {
        cy.task('package:delete', { km_id: kmId })
        cy.task('branch:delete', { km_id: kmId })
        cy.clearServerCache()

        cy.createKMEditor({
            kmId, name: kmName, previousPackageId: null
        }).then(result => {
            console.log(result)
            kmEditorUuid = result.body.uuid
            console.log(kmEditorUuid)
        })
        cy.loginAs('datasteward')
        cy.visitApp('/km-editor')
        editor.open(kmId)
    })

    it('Basic editations', () => {
        // Add chapter
        const addChapterMsg = {
            "type": "SetContent_ClientBranchAction",
            "data": {
                "type": "AddBranchEvent",
                "uuid": "83c73272-3926-4486-aa1e-2a3bad78608c",
                "event": {
                    "eventType": "AddChapterEvent",
                    "title": "",
                    "text": null,
                    "annotations": [],
                    "uuid": "5a5016e2-6897-46c5-89a5-286495f8c05d",
                    "parentUuid": "00000000-0000-0000-0000-000000000000",
                    "entityUuid": "b57d402a-0c12-4ca5-ab72-c69ba0fbfc0c",
                    "createdAt": "2022-01-24T13:26:25.996Z"
                }
            }
        }
        cy.wsSendAs('admin', `/branches/${kmEditorUuid}/websocket`, addChapterMsg)

        // Check that empty chapter has been created
        editor.openChild('Untitled chapter')
        cy.checkFields({
            title: '',
            text: ''
        })

        // Edit that chapter
        const editChapterMsg = {
            "type": "SetContent_ClientBranchAction",
            "data": {
                "type": "AddBranchEvent",
                "uuid": "17aa44c9-ed54-4681-a77a-bca140266dd5",
                "event": {
                    "eventType": "EditChapterEvent",
                    "title": {
                        "changed": true,
                        "value": "Chapter"
                    },
                    "text": {
                        "changed": true,
                        "value": "This is my beautiful chapter!"
                    },
                    "questionUuids": {
                        "changed": false
                    },
                    "annotations": {
                        "changed": false
                    },
                    "uuid": "28872f99-04fe-4fe5-b93f-39aa7e516ef2",
                    "parentUuid": "00000000-0000-0000-0000-000000000000",
                    "entityUuid": "b57d402a-0c12-4ca5-ab72-c69ba0fbfc0c",
                    "createdAt": "2022-01-24T13:29:37.146Z"
                }
            }
        }
        cy.wsSendAs('admin', `/branches/${kmEditorUuid}/websocket`, editChapterMsg)

        // Check that the fields has been updated
        cy.checkFields({
            title: 'Chapter',
            text: 'This is my beautiful chapter!'
        })

        // Delete the chapter
        const deleteChapterMsg = {
            "type": "SetContent_ClientBranchAction",
            "data": {
                "type": "AddBranchEvent",
                "uuid": "6e081af8-a7a5-4523-9c83-f2c23f8561bf",
                "event": {
                    "eventType": "DeleteChapterEvent",
                    "uuid": "8aea01f3-3074-485b-a911-5830e7e97311",
                    "parentUuid": "00000000-0000-0000-0000-000000000000",
                    "entityUuid": "b57d402a-0c12-4ca5-ab72-c69ba0fbfc0c",
                    "createdAt": "2022-01-24T13:29:37.146Z"
                }
            }
        }
        cy.wsSendAs('admin', `/branches/${kmEditorUuid}/websocket`, deleteChapterMsg)

        // Check that the chapter has been removed
        editor.shouldNotHaveChild('Chapter')
    })

    it('Disconnect when deleted', () => {
        // delete km editor
        cy.deleteKMEditor(kmEditorUuid)

        // check error appears
        cy.get('.full-page-illustrated-message').should('exist')
        cy.get('h1').contains('Oops!').should('exist')

        // check it doesn't work after refresh
        cy.clickBtn('Refresh')
        cy.getCy('illustrated-message_error').should('exist')
    })

    it('Disconnect when published', () => {
        // publish a version
        cy.publishKMEditor({
            kmId: kmEditorUuid,
            version: '2.3.6',
            description: 'This is a Knowledge Model',
            readme: '# Knowledge Model',
            license: 'MIT'
        })

        // check error appears
        cy.get('.full-page-illustrated-message').should('exist')
        cy.get('h1').contains('Oops!').should('exist')

        // check it works after refresh
        cy.clickBtn('Refresh')
        cy.getCy('km-editor').should('exist')
    })
})
