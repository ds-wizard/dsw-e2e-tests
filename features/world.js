require('dotenv').config()
const { setWorldConstructor } = require('cucumber')
const { Db, MongoClient, Server } = require('mongodb')
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

    scope.mongodb = createMongoConfiguration()
}

function createMongoConfiguration() {
    const host = readEnv('MONGODB_HOST', 'localhost')
    const port = readEnvInt('MONGODB_PORT', 27017)
    const database = readEnv('MONGODB_DBNAME', 'dsw-server-test')
    return {
        url:  `mongodb://${host}:${port}/${database}`,
        database
    }
}

function createMongoClient() {
    return new MongoClient(
        new Server(readEnv('MONGODB_HOST', 'localhost'), readEnvInt('MONGODB_PORT', 27017)),
        { native_parser: true }
    )
}

function readEnv(env, defaultValue) {
    return process.env[env] !== undefined ? process.env[env] : defaultValue
}

function readEnvInt(env, defaultValue) {
    return process.env[env] !== undefined ? parseInt(process.env[env]) : defaultValue
}


setWorldConstructor(World)
