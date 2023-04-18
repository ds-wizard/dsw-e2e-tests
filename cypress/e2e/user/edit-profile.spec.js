describe('Edit profile', () => {
    const user = {
        email: 'alex.day@example.com',
        firstName: 'Alex',
        lastName: 'Day',
        role: 'researcher',
        password: 'StronkPassw0rd',
    }

    const newUser = {
        firstName: 'Gabe',
        lastName: 'Anderson'
    }

    const login = () => {
        cy.visitApp('/')
        cy.fillFields({ email: user.email, password: user.password })
        cy.submitForm()
        cy.url().should('contain', 'dashboard')
    }

    beforeEach(() => {
        cy.task('user:delete', { email: user.email })
        cy.clearServerCache()

        cy.createUser(user)
        cy.task('user:activate', { email: user.email, active: true })
    })

    it('can edit profile', () => {
        login()

        cy.get('.profile-name').should('contain', `${user.firstName} ${user.lastName}`)

        cy.getCy('menu_profile').click({ force: true })
        cy.fillFields({
            firstName: newUser.firstName,
            lastName: newUser.lastName
        })
        cy.submitForm()

        cy.get('.profile-name').should('contain', `${newUser.firstName} ${newUser.lastName}`)
    })

    it('API keys', () => {
        const keyName = 'My API Key'

        // login as researcher and go to API keys page
        login()
        cy.visitApp('/users/edit/current/api-keys')

        // create a new API keys
        cy.fillFields({ name: keyName })
        cy.get('.form-control-flatpickr[type=text]').click()
        cy.get('.cur-year').clear().type('2050')
        cy.get('.flatpickr-day').contains('13').click()
        cy.submitForm()

        // save the api key and finish
        cy.get('.CopyableCodeBlock code').then(($code) => {
            const apiKey = $code.text()
            cy.clickBtn('Done')

            // check api key is in the table
            cy.get('.table td').contains(keyName)

            // check api token actually works
            cy.request({
                method: 'GET',
                url: Cypress.env('api_url') + '/users/current',
                headers: { Authorization: `Bearer ${apiKey}` }
            }).then((resp) => {
                // check it returned info about the current user correctly
                expect(resp.body).to.have.property('email', user.email)
            })

            // delete token
            cy.get('.table .text-danger').click()
            cy.clickModalAction()

            // check that the api key no longer works
            cy.request({
                method: 'GET',
                url: Cypress.env('api_url') + '/users/current',
                headers: { Authorization: `Bearer ${apiKey}` },
                failOnStatusCode: false
            }).then((resp) => {
                // check it returned info about the current user correctly
                expect(resp.status).to.eq(401)
            })
        })
    })
})
