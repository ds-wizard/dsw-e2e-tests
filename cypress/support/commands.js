import { dataCy } from './utils'


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
                fullscreen: false,
                v6: true
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

Cypress.Commands.add('submitForm', () => {
    cy.getCy('form_submit').click()
    cy.getCy('form_submit').find('.fa-spinner').should('not.exist')
})

// Modals

Cypress.Commands.add('clickModalAction', () => {
    cy.getCy('modal_action-button').filter(':visible').click()
})

Cypress.Commands.add('clickModalCancel', () => {
    cy.getCy('modal_cancel-button').filter(':visible').click()
})

Cypress.Commands.add('expectModalOpen', (modal, open = true) => {
    cy.getCy(`modal_${modal}`).should(open ? 'be.visible' : 'not.be.visible')
})


// Messages

Cypress.Commands.add('expectSuccessFlashMessage', () => {
    cy.getCy('flash_alert-success').filter(':visible').should('exist')
})

Cypress.Commands.add('expectSuccessPageMessage', () => {
    cy.getCy('message_success').filter(':visible').should('exist')
})

// Selection commands

Cypress.Commands.add('getCy', (key, extra = '') => {
    return cy.get(`${dataCy(key)}${extra}`)
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
    getTokenFor('admin').then((resp) => {
        cy.fixture(km).then(body => {
            cy.request({
                method: 'POST',
                url: apiUrl('/packages'),
                headers: createHeaders(resp.body.token),
                body
            })
        })
    })
})


// Templates commands

Cypress.Commands.add('removeTemplate', (templateId) => {
    getTokenFor('admin').then((resp) => {
        cy.task('document:delete', { template_id: templateId })
        cy.task('questionnaire:delete', { template_id: templateId })

        cy.request({
            method: 'DELETE',
            url: apiUrl(`/templates/${templateId}`),
            headers: createHeaders(resp.body.token),
            failOnStatusCode: false
        })
    })
})


Cypress.Commands.add('importTemplate', (templatePath) => {
    getTokenFor('admin').then((resp) => {
        cy.fixture(templatePath, 'binary')
            .then((binary) => Cypress.Blob.binaryStringToBlob(binary))
            .then((template) => {
                return new Promise((resolve, reject) => {
                    const data = new FormData()
                    data.set('file', template)

                    const xhr = new XMLHttpRequest()

                    xhr.onload = () => {
                        if (xhr.status >= 300) {
                            reject({ request: xhr })
                        } else {
                            resolve(xhr)
                        }
                    }

                    xhr.onerror = () => {
                        reject({ request: xhr })
                    }

                    xhr.open('POST', apiUrl('/templates/bundle'))
                    xhr.setRequestHeader('Authorization', `Bearer ${resp.body.token}`)
                    xhr.send(data)
                })
            })
    })
})


// Questionnaires commands

Cypress.Commands.add('createQuestionnaire', ({ visibility, sharing, name, packageId, templateId }) => {
    getTokenFor('researcher').then((resp) => {
        cy.request({
            method: 'POST',
            url: apiUrl('/questionnaires'),
            headers: createHeaders(resp.body.token),
            body: { visibility, sharing, name, packageId, templateId, questionTagUuids: [] }
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
                body: { visibility, sharing, name, packageId, questionTagUuids: [] }
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
    cy.getCy('listing_item').contains(identifier).closest(dataCy('listing_item'))
})


Cypress.Commands.add('clickListingItemAction', (identifier, action) => {
    cy.getListingItem(identifier).find(dataCy(`listing-item_action_${action}`)).click({ force: true })
})


Cypress.Commands.add('expectListingItemNotExist', (identifier) => {
    cy.getCy('listing_list').contains(identifier).should('not.exist')
})


Cypress.Commands.add('expectEmptyListing', () => {
    cy.getCy('illustrated-message_listing-empty').should('exist')
})


Cypress.Commands.add('expectError', () => {
    cy.getCy('illustrated-message_error').should('exist')
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
        } else if (key.startsWith('c_')) {
            key = key.replace(/^c_/, '')
            if (value) {
                cy.get(`#${key}`).check()
            } else {
                cy.get(`#${key}`).uncheck()
            }
        } else {
            if (value.length > 0) {
                cy.get(`#${key}`).clear().type(value)
            } else {
                cy.get(`#${key}`).clear()
            }
        }
    })
})


Cypress.Commands.add('clearTypeHintInput', (field) => {
    cy.get(`#${field} .TypeHintInput__Value a`).click()
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


// Cache
Cypress.Commands.add('clearServerCache', () => {
    cy.request({
        method: 'DELETE',
        url: apiUrl('/caches'),
        headers: createHeaders(Cypress.env('serviceToken'))
    })
})
