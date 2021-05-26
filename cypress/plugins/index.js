const { Client } = require('pg')

const initPostgres = (config) => {
  const createClient = () => {
    const client = new Client({
      user: config.env.pgUser,
      host: config.env.pgHost,
      database: config.env.pgDatabase,
      password: config.env.pgPassword,
      port: config.env.pgPort
    })
    client.connect()
    return client
  }

  const withClient = async (cb) => {
    const client = createClient()
    const result = await cb(client)
    client.end()
    return result
  }

  const createWhere = (where) => {
    const fields = Object.entries(where || {}).map(([field, value]) => `${field}='${value}'`).join(' AND ')
    return fields.length > 0 ? ` WHERE ${fields}` : ''
  }

  const createValues = (values) => {
    return Object.entries(values).map(([field, value]) => `${field}='${value}'`).join(', ')
  }

  return {
    query: (qs) => {
      return withClient(client => client.query(qs))
    },

    get: ({ table, where }) => {
      return withClient(client => client.query(`SELECT * FROM ${table}${createWhere(where)}`))
    },

    update: ({ table, values, where }) => {
      return withClient(client => client.query(`UPDATE ${table} SET ${createValues(values)}${createWhere(where)}`))
    },

    delete: ({ table, where }) => {
      return withClient(client => client.query(`DELETE FROM ${table}${createWhere(where)}`))
    }
  }
}



module.exports = (on, config) => {
  const pg = initPostgres(config)


  // Branch

  async function branchDelete(where) {
    const result = await pg.get({ table: 'branch', where })
    for (let i = 0; i < result.rows.length; i++) {
      const { uuid } = result.rows[i]
      await pg.delete({ table: 'km_migration', where: { branch_uuid: uuid } })
      await pg.delete({ table: 'branch', where: { uuid } })
    }
    return true
  }


  // Document

  async function documentDelete(where) {
    const result = await pg.get({ table: 'document', where })
    for (let i = 0; i < result.rows.length; i++) {
      const { uuid } = result.rows[i]
      await pg.delete({ table: 'document_queue', where: { document_uuid: uuid } })
      await pg.delete({ table: 'document', where: { uuid } })
    }
    return true
  }


  // Package

  async function packageDelete(where) {
    const result = await pg.get({ table: 'package', where })
    for (let i = 0; i < result.rows.length; i++) {
      const { id } = result.rows[i]
      await packageDelete({ previous_package_id: id })
      await packageDelete({ fork_of_package_id: id })
      await branchDelete({ previous_package_id: id })
      await questionnaireDelete({ package_id: id })
      await pg.delete({ table: 'km_migration', where: { branch_previous_package_id: id }})
      await pg.delete({ table: 'km_migration', where: { target_package_id: id }})
      await pg.delete({ table: 'package', where: { id } })
    }
    return true
  }

  async function packageGet(where) {
    const result = await pg.get({ table: 'package', where })
    return result.rows[0]
  }


  // Questionnaire

  async function questionnaireDelete(where) {
    const result = await pg.get({ table: 'questionnaire', where })
    for (let i = 0; i < result.rows.length; i++) {
      const { uuid } = result.rows[i]
      await documentDelete({ questionnaire_uuid: uuid })
      await pg.delete({ table: 'questionnaire_acl_user', where: { questionnaire_uuid: uuid } })
      await pg.delete({ table: 'questionnaire_acl_group', where: { questionnaire_uuid: uuid } })
      await pg.delete({ table: 'qtn_migration', where: { old_questionnaire_uuid: uuid } })
      await pg.delete({ table: 'qtn_migration', where: { new_questionnaire_uuid: uuid } })
      await pg.delete({ table: 'questionnaire', where: { uuid } })
    }
    return true
  }


  // User

  async function userActivate({ email }) {
    return pg.update({
      table: 'user_entity',
      values: { active: true },
      where: { email }
    })
  }

  async function userGetActionParams({ email, type }) {
    const result = await pg.query(`SELECT u.uuid, a.hash, a.type FROM user_entity u INNER JOIN action_key a ON u.uuid=a.user_id WHERE u.email='${email}' AND a.type='${type}'`)
    return [result.rows[0].uuid, result.rows[0].hash]
  }

  async function userDelete(where) {
    const result = await pg.get({ table: 'user_entity', where })
    for (let i = 0; i < result.rows.length; i++) {
      const { uuid } = result.rows[i]
      await pg.delete({ table: 'action_key', where: { user_id: uuid } })
      await pg.delete({ table: 'user_entity', where: { uuid } })
    }
    return true
  }

  on('task', {
    'branch:delete': branchDelete,
    'document:delete': documentDelete,
    'package:delete': packageDelete,
    'package:get': packageGet,
    'questionnaire:delete': questionnaireDelete,
    'user:activate': userActivate,
    'user:getActionParams': userGetActionParams,
    'user:delete': userDelete
  })
}

