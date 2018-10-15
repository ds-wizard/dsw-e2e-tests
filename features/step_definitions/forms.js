const { When } = require('cucumber')
const scope = require('../support/scope')

module.exports = { fillInput }


When('I fill {string} with {string}', fillInput)


async function fillInput(input, value) {
    await scope.context.currentPage.focus(`#${input}`)
    return await scope.context.currentPage.keyboard.type(value)
}
