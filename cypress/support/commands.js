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
                token: { token },
                user: resp.body,
                v4: true
            }))
        })
    })
})

Cypress.Commands.add('logout', () => {
    window.localStorage.removeItem('session')
    cy.visitApp('/')
})


// Navigation commands

Cypress.Commands.add('visitApp', (url) => {
    cy.visit(`${Cypress.env('url')}${url}`)
    cy.get('.full-page-loader').should('not.exist')
})

Cypress.Commands.add('clickLink', (label) => {
    cy.get('a').contains(label).click()
})

Cypress.Commands.add('clickBtn', (label, force = false) => {
    const button = force ? cy.get('.btn') : cy.get('.btn').filter(':visible')
    button.contains(label).click()
})


// Selection commands

Cypress.Commands.add('getCy', (key) => {
    return cy.get(`[data-cy=${key}]`)
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

// Templates commands

Cypress.Commands.add('importTemplate', (template) => {
    cy.task('mongo:insertOne', {
        collection: 'templates',
        obj: template
    })
    cy.task('mongo:updateMany', {
        collection: 'templates',
        query: {},
        update: [{ "$set": { "createdAt": { "$toDate": "$createdAt" } } }]
    })
})


// Questionnaires commands

Cypress.Commands.add('createQuestionnaire', ({ visibility, sharing, name, packageId, templateId }) => {
    getTokenFor('researcher').then((resp) => {
        cy.request({
            method: 'POST',
            url: apiUrl('/questionnaires'),
            headers: createHeaders(resp.body.token),
            body: { visibility, sharing, name, packageId, templateId, tagUuids: [] }
        })
    })
})

Cypress.Commands.add('createQuestionnaires', (questionnaires) => {
    getTokenFor('researcher').then((resp) => {
        questionnaires.forEach(({ visibility, sharing, packageId, name }) => {
            cy.request({
                method: 'POST',
                url: apiUrl('/questionnaires'),
                headers: createHeaders(resp.body.token),
                body: { visibility, sharing, name, packageId, tagUuids: [] }
            })
        })
    })
})

Cypress.Commands.add('updateQuestionnaire', (questionnaireUuid, data) => {
    getTokenFor('researcher').then((resp) => {
        cy.request({
            method: 'PUT',
            url: apiUrl(`/questionnaires/${questionnaireUuid}`),
            headers: createHeaders(resp.body.token),
            body: data
        })
    })
})


Cypress.Commands.add('updateQuestionnaireContent', (questionnaireUuid, data) => {
    getTokenFor('researcher').then((resp) => {
        cy.request({
            method: 'PUT',
            url: apiUrl(`/questionnaires/${questionnaireUuid}/content`),
            headers: createHeaders(resp.body.token),
            body: data
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
            body: { kmId, name, previousPackageId }
        })
    })
})

// Documents command

Cypress.Commands.add('createDocuments', (documents) => {
    getTokenFor('researcher').then((resp) => {
        documents.forEach((body) => {
            cy.request({
                method: 'POST',
                url: apiUrl('/documents'),
                headers: createHeaders(resp.body.token),
                body
            })
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


Cypress.Commands.add('expectError', () => {
    cy.get('.full-page-illustrated-message').contains('Error')
})

// Form commands

Cypress.Commands.add('fillFields', (fields) => {
    Object.entries(fields).forEach(([key, value]) => {
        if (key.startsWith('s_')) {
            key = key.replace(/^s_/, '')
            cy.get(`#${key}`).select(value)
        } else if (key.startsWith('th_')) {
            key = key.replace(/^th_/, '')
            cy.get(`#${key}`).click()
            cy.get(`#${key} .TypeHintInput__TypeHints__Search`).type(value)
            cy.get(`#${key} .TypeHintInput__TypeHints ul li a`).contains(value).click()
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


Cypress.Commands.add('checkToggle', (field) => {
    cy.wait(100)
    cy.get(`#${field}`).check({ force: true })
})

Cypress.Commands.add('uncheckToggle', (field) => {
    cy.wait(100)
    cy.get(`#${field}`).uncheck({ force: true })
})


// Settings commands

Cypress.Commands.add('putDefaultAppConfig', () => {
    getTokenFor('admin').then((resp) => {
        cy.fixture('default-app-config').then((config) => {
            cy.request({
                method: 'PUT',
                url: apiUrl('/configs/app'),
                headers: createHeaders(resp.body.token),
                body: config
            })
        })
    })
})


// Custom expect commands

Cypress.Commands.add('expectAlert', (type, text) => {
    cy.get(`.alert-${type}`).should('contain', text)
})


// WebSockets

Cypress.Commands.add('wsSend', (url, msg) => {
    const ws = new WebSocket(apiUrl(url).replace('http', 'ws'))
    ws.addEventListener('open', () => {
        ws.send(JSON.stringify(msg))
        ws.close()
    })
}) 
