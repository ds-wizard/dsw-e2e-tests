const { Then } = require('cucumber')
const assert = require('cucumber-assert')
const scope = require('../support/scope')


Then('I should see in table:', tableContains)


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
