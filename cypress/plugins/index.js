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

    getSorted: ({ table, where, order }) => {
      return withClient(client => client.query(`SELECT * FROM ${table}${createWhere(where)} ORDER BY ${order}`))
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
      const { uuid } = result.rows[i]
      await projectDelete({ document_template_uuid: uuid })
      await pg.delete({ table: 'document_template', where: { uuid } })
    }

    return true
  }

  async function documentTemplateGet(where) {
    const result = await pg.get({ table: 'document_template', where })
    return result.rows[0] || null
  }

  // Locale

  async function localeDelete(where) {
    await pg.delete({ table: 'locale', where })
    await pg.update({
      table: 'locale',
      values: { default_locale: true },
      where: { organization_id: '~' }
    })
    return true
  }

  // Knowledge Model Editor

  async function knowledgeModelEditorDelete(where) {
    const result = await pg.get({ table: 'knowledge_model_editor', where })
    for (let i = 0; i < result.rows.length; i++) {
      const { uuid } = result.rows[i]
      await pg.update({ table: 'document_template_draft_data', values: { knowledge_model_editor_uuid: null }, where: { knowledge_model_editor_uuid: uuid } })
      await pg.delete({ table: 'knowledge_model_editor', where: { uuid } })
    }
    return true
  }

  // Knowledge Model Package

  async function knowledgeModelPackageDelete(where) {
    const result = await pg.get({ table: 'knowledge_model_package', where })
    for (let i = 0; i < result.rows.length; i++) {
      const { organization_id, km_id, version, uuid } = result.rows[i]
      await knowledgeModelPackageDelete({ previous_package_uuid: uuid })
      await knowledgeModelPackageDelete({ fork_of_package_id: `${organization_id}:${km_id}:${version}` })
      await pg.delete({ table: 'knowledge_model_package', where: { uuid } })
    }
    return true
  }

  async function knowledgeModelPackageGet(where) {
    const result = await pg.get({ table: 'knowledge_model_package', where })

    const package = result.rows[0]
    const events = await pg.getSorted({ table: 'knowledge_model_package_event', where: { package_uuid: package.uuid }, order: "created_at" })

    return {...package, events: events.rows }
  }

  async function knowledgeModelPackageSetNonEditable(where) {
    return pg.update({
      table: 'knowledge_model_package',
      values: { non_editable: true },
      where
    })
  }

  // OpenID Client

  async function openIdClientDelete(where) {
    return pg.delete({ table: 'openid_client', where })
  }

  // Project

  async function projectDelete(where) {
    const result = await pg.get({ table: 'project', where })
    for (let i = 0; i < result.rows.length; i++) {
      const { uuid } = result.rows[i]
      await pg.delete({ table: 'document_template_draft_data', where: { project_uuid: uuid } })
      await pg.delete({ table: 'project', where: { uuid } })
    }
    return true
  }

  // Role

  async function getRole(where) {
    return await pg.get({ table: 'role', where })
  }

  async function roleDelete(where) {
    return pg.delete({ table: 'role', where })
  }

  // Tenant

  async function tenantDelete(where) {
    const result = await pg.get({ table: 'tenant', where })
    for (let i = 0; i < result.rows.length; i++) {
      const { uuid } = result.rows[i]
      await pg.delete({ table: 'document_template_asset', where: { tenant_uuid: uuid } })
      await pg.delete({ table: 'locale', where: { tenant_uuid: uuid } })
      await pg.delete({ table: 'persistent_command', where: { tenant_uuid: uuid } })
      await pg.delete({ table: 'project_file', where: { tenant_uuid: uuid } })
      await pg.delete({ table: 'tenant', where: { uuid } })
    }
    return true
  }

  // Tenant config

  async function tenantConfigDisable2FA() {
    return pg.update({
      table: 'config_authentication',
      values: {
        internal_two_factor_auth_enabled: false
      }
    })
  }

  // Tenant limits

  async function tenantLimitReset(where) {
    return pg.update({
      table: 'tenant_limit_bundle',
      values: {
        active_users: -10000,
        document_template_drafts: -10000,
        document_templates: -10000,
        documents: -10000,
        knowledge_model_editors: -10000,
        knowledge_models: -10000,
        locales: -10000,
        projects: -10000,
        storage: -10000000000,
        users: -10000,
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
    const result = await pg.query(`SELECT u.uuid, uel.hash, uel.type FROM user_entity u INNER JOIN user_email_link uel ON u.uuid=uel.identity WHERE u.email='${email}' AND uel.type='${type}'`)
    return [result.rows[0].uuid, result.rows[0].hash]
  }

  async function userDelete(where) {
    return pg.delete({ table: 'user_entity', where })
  }

  async function userAddPermission({ perm, email }) {
    const result = await pg.get({ table: 'user_entity', where: { email } })
    const role_permissions = [perm, ...result.rows[0].role_permissions]
    return pg.query(`UPDATE user_entity SET role_permissions='{${role_permissions.join(',')}}' WHERE email='${email}'`)
  }

  async function userSetToursDone({ email }) {
    const result = await pg.get({ table: 'user_entity', where: { email } })
    const tourIds = [
      'dashboard',
      'projects_create',
      'projects_detail',
      'projects_detail_share-modal',
      'projects_index',
      'users_edit_tours'
    ]
    for (let i = 0; i < tourIds.length; i++) {
      await pg.query(`INSERT INTO user_tour (user_uuid, tour_id, tenant_uuid, created_at) VALUES ('${result.rows[0].uuid}', '${tourIds[i]}', '00000000-0000-0000-0000-000000000000', NOW()) ON CONFLICT DO NOTHING`)
    }
    return true
  }

    // User Email Links

  async function userEmailLinkDelete(where) {
    return pg.delete({ table: 'user_email_link', where })
  }

  on('task', {
    'document:delete': documentDelete,
    'documentTemplate:delete': documentTemplateDelete,
    'documentTemplate:get': documentTemplateGet,
    'documentTemplate:setNonEditable': documentTemplateSetNonEditable,
    'locale:delete': localeDelete,
    'knowledgeModelEditor:delete': knowledgeModelEditorDelete,
    'knowledgeModelPackage:delete': knowledgeModelPackageDelete,
    'knowledgeModelPackage:get': knowledgeModelPackageGet,
    'knowledgeModelPackage:setNonEditable': knowledgeModelPackageSetNonEditable,
    'project:delete': projectDelete,
    'role:get': getRole,
    'role:delete': roleDelete,
    'openIdClient:delete': openIdClientDelete,
    'tenant:delete': tenantDelete,
    'tenantConfig:disable2FA': tenantConfigDisable2FA,
    'tenantLimit:reset': tenantLimitReset,
    'user:activate': userActivate,
    'user:getActionParams': userGetActionParams,
    'user:delete': userDelete,
    'user:addPermission': userAddPermission,
    'user:setToursDone': userSetToursDone,
    'userEmailLink:delete': userEmailLinkDelete,
  })
}
