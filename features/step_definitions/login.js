const { Given } = require('cucumber')
const scope = require('../support/scope')
const { fillInput } = require('./forms')
const { clickButton} = require('./navigation')


Given('I am logged in as {string}', { timeout: 10000 }, loginAs)


async function loginAs(role) {
    await openHomepage()

    await fillInput('email', scope.users[role].username)
    await fillInput('password', scope.users[role].password)
    await clickButton('Log in')

    return await scope.context.currentPage.waitForSelector('.app-view ')
}

async function openHomepage() {
    if (!scope.browser) {
        scope.browser = await scope.driver.launch({ headless: scope.options.headless })
    }
    scope.context.currentPage = await scope.browser.newPage()
    scope.context.currentPage.setViewport({ width: 1280, height: 1024 })

    return await scope.context.currentPage.goto(scope.url, { waitUntil: 'networkidle0' })
}
