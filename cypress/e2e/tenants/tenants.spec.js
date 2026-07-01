describe('Tenants', () => {
    const superAdmin = {
        email: 'galileo.galilei@example.com',
        firstName: 'Galileo',
        lastName: 'Galilei',
        role: 'admin',
        password: 'Galileo\'s p455w0rd'
    }

    const tenant = {
        tenantId: 'institution',
        tenantName: 'My Institution',
        email: 'clarice.farley@example.com',
        firstName: 'Clarice',
        lastName: 'Farley'
    }

    const newApp = {
        tenantId: 'university',
        name: 'Very Nice University'
    }

    const createApp = () => {
        cy.visitApp('/tenants')
        cy.clickBtn(/^Create$/)
        cy.fillFields(tenant)
        cy.clickBtn('Create')
        cy.getListingItem(tenant.tenantName).find('.title a').click()
    }

    const expectAppName = (tenantName) => {
        cy.getCy('detail-page_header-title').contains(tenantName).should('exist')
    }

    const expectAppId = (tenantId) => {
        cy.getCy('detail-page_metadata_tenant-id').contains(tenantId).should('exist')
    }

    const expectEnabled = () => {
        cy.getCy('detail-page_metadata_enabled').find('.badge.bg-success').contains('Enabled').should('exist')
    }

    before(() => {
        cy.task('user:delete', { email: superAdmin.email })
        cy.createUser(superAdmin)
        cy.task('user:addPermission', { perm: 'TenantsManageRolePermission', email: superAdmin.email })
    })

    beforeEach(() => {
        cy.task('tenant:delete', { tenant_id: tenant.tenantId })
        cy.task('tenant:delete', { tenant_id: newApp.tenantId })
        cy.loginWith(superAdmin.email, superAdmin.password)
    })


    after(() => {
        cy.task('tenantLimit:reset', { uuid: '00000000-0000-0000-0000-000000000000' })
    })


    it('create and edit tenant', () => {
        // Create tenant
        createApp()

        // Check it was created correctly
        expectAppName(tenant.tenantName)
        expectAppId(tenant.tenantId)
        expectEnabled()

        // Edit tenant
        cy.getCy('tenant-detail_edit').click()
        cy.fillFields(newApp)
        cy.clickModalAction()
        cy.getCy('modal_tenant-edit').should('not.be.visible')

        // Check it was edited correctly
        expectAppName(newApp.name)
        expectAppId(newApp.tenantId)
        expectEnabled()
    })
})
