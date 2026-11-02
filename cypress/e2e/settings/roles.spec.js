import * as documentTemplates from '../../support/document-templates-helpers'
import * as project from '../../support/project-helpers'

describe('Settings / Roles', () => {
    const roleName = 'Test Role'

    const kmId = 'test-km-1'
    const packageName = 'Test Knowledge Model 1'

    const projectName = 'Test Roles Project'

    const kmEditorName = 'Test Roles Knowledge Model'
    const kmEditorKmId = 'test-roles-km'

    const dtEditorName = 'Test Roles Document Template'
    const dtEditorTemplateId = 'test-roles-document-template'

    const dtFixture = 'templates/questionnaire-report.zip'
    const dtName = 'Questionnaire Report'

    const localeFixture = 'locale/cs.zip'
    const localeOrganizationId = 'dsw'
    const localeName = 'Czech'

    const importedKmFixture = 'file-km.json'
    const importedKmId = 'file-km'
    const importedKmName = 'File KM'
    const importedKmPackageId = 'myorg:file-km'

    const user = {
        email: 'grace.hopper@example.com',
        firstName: 'Grace',
        lastName: 'Hopper',
        password: 'StronkPassw0rd'
    }

    const organizationDescription = 'Organization description changed in the roles test'

    const createdUser = {
        email: 'alan.turing@example.com',
        firstName: 'Alan',
        lastName: 'Turing',
        password: 'StronkPassw0rd'
    }

    const permissions = {
        projectTemplatesManage: 'ProjectTemplatesManageRolePermission',
        projectsView: 'ProjectsViewRolePermission',
        projectsComment: 'ProjectsCommentRolePermission',
        projectsEdit: 'ProjectsEditRolePermission',
        projectsManage: 'ProjectsManageRolePermission',
        knowledgeModelEditorsUse: 'KnowledgeModelEditorsUseRolePermission',
        knowledgeModelsManage: 'KnowledgeModelsManageRolePermission',
        documentTemplateEditorsUse: 'DocumentTemplateEditorsUseRolePermission',
        documentTemplatesManage: 'DocumentTemplatesManageRolePermission',
        usersManage: 'UsersManageRolePermission',
        settingsManage: 'SettingsManageRolePermission',
    }

    let roleUuid
    let researcherRoleUuid

    const deleteTestData = () => {
        // all projects have to go, the View ALL Projects test expects an empty listing
        // and other specs may leave visible projects behind
        cy.task('project:delete')
        cy.task('knowledgeModelEditor:delete', { km_id: kmEditorKmId })
        cy.task('knowledgeModelPackage:delete', { km_id: importedKmId })
        // all document templates have to go, the Manage Document Templates test expects
        // an empty listing and other specs may leave their templates behind
        cy.task('documentTemplate:delete')
        cy.task('locale:delete', { organization_id: localeOrganizationId })
        cy.task('user:delete', { email: createdUser.email })
        // the Manage Settings test changes the organization settings
        cy.putDefaultAppConfig()
    }

    const cleanUp = () => {
        // the test data has to go first, it references the user, and the user references the role
        deleteTestData()
        cy.task('user:delete', { email: user.email })
        cy.task('role:delete', { name: roleName })
    }

    const openRole = () => {
        cy.loginAs('admin')
        cy.visitApp(`/settings/roles/${roleUuid}`)
    }

    const loginAsTestUser = () => {
        cy.loginWith(user.email, user.password)
    }

    const saveRole = () => {
        cy.submitForm()
        // there is no success message, the form actions disappear once it is saved
        cy.getCy('form-actions').should('not.exist')
    }

    const addPermission = (...newPermissions) => {
        openRole()
        newPermissions.forEach((permission) => {
            cy.checkToggle(`permission-${permission}`)
        })
        saveRole()
    }

    before(() => {
        cleanUp()
        cy.task('knowledgeModelPackage:delete', { km_id: kmId })
        cy.clearServerCache()

        cy.importKM(kmId)
        cy.putDefaultAppConfig()

        cy.loginAs('admin')

        // the role for the user created in the Manage Users test
        cy.task('role:get', { name: 'Researcher' }).then((result) => {
            researcherRoleUuid = result.rows[0].uuid
        })

        // create a new role with only a name
        cy.visitApp('/settings/roles/create')
        cy.fillFields({ name: roleName })
        cy.submitForm()
        cy.url().should('match', /\/settings\/roles$/)

        // create a user with the new role
        cy.task('role:get', { name: roleName }).then((result) => {
            roleUuid = result.rows[0].uuid

            cy.createUser({ ...user, roleUuid })
            cy.task('user:activate', { email: user.email, active: true })
            cy.task('user:setToursDone', { email: user.email })
            cy.clearServerCache()
        })
    })

    beforeEach(() => {
        // make sure there is nothing left from a previous (possibly failed) run
        deleteTestData()

        // reset the role so that it has no permissions
        openRole()
        cy.get(`#permission-${permissions.settingsManage}`).should('exist')
        cy.get('body').then(($body) => {
            // nothing to reset, the form would not be dirty and there would be no submit button
            if ($body.find('input[id^="permission-"]:checked').length === 0) return

            Object.values(permissions).forEach((permission) => {
                cy.uncheckToggle(`permission-${permission}`)
            })
            saveRole()
        })
    })

    after(() => {
        cleanUp()
    })

    it('Manage Project Templates', () => {
        loginAsTestUser()

        // create a project, the project template option is not available in its settings
        project.create(projectName, packageName)
        project.openSettings()
        cy.get('#isTemplate').should('not.exist')

        addPermission(permissions.projectTemplatesManage)

        // the project can be set as a project template now
        loginAsTestUser()
        project.open(projectName)
        project.openSettings()
        cy.checkToggle('isTemplate')
        project.saveSettings()

        // check it was saved
        project.open(projectName)
        project.openSettings()
        cy.expectToggleChecked('isTemplate')
    })

    it('View ALL Projects', () => {
        // create a project as somebody else
        cy.loginAs('datasteward')
        project.create(projectName, packageName)

        // the project is not visible to the test user
        loginAsTestUser()
        cy.visitApp('/projects')
        cy.expectEmptyListing()

        addPermission(permissions.projectsView)

        // the project is visible now, but read only and without comments
        loginAsTestUser()
        project.open(projectName)
        project.expectViewer()
    })

    it('Comment on ALL Projects', () => {
        // create a project as somebody else
        cy.loginAs('datasteward')
        project.create(projectName, packageName)

        // with the view permission only, the project is read only
        addPermission(permissions.projectsView)
        loginAsTestUser()
        project.open(projectName)
        project.expectViewer()

        addPermission(permissions.projectsComment)

        // the project can be commented on now
        loginAsTestUser()
        project.open(projectName)
        project.expectCommenter()
    })

    it('Edit ALL Projects', () => {
        // create a project as somebody else
        cy.loginAs('datasteward')
        project.create(projectName, packageName)

        // with the comment permission, the project can only be commented on
        addPermission(permissions.projectsView, permissions.projectsComment)
        loginAsTestUser()
        project.open(projectName)
        project.expectCommenter()

        addPermission(permissions.projectsEdit)

        // the project can be edited now
        loginAsTestUser()
        project.open(projectName)
        project.expectEditor()
    })

    it('Manage ALL Projects', () => {
        // create a project as somebody else
        cy.loginAs('datasteward')
        project.create(projectName, packageName)

        // with the edit permission, the project can only be edited
        addPermission(permissions.projectsView, permissions.projectsComment, permissions.projectsEdit)
        loginAsTestUser()
        project.open(projectName)
        project.expectEditor()

        addPermission(permissions.projectsManage)

        // the project can be managed as if the test user was the owner now
        loginAsTestUser()
        project.open(projectName)
        project.expectOwner()
    })

    it('Use Knowledge Model Editor', () => {
        // knowledge model editors are not available to the test user
        loginAsTestUser()
        cy.visitApp('/dashboard')
        cy.get('#menu_knowledge-models').should('not.exist')
        cy.visitApp('/knowledge-model-editors')
        cy.expectNotAllowed()

        addPermission(permissions.knowledgeModelsManage, permissions.knowledgeModelEditorsUse)

        // a knowledge model editor can be created now
        loginAsTestUser()
        cy.visitApp('/knowledge-model-editors')
        cy.getCy('km-editor_create-button').click()
        cy.url().should('contain', '/knowledge-model-editors/create')
        cy.fillFields({
            name: kmEditorName,
            kmId: kmEditorKmId,
            'version-major': '1',
            'version-minor': '0',
            'version-patch': '0'
        })
        cy.submitForm()
        cy.url().should('contain', '/knowledge-model-editors/editor/')

        cy.visitApp('/knowledge-model-editors')
        cy.getListingItem(kmEditorKmId).should('contain', kmEditorName)
    })

    it('Manage Knowledge Models', () => {
        // knowledge models are not in the menu and cannot be imported nor deleted
        loginAsTestUser()
        cy.visitApp('/dashboard')
        cy.get('#menu_knowledge-models').should('not.exist')

        cy.visitApp('/knowledge-models')
        cy.expectListingItemAction(packageName, 'delete', false)

        cy.visitApp('/knowledge-models/import')
        cy.expectNotAllowed()

        addPermission(permissions.knowledgeModelsManage)

        // a knowledge model can be imported now
        loginAsTestUser()
        cy.visitApp('/knowledge-models/import')
        cy.getCy('dropzone').selectFile(`cypress/fixtures/${importedKmFixture}`, {
            action: 'drag-drop'
        })
        cy.getCy('file-import_file').should('exist')
        cy.clickBtn('Import')
        cy.expectSuccessFlashMessage()

        cy.visitApp('/knowledge-models')
        cy.getListingItem(importedKmName).should('exist')

        // and deleted again
        cy.clickListingItemAction(importedKmName, 'delete')
        cy.clickModalAction()
        cy.fillFields({ 'km-delete-confirm': importedKmPackageId })
        cy.clickModalAction()
        cy.expectListingItemNotExist(importedKmName)
    })

    it('Use Document Template Editor', () => {
        // document template editors are not available to the test user
        loginAsTestUser()
        cy.visitApp('/dashboard')
        cy.get('#menu_document-templates').should('not.exist')
        cy.visitApp('/document-template-editors')
        cy.expectNotAllowed()

        addPermission(permissions.documentTemplatesManage, permissions.documentTemplateEditorsUse)

        // a document template editor can be created now
        loginAsTestUser()
        cy.visitApp('/document-template-editors')
        cy.getCy('document-template-editors_create-button').click()
        cy.url().should('contain', '/document-template-editors/create')
        cy.fillFields({
            name: dtEditorName,
            templateId: dtEditorTemplateId,
            'version-major': '1',
            'version-minor': '0',
            'version-patch': '0',
        })
        cy.submitForm()
        documentTemplates.getDocumentTemplateUuid(`dsw:${dtEditorTemplateId}:1.0.0`).then((uuid) => {
            cy.url().should('contain', `/document-template-editors/${uuid}`)
        })

        cy.visitApp('/document-template-editors')
        cy.getListingItem(dtEditorTemplateId).should('contain', dtEditorName)
    })

    it('Manage Document Templates', () => {
        // there has to be a document template to work with
        cy.importTemplate(dtFixture)

        // document templates are not in the menu and cannot be imported nor deleted
        loginAsTestUser()
        cy.visitApp('/dashboard')
        cy.get('#menu_document-templates').should('not.exist')

        cy.visitApp('/document-templates')
        cy.expectListingItemAction(dtName, 'delete', false)

        cy.visitApp('/document-templates/import')
        cy.expectNotAllowed()

        addPermission(permissions.documentTemplatesManage)

        // the document template can be deleted now
        loginAsTestUser()
        cy.visitApp('/document-templates')
        cy.clickListingItemAction(dtName, 'delete')
        cy.clickModalAction()
        cy.expectEmptyListing()

        // and imported again
        cy.visitApp('/document-templates/import')
        cy.getCy('dropzone').selectFile(`cypress/fixtures/${dtFixture}`, {
            action: 'drag-drop'
        })
        cy.getCy('file-import_file').should('exist')
        cy.clickBtn('Import')
        cy.expectSuccessFlashMessage()

        cy.visitApp('/document-templates')
        cy.getListingItem(dtName).should('exist')
    })

    it('Manage Locales', () => {
        // locales are not in the menu and cannot be opened nor imported
        loginAsTestUser()
        cy.visitApp('/dashboard')
        cy.get('#menu_administration').should('not.exist')

        cy.visitApp('/locales')
        cy.expectNotAllowed()

        cy.visitApp('/locales/import')
        cy.expectNotAllowed()

        addPermission(permissions.settingsManage)

        // a locale can be imported now
        loginAsTestUser()
        cy.visitApp('/locales/import')
        cy.getCy('dropzone').selectFile(`cypress/fixtures/${localeFixture}`, {
            action: 'drag-drop'
        })
        cy.getCy('file-import_file').should('exist')
        cy.clickBtn('Import')
        cy.expectSuccessFlashMessage()
        cy.clickBtn('Done')

        cy.visitApp('/locales')
        cy.getListingItem(localeName).should('exist')

        // and deleted again
        cy.clickListingItemAction(localeName, 'delete')
        cy.clickModalAction()
        cy.expectListingItemNotExist(localeName)
    })

    it('Manage Users', () => {
        // users are not in the menu and cannot be listed nor created
        loginAsTestUser()
        cy.visitApp('/dashboard')
        cy.get('#menu_administration').should('not.exist')

        cy.visitApp('/users')
        cy.expectNotAllowed()

        cy.visitApp('/users/create')
        cy.expectNotAllowed()

        addPermission(permissions.usersManage)

        // a user can be created now
        loginAsTestUser()
        cy.visitApp('/users')
        cy.getCy('users_create-button').click()
        cy.fillFields({
            email: createdUser.email,
            firstName: createdUser.firstName,
            lastName: createdUser.lastName,
            s_roleUuid: researcherRoleUuid,
            password: createdUser.password
        })
        cy.submitForm()

        cy.url().should('match', /\/users$/)
        cy.getListingItem(createdUser.email)
            .should('contain', createdUser.firstName)
            .and('contain', createdUser.lastName)

        // and deleted again
        cy.clickListingItemAction(createdUser.email, 'delete')
        cy.expectModalOpen('users-delete')
        cy.clickModalAction()
        cy.expectListingItemNotExist(createdUser.email)
    })

    it('Manage Settings', () => {
        // settings are not in the menu and cannot be opened
        loginAsTestUser()
        cy.visitApp('/dashboard')
        cy.get('#menu_administration').should('not.exist')

        cy.visitApp('/settings/organization')
        cy.expectNotAllowed()

        addPermission(permissions.settingsManage)

        // the organization settings can be changed now
        loginAsTestUser()
        cy.visitApp('/settings/organization')
        cy.fillFields({ description: organizationDescription })
        cy.submitForm()

        // reload the page and check the value was saved
        cy.visitApp('/settings/organization')
        cy.checkFields({ description: organizationDescription })
    })
})
