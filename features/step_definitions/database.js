const _ = require('lodash')
const uuidv4 = require('uuid/v4')
const { MongoClient } = require('mongodb')
const { Given } = require('cucumber')
const scope = require('../support/scope')


Given('There is the following {string} in the database:', createDatabaseEntry)


const factories = {
    "user": createUser
}


async function createDatabaseEntry(collection, data) {
    const client = await MongoClient.connect(scope.mongodb.url)
    const db = client.db(scope.mongodb.database)
    const entity = factories[collection](data.hashes()[0])
    await db.collection(collection + 's').insertOne(entity)
    return await client.close()
}


function entityBase() {
    return { uuid: uuidv4() }
}


function withTimestamps() {
    return {
        createdAt: new Date(),
        updatedAt: new Date()
    }
}


function createUser(data) {
    const user = {
        name: 'name',
        surname: 'surname',
        email: 'email',
        passwordHash: 'sha256|17|KOj9LS2y8IXDvo0DG8EW8A==|rduRLWmC7xAKKPAV0DHK2LQiaptQ4Xn3cWZgwuXmqMc=',
        role: 'RESEARCHER',
        permissions: ['PM_READ_PERM', 'QTN_PERM', 'DMP_PERM'],
        isActive: true
    }
    return _.merge(entityBase(), withTimestamps(), user, data)
}
