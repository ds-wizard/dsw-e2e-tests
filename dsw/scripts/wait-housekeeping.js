#!/usr/bin/env node

const request = require('@cypress/request')

const bootstrapUrl = 'http://localhost:3000/api/bootstrap?clientUrl=http%3A%2F%2Flocalhost%3A8080'

function log(message) {
    process.stdout.write(message)
}

function waitForServer(cb) {
    log('Waiting for wizard server... ')
    request({
        method: 'GET',
        url: bootstrapUrl,
        json: true
    }, (error, response, body) => {
        if (error || !body) {
            log('not ready, retrying\n')
            setTimeout(() => waitForServer(cb), 3000)
        } else if (body.type === 'HousekeepingInProgressBootstrap') {
            log('housekeeping in progress, retrying\n')
            setTimeout(() => waitForServer(cb), 3000)
        } else {
            log('ready\n')
            cb()
        }
    })
}

waitForServer(() => {
    process.exit(0)
})
