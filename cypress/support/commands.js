const apiUrl = (url) => Cypress.env('api_url') + url

const createHeaders = (token) => ({ Authorization: 'Bearer ' + token })

const getTokenFor = (role) => cy.request({
    method: 'POST',
    url: apiUrl('/tokens'),
    body: {
        email: Cypress.env(role + '_username'),
        password: Cypress.env(role + '_password')
    }
})


// Authentication commands

Cypress.Commands.add('loginAs', (role) => {
    getTokenFor(role).then((resp) => {
        const token = resp.body.token

        cy.request({
            method: 'GET',
            url: apiUrl('/users/current'),
            headers: createHeaders(token)
        }).then((resp) => {
            window.localStorage.setItem('session', JSON.stringify({
                sidebarCollapsed: false,
                token,
                user: resp.body
            }))
        })
    })
})

Cypress.Commands.add('logout', () => {
    window.localStorage.removeItem('session')
    cy.visitApp('/login')
})


// Navigation commands

Cypress.Commands.add('visitApp', (url) => {
    cy.visit(`${Cypress.env('url')}${url}`)
    cy.get('.full-page-loader').should('not.exist')
})

Cypress.Commands.add('clickLink', (label) => {
    cy.get('a').contains(label).click()
})

Cypress.Commands.add('clickBtn', (label) => {
    cy.get('.btn').filter(':visible').contains(label).click()
})


// Users commands

Cypress.Commands.add('createUser', (user) => {
    getTokenFor('admin').then((resp) => {
        cy.request({
            method: 'POST',
            url: apiUrl('/users'),
            headers: createHeaders(resp.body.token),
            body: user
        })
    })
})


// Knowledge Models commands

Cypress.Commands.add('importKM', (km) => {
    getTokenFor('datasteward').then((resp) => {
        cy.request({
            method: 'POST',
            url: apiUrl('/packages'),
            headers: createHeaders(resp.body.token),
            body: km
        })
    })
})


// Questionnaires commands

Cypress.Commands.add('createQuestionnaire', ({ accessibility, name, packageId }) => {
    getTokenFor('researcher').then((resp) => {
        cy.request({
            method: 'POST',
            url: apiUrl('/questionnaires'),
            headers: createHeaders(resp.body.token),
            body: { accessibility, name, packageId, tagUuids: [] }
        })
    })
})


// KM Editor commands

Cypress.Commands.add('createKMEditor', ({ kmId, name, previousPackageId }) => {
    getTokenFor('datasteward').then((resp) => {
        cy.request({
            method: 'POST',
            url: apiUrl('/branches'),
            headers: createHeaders(resp.body.token),
            body: { kmId, name, previousPackageId, organizationId: null }
        })
    })
})


// Listing commands

Cypress.Commands.add('getListingItem', (identifier) => {
    cy.get('.Listing .list-group-item').contains(identifier).closest('.list-group-item')
})


Cypress.Commands.add('clickListingItemAction', (identifier, action) => {
    cy.getListingItem(identifier).contains(action).click({ force: true })
})


Cypress.Commands.add('expectListingItemNotExist', (identifier) => {
    cy.get('.Listing .list-group-item').contains(identifier).should('not.exist')
})


Cypress.Commands.add('expectEmptyListing', () => {
    cy.get('.full-page-illustrated-message').contains('No data')
})


// Form commands

Cypress.Commands.add('fillFields', (fields) => {
    Object.entries(fields).forEach(([key, value]) => {
        if (key.startsWith('s_')) {
            key = key.replace(/^s_/, '')
            cy.get(`#${key}`).select(value)
        } else {
            if (value.length > 0) {
                cy.get(`#${key}`).clear().type(value)
            } else {
                cy.get(`#${key}`).clear()
            }
        }
    })
})


Cypress.Commands.add('checkFields', (fields) => {
    Object.entries(fields).forEach(([key, value]) => {
        key = key.replace(/^s_/, '')
        cy.get(`#${key}`).should('have.value', value.replace('{{}', '{'))
    })
})


// Custom expect commands

Cypress.Commands.add('expectAlert', (type, text) => {
    cy.get(`.alert-${type}`).should('contain', text)
})
