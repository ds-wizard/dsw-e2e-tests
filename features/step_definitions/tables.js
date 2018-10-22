const { Then, When } = require('cucumber')
const assert = require('cucumber-assert')
const scope = require('../support/scope')


When('I click {string} action icon where {string} is {string}', clickTableActionIcon)

Then('I should see in table:', tableContains)


async function clickTableActionIcon(icon, columnName, columnValue) {
    await scope.context.currentPage.waitForSelector('.index-table')

    const actionLink = await scope.context.currentPage.evaluateHandle((icon, columnName, columnValue) => {
        const ths = [...document.querySelectorAll('.index-table thead tr th')].map(th => th.textContent)
        const columnIndex = ths.indexOf(columnName)

        const tr = [...document.querySelectorAll('.index-table tbody tr')].filter(tr => {
            const tds = [...tr.querySelectorAll('td')].map(td => td.textContent)
            return tds[columnIndex] === columnValue
        })[0]

        return tr.querySelector(`i.fa-${icon}`).closest('a')
    }, icon, columnName, columnValue)

    if (icon == 'edit') {
        await actionLink.click()
        return await scope.context.currentPage.waitForSelector('.form-actions')
    }

    return await actionLink.click()
}


/**
 * Check if the table contains expected values. It tries to find each row
 * defined in the dataTable in the actual table.
 *
 * @param dataTable
 */
async function tableContains(dataTable) {
    await scope.context.currentPage.waitForSelector('.index-table')

    const rows = dataTable.hashes()

    const ths = await scope.context.currentPage.evaluate(() =>
        [...document.querySelectorAll('.index-table thead tr th')].map(th => th.textContent))

    const trs = await scope.context.currentPage.evaluate(() =>
        [...document.querySelectorAll('.index-table tbody tr')].map(tr =>
            [...tr.querySelectorAll('td')].map(td => td.textContent)))

    const promises = rows.map(row => {
        return assert.equal(trs.some(tds => match(ths, tds, row)), true)
    })
    return Promise.all(promises)
}

/**
 * Check if the values in tds at positions defined by ths match expected row
 * values.
 *
 * Example ths:
 *     ["Name", "Surname", "Email", "Role", "Actions"]
 *
 * Example tds
 *     ["John", "Brown", "john.brown@example.com", "RESEARCHER", "..."]
 *
 * Example row:
 *     { "Name": "John", "Surname": "Brown" }
 *
 * Notice that row doesn't have to contain all keys from the table, it contains
 * name of the column and expected value. Array ths is used to find the index
 * of the column where the value in tds is.
 *
 *
 * @param ths Array of table headers
 * @param tds Array of values in given table row
 * @param row Expected row values object
 */
function match(ths, tds, row) {
    for (const [key, value] of Object.entries(row)) {
        const index = ths.indexOf(key)
        if (tds[index] !== value) {
            return false
        }
    }
    return true
}
