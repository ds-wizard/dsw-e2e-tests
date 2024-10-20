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
    const toValue = (value) => value === null ? 'NULL' : `'${value}'`
    return Object.entries(values).map(([field, value]) => `${field}=${toValue(value)}`).join(', ')
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

  // Action Key

  async function actionKeyDelete(where) {
    return pg.delete({ table: 'action_key', where })
  }

  // Branch

  async function branchDelete(where) {
    const result = await pg.get({ table: 'branch', where })
    for (let i = 0; i < result.rows.length; i++) {
      const { uuid } = result.rows[i]
      await pg.delete({ table: 'knowledge_model_migration', where: { branch_uuid: uuid } })
      await pg.delete({ table: 'branch_data', where: { branch_uuid: uuid } })
      await pg.delete({ table: 'branch', where: { uuid } })
    }
    return true
  }


  // Document

  async function documentDelete(where) {
    return pg.delete({ table: 'document', where })
  }

  // Document Templates

  async function documentTemplateSetNonEditable(where) {
    return pg.update({
      table: 'document_template',
      values: { non_editable: true },
      where
    })
  }

  async function documentTemplateDelete(where) {
    const result = await pg.get({ table: 'document_template', where })
    for (let i = 0; i < result.rows.length; i++) {
      const { id } = result.rows[i]
      await documentDelete({ document_template_id: id })
      await questionnaireDelete({ document_template_id: id })
      await pg.delete({ table: 'document_template_draft_data', where: { document_template_id: id } })
      await pg.delete({ table: 'document_template_asset', where: { document_template_id: id } })
      await pg.delete({ table: 'document_template_file', where: { document_template_id: id } })
      await pg.delete({ table: 'document_template', where: { id } })
    }

    return true
  }

  // Locale

  async function localeDelete(where) {
    return pg.delete({ table: 'locale', where })
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
      await pg.delete({ table: 'knowledge_model_cache', where: { package_id: id } })
      await pg.delete({ table: 'knowledge_model_migration', where: { branch_previous_package_id: id } })
      await pg.delete({ table: 'knowledge_model_migration', where: { target_package_id: id } })
      await pg.delete({ table: 'package', where: { id } })
    }
    return true
  }

  async function packageGet(where) {
    const result = await pg.get({ table: 'package', where })
    return result.rows[0]
  }

  async function packageSetNonEditable(where) {
    return pg.update({
      table: 'package',
      values: { non_editable: true },
      where
    })
  }

  // Questionnaire

  async function questionnaireCommmentThreadDelete(where) {
    const result = await pg.get({ table: 'questionnaire_comment_thread', where })
    for (let i = 0; i < result.rows.length; i++) {
      const { uuid } = result.rows[i]
      await pg.delete({ table: 'questionnaire_comment', where: { comment_thread_uuid: uuid } })
      await pg.delete({ table: 'questionnaire_comment_thread', where: { uuid } })
    }
    return true

  }

  async function questionnaireDelete(where) {
    const result = await pg.get({ table: 'questionnaire', where })
    for (let i = 0; i < result.rows.length; i++) {
      const { uuid } = result.rows[i]
      await documentDelete({ questionnaire_uuid: uuid })
      await questionnaireCommmentThreadDelete({ questionnaire_uuid: uuid })
      await pg.delete({ table: 'questionnaire_perm_user', where: { questionnaire_uuid: uuid } })
      await pg.delete({ table: 'questionnaire_perm_group', where: { questionnaire_uuid: uuid } })
      await pg.delete({ table: 'questionnaire_migration', where: { old_questionnaire_uuid: uuid } })
      await pg.delete({ table: 'questionnaire_migration', where: { new_questionnaire_uuid: uuid } })
      await pg.delete({ table: 'document_template_draft_data', where: { questionnaire_uuid: uuid } })
      await pg.delete({ table: 'questionnaire_file', where: { questionnaire_uuid: uuid } })
      await pg.delete({ table: 'questionnaire', where: { uuid } })
    }
    return true
  }

  // Tenant

  async function tenantDelete(where) {
    const result = await pg.get({ table: 'tenant', where })
    for (let i = 0; i < result.rows.length; i++) {
      const { uuid } = result.rows[i]
      await userDelete({ tenant_uuid: uuid })
      await pg.delete({ table: 'action_key', where: { tenant_uuid: uuid } })
      await pg.delete({ table: 'locale', where: { tenant_uuid: uuid } })
      await pg.delete({ table: 'tenant_plan', where: { tenant_uuid: uuid } })
      await pg.delete({ table: 'tenant', where: { uuid } })
    }
    return true
  }

  // Tenant config

  async function tenantConfigDisable2FA() {
    return pg.update({
      table: 'tenant_config',
      values: {
        authentication: JSON.stringify({
          'defaultRole': 'dataSteward',
          'external': {
            'services': []
          },
          'internal': {
            'registration': {
              'enabled': true
            },
            'twoFactorAuth': {
              'codeLength': 6,
              'enabled': false,
              'expiration': 600
            }
          }
        })
      }
    })
  }


  // Tenant limits

  async function tenantLimitReset(where) {
    return pg.update({
      table: 'tenant_limit_bundle',
      values: {
        active_users: null,
        branches: null,
        document_template_drafts: null,
        document_templates: null,
        documents: null,
        knowledge_models: null,
        locales: null,
        questionnaires: null,
        storage: null,
        users: null,
      },
      where
    })
  }

  // User

  async function userActivate({ email, active }) {
    return pg.update({
      table: 'user_entity',
      values: { active },
      where: { email }
    })
  }

  async function userGetActionParams({ email, type }) {
    const result = await pg.query(`SELECT u.uuid, a.hash, a.type FROM user_entity u INNER JOIN action_key a ON u.uuid=a.identity WHERE u.email='${email}' AND a.type='${type}'`)
    return [result.rows[0].uuid, result.rows[0].hash]
  }

  async function userDelete(where) {
    const result = await pg.get({ table: 'user_entity', where })
    for (let i = 0; i < result.rows.length; i++) {
      const { uuid } = result.rows[i]
      await pg.delete({ table: 'action_key', where: { identity: uuid } })
      await pg.delete({ table: 'user_token', where: { user_uuid: uuid } })
      await pg.delete({ table: 'persistent_command', where: { created_by: uuid } })
      await pg.delete({ table: 'user_group_membership', where: { user_uuid: uuid }})
      await pg.delete({ table: 'user_entity', where: { uuid } })
    }
    return true
  }

  async function userAddPermission({ perm, email }) {
    const result = await pg.get({ table: 'user_entity', where: { email } })
    const permissions = [perm, ...result.rows[0].permissions]
    return pg.query(`UPDATE user_entity SET permissions='{${permissions.join(',')}}' WHERE email='${email}'`)
  }

  on('task', {
    'actionKey:delete': actionKeyDelete,
    'branch:delete': branchDelete,
    'document:delete': documentDelete,
    'documentTemplate:delete': documentTemplateDelete,
    'documentTemplate:setNonEditable': documentTemplateSetNonEditable,
    'locale:delete': localeDelete,
    'package:delete': packageDelete,
    'package:get': packageGet,
    'package:setNonEditable': packageSetNonEditable,
    'questionnaire:delete': questionnaireDelete,
    'tenant:delete': tenantDelete,
    'tenantConfig:disable2FA': tenantConfigDisable2FA,
    'tenantLimit:reset': tenantLimitReset,
    'user:activate': userActivate,
    'user:getActionParams': userGetActionParams,
    'user:delete': userDelete,
    'user:addPermission': userAddPermission,
  })
}

