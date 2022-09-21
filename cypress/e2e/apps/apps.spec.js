describe('Apps', () => {
    const superAdmin = {
        email: 'galileo.galilei@example.com',
        firstName: 'Galileo',
        lastName: 'Galilei',
        role: 'admin',
        password: 'Galileo\'s p455w0rd'
    }

    const app = {
        appId: 'institution',
        appName: 'My Institution',
        email: 'clarice.farley@example.com',
        firstName: 'Clarice',
        lastName: 'Farley'
    }

    const newApp = {
        appId: 'university',
        name: 'Very Nice University'
    }

    const createApp = () => {
        cy.visitApp('/apps')
        cy.clickBtn('Create')
        cy.fillFields(app)
        cy.clickBtn('Create')
        cy.getListingItem(app.appName).find('.title a').click()
    }

    const fillPlan = (plan, trial) => {
        cy.fillFields(plan)
        if (trial) {
            cy.checkToggle('test')
        } else {
            cy.uncheckToggle('test')
        }
        cy.clickModalAction()
        cy.getCy('modal_app_plan-edit').should('not.be.visible')
    }

    const createPlan = (plan, trial, expectActive) => {
        cy.getCy('app-detail_add-plan').click()
        fillPlan(plan, trial)
    }

    const expectAppName = (appName) => {
        cy.getCy('detail-page_header-title').contains(appName).should('exist')
    }

    const expectAppId = (appId) => {
        cy.getCy('detail-page_metadata_app-id').contains(appId).should('exist')
    }

    const expectEnabled = () => {
        cy.getCy('detail-page_metadata_enabled').find('.badge.bg-success').contains('Enabled').should('exist')
    }

    const expectDisabled = () => {
        cy.getCy('detail-page_metadata_enabled').find('.badge.bg-danger').contains('Disabled').should('exist')
    }

    const expectPlan = (plan, trial, expectActive) => {
        cy.getCy('plans-list_name').contains(plan.name).should('exist')
        if (trial) {
            cy.getCy('plans-list_name').find('.badge.bg-secondary').contains('Trial').should('exist')
        }

        cy.getCy('plans-list_name').find('.badge.bg-success').should(expectActive ? 'exist' : 'not.exist')
        cy.getCy('plans-list_users').contains(plan.users || '-').should('exist')
        cy.getCy('plans-list_from').contains(`${plan.sinceDay}. ${plan.sinceMonth}. ${plan.sinceYear}`).should('exist')
        cy.getCy('plans-list_to').contains(`${plan.untilDay}. ${plan.untilMonth}. ${plan.untilYear}`).should('exist')
    }


    before(() => {
        cy.task('user:delete', { email: superAdmin.email })
        cy.createUser(superAdmin)
        cy.task('user:addPermission', { perm: 'APP_PERM', email: superAdmin.email })
    })


    beforeEach(() => {
        cy.task('app:delete', { app_id: app.appId })
        cy.task('app:delete', { app_id: newApp.appId })
        cy.loginWith(superAdmin.email, superAdmin.password)
    })


    it('create and edit app', () => {
        // Create app
        createApp()

        // Check it was created correctly
        expectAppName(app.appName)
        expectAppId(app.appId)
        expectEnabled()

        // Edit app
        cy.getCy('app-detail_edit').click()
        cy.fillFields(newApp)
        cy.clickModalAction()
        cy.getCy('modal_app-edit').should('not.be.visible')

        // Check it was edited correctly
        expectAppName(newApp.name)
        expectAppId(newApp.appId)
        expectEnabled()
    })


    it('add past plan', () => {
        createApp()

        const plan = {
            name: 'Past plan',
            users: '10',
            sinceDay: '10',
            sinceMonth: '10',
            sinceYear: '2020',
            untilDay: '20',
            untilMonth: '12',
            untilYear: '2020',
        }
        createPlan(plan, true, false)
        expectPlan(plan, true, false)
        expectDisabled()
    })


    it('add current plan', () => {
        createApp()

        const plan = {
            name: 'Current plan',
            users: '10',
            sinceDay: '10',
            sinceMonth: '10',
            sinceYear: '2020',
            untilDay: '20',
            untilMonth: '12',
            untilYear: '2050',
        }
        createPlan(plan, false, true)
        expectPlan(plan, false, true)
        expectEnabled()
    })


    it('add future plan', () => {
        createApp()

        const plan = {
            name: 'Future plan',
            users: '10',
            sinceDay: '10',
            sinceMonth: '10',
            sinceYear: '2070',
            untilDay: '20',
            untilMonth: '12',
            untilYear: '2080',
        }
        createPlan(plan, false, false)
        expectPlan(plan, false, false)
        expectDisabled()
    })


    it('edit plan', () => {
        createApp()

        // create current plan
        const plan = {
            name: 'Current plan',
            users: '10',
            sinceDay: '10',
            sinceMonth: '10',
            sinceYear: '2020',
            untilDay: '24',
            untilMonth: '12',
            untilYear: '2050',
        }
        createPlan(plan, false, true)
        expectPlan(plan, false, true)
        expectEnabled()

        // edit it to be a past plan
        const plan2 = {
            name: 'Past plan now',
            users: '13',
            sinceDay: '10',
            sinceMonth: '10',
            sinceYear: '2020',
            untilDay: '23',
            untilMonth: '12',
            untilYear: '2020',
        }
        cy.getCy('app-detail_plan_edit').click()
        fillPlan(plan2, true)
        expectPlan(plan2, true, false)
        expectDisabled()

        // edit it to be a future plan
        const plan3 = {
            name: 'Future plan now',
            users: '16',
            sinceDay: '10',
            sinceMonth: '10',
            sinceYear: '2060',
            untilDay: '22',
            untilMonth: '12',
            untilYear: '2070',
        }
        cy.getCy('app-detail_plan_edit').click()
        fillPlan(plan3, false)
        expectPlan(plan3, false, false)
        expectDisabled()

        // edit it to be a current plan again
        const plan4 = {
            name: 'Current plan now',
            users: '19',
            sinceDay: '10',
            sinceMonth: '10',
            sinceYear: '2000',
            untilDay: '21',
            untilMonth: '12',
            untilYear: '2070',
        }
        cy.getCy('app-detail_plan_edit').click()
        fillPlan(plan4, false)
        expectPlan(plan4, false, true)
        expectEnabled()
    })


    it('delete plan', () => {
        createApp()

        // create current plan
        const plan = {
            name: 'Current plan',
            users: '10',
            sinceDay: '10',
            sinceMonth: '10',
            sinceYear: '2020',
            untilDay: '24',
            untilMonth: '12',
            untilYear: '2050',
        }
        createPlan(plan, false, true)
        expectPlan(plan, false, true)
        expectEnabled()

        cy.getCy('app-detail_plan_delete').click()
        cy.clickModalAction()
        cy.getCy('modal_app_plan-delete').should('not.be.visible')
        expectDisabled()
    })
})