const { When, Then } = require('cucumber')
const scope = require('../support/scope')

module.exports = { clickButton }


When('I click {string} menu link', clickMenuLink)
When('I click {string} button', clickButton)

Then('I should be at {string} page', awaitPage)


/**
 * Sometimes, when clicking specific button we need to wait for specific page
 * defined in this object.
 */
const waitForClick = {
    'Create User': '.Users__Create'
}

/**
 * Defines what element we should wait for when navigating to a specific page
 * Used by assertPage and clickMenuLink.
 */
const waitForPage = {
    'Users': '.Users__Index'
}

async function clickMenuLink(item) {
    const escaped = escapeXpathString(item)
    const xpath = `//div[contains(@class, 'side-navigation')]//ul[contains(@class, 'menu')]//span[contains(text(), ${escaped})]/parent::*`
    await clickByXpath(xpath)
    return await scope.context.currentPage.waitForSelector(waitForPage[item])
}

async function clickButton(text) {
    const escaped = escapeXpathString(text)
    const xpath = `//*[contains(@class, 'btn') and contains(text(), ${escaped})]`
    const promise = clickByXpath(xpath)

    if (waitForClick[text]) {
        await promise
        return await scope.context.currentPage.waitForSelector(waitForClick[text])
    }

    return promise
}

function escapeXpathString(str) {
    const splitedQuotes = str.replace(/'/g, `', "'", '`)
    return `concat('${splitedQuotes}', '')`
}

async function clickByXpath(xpath) {
    const elements = await scope.context.currentPage.$x(xpath)
    if (elements.length > 0) {
        return await elements[0].click()
    } else {
        throw new Error(`Element not found ${xpath}`)
    }
}

async function awaitPage(expectedHeader) {
    await scope.context.currentPage.waitForSelector(waitForPage[expectedHeader])
}
