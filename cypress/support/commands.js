// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add("login", (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add("drag", { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add("dismiss", { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This is will overwrite an existing command --
// Cypress.Commands.overwrite("visit", (originalFn, url, options) => { ... })

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


Cypress.Commands.add('visitApp', (url) => {
    cy.visit(`${Cypress.env('url')}${url}`)
})


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


Cypress.Commands.add('createKMEditor', ({ kmId, name, parentPackageId }) => {
    getTokenFor('datasteward').then((resp) => {
        cy.request({
            method: 'POST',
            url: apiUrl('/branches'),
            headers: createHeaders(resp.body.token),
            body: { kmId, name, parentPackageId, organizationId: null }
        })
    })
})


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


Cypress.Commands.add('getIndexTableRow', (identifier) => {
    cy.get('.index-table tr').contains(identifier).parent('tr')
})


Cypress.Commands.add('clickIndexTableAction', (identifier, action) => {
    cy.getIndexTableRow(identifier).contains(action).click({ force: true })
})


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
        cy.get(`#${key}`).should('have.value', value)
    })
})


Cypress.Commands.add('clickBtn', (label) => {
    cy.get('.btn').filter(':visible').contains(label).click()
})


Cypress.Commands.add('clickLink', (label) => {
    cy.get('a').contains(label).click()
})


Cypress.Commands.add('expectAlert', (type, text) => {
    cy.get(`.alert-${type}`).should('contain', text)
})