require('dotenv').config()
const { setWorldConstructor } = require('cucumber')
const puppeteer = require('puppeteer')
const scope = require('./support/scope')

const World = function () {
    scope.driver = puppeteer
    scope.context = {}
    scope.url = readEnv('URL', 'http://localhost:8080')
    scope.users = {
        ADMIN: {
            username: readEnv('ADMIN_USERNAME', 'albert.einstein@example.com'),
            password: readEnv('ADMIN_PASSWORD', 'password')
        },
        DATASTEWARD: {
            username: readEnv('DATASTEWARD_USERNAME', 'nikola.tesla@example.com'),
            password: readEnv('DATASTEWARD_PASSWORD', 'password')
        },
        RESEARCHER: {
            username: readEnv('RESEARCHER_USERNAME', 'isaac.newton@example.com'),
            password: readEnv('RESEARCHER_PASSWORD', 'password')
        }
    }
    scope.options = {
        headless: readEnvInt('HEADLESS', 1)
    }
}


function readEnv(env, defaultValue) {
    return process.env[env] !== undefined ? process.env[env] : defaultValue
}

function readEnvInt(env, defaultValue) {
    return process.env[env] !== undefined ? parseInt(process.env[env]) : defaultValue
}


setWorldConstructor(World)
