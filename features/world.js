require('dotenv').config()
const { setWorldConstructor } = require('cucumber')
const puppeteer = require('puppeteer')
const scope = require('./support/scope')

const World = function () {
    scope.driver = puppeteer
    scope.context = {}
    scope.url = process.env.URL
    scope.users = {
        ADMIN: {
            username: process.env.ADMIN_USERNAME,
            password: process.env.ADMIN_PASSWORD
        },
        DATASTEWARD: {
            username: process.env.DATASTEWARD_USERNAME,
            password: process.env.DATASTEWARD_PASSWORD
        },
        RESEARCHER: {
            username: process.env.RESEARCHER_USERNAME,
            password: process.env.RESEARCHER_PASSWORD
        }
    }
    scope.options = {
        headless: process.env.HEADLESS !== undefined ? parseInt(process.env.HEADLESS) : 1
    }
}

setWorldConstructor(World)