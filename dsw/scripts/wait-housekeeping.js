#!/usr/bin/env node

const request = require('@cypress/request');

const wizardApiUrl = 'http://localhost:3000/wizard-api'
const wizardBootstrapConfig = `${wizardApiUrl}/configs/bootstrap?clientUrl=http%3A%2F%2Flocalhost%3A8080%2Fwizard`

function log(message) {
    process.stdout.write(message)
}

function waitForWizard(cb) {
    log('Waiting for wizard server... ')
    request({
        method: 'GET',
        url: wizardBootstrapConfig,
        json: true
    }, (error, response, body) => {
        if (error) {
            log('not ready, retrying\n')
            setTimeout(() => waitForWizard(cb), 3000)
        } else if (body.type === 'HousekeepingInProgressClientConfig') {
            log('housekeeping in progress, retrying\n')
            setTimeout(() => waitForWizard(cb), 3000)
        } else {
            log('ready\n')
            cb()
        }
    })
}

waitForWizard(() => {
    process.exit(0)
})
