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


Cypress.Commands.add('visitApp', (url) => {
    cy.visit(`${Cypress.env('url')}${url}`)
})


Cypress.Commands.add('loginAs', (role) => {
    cy.request({
        method: 'POST',
        url: apiUrl('/tokens'),
        body: {
            email: Cypress.env(role + '_username'),
            password: Cypress.env(role + '_password')
        }
    }).then((resp) => {
        const token = resp.body.token

        cy.request({
            method: 'GET',
            url: apiUrl('/users/current'),
            headers: {
                Authorization: 'Bearer ' + token
            }
        }).then((resp) => {
            window.localStorage.setItem('session', JSON.stringify({
                sidebarCollapsed: false,
                token,
                user: resp.body
            }))
        })
    })
})