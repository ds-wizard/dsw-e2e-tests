const { Then } = require('cucumber')
const assert = require('cucumber-assert')
const scope = require('../support/scope')


Then('I should see success message {string}', assertSuccessMessage)


async function assertSuccessMessage(expectedMessage) {
    await scope.context.currentPage.waitForSelector('.alert-success')
    const actualMessage = await scope.context.currentPage.evaluate(() => {
        return document.querySelector('.alert-success').textContent
    })
    return await assert.equal(expectedMessage, actualMessage)
}