const { Client } = require('pg')

// Generic, schema-agnostic Postgres helpers for cy.task(). Add more task handlers on
// top of these as specs need them.
const initPostgres = (config, database) => {
  const createClient = () => new Client({
    user: config.env.db.user,
    host: config.env.db.host,
    password: config.env.db.password,
    port: config.env.db.port,
    database
  })

  const withClient = async (cb) => {
    const client = createClient()
    try {
      await client.connect()
      // fail fast instead of waiting for a lock held by the app, cy.task would
      // otherwise just hang until its timeout
      await client.query("SET lock_timeout = '5s'")
      await client.query("SET statement_timeout = '15s'")
      return await cb(client)
    } finally {
      // the connection has to be released even when the query fails, otherwise
      // the connections leak and postgres runs out of them
      await client.end().catch(() => { })
    }
  }

  const createWhere = (where) => {
    const createCondition = ([field, value]) => {
      if (value.$not) {
        return Array.isArray(value.$not) ? `${field} NOT IN ('${value.$not.join("', '")}')` : `${field}!='${value.$not}'`
      }
      return Array.isArray(value) ? `${field} IN ('${value.join("', '")}')` : `${field}='${value}'`
    }
    const fields = Object.entries(where || {}).map(createCondition).join(' AND ')
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
  const pg = initPostgres(config, config.env.db.database)

  async function tenantUuid(tenantId) {
    const result = await pg.query(`SELECT uuid FROM tenant WHERE tenant_id = '${tenantId}'`)
    if (result.rows.length === 0) {
      throw new Error(`No tenant found for tenant_id "${tenantId}"`)
    }
    return result.rows[0].uuid
  }

  // DSW has exactly one workspace per tenant, it only matters for DB-level cleanups.
  async function workspaceDefaultUuid({ tenantId }) {
    const result = await pg.query(`
      SELECT w.uuid
      FROM workspace w
      JOIN tenant t ON t.uuid = w.tenant_uuid
      WHERE t.tenant_id = '${tenantId}'
      ORDER BY w.created_at
      LIMIT 1
    `)
    if (result.rows.length === 0) {
      throw new Error(`No workspace found for tenant_id "${tenantId}"`)
    }
    return result.rows[0].uuid
  }

  // Clears a fixed-id KM fixture before a spec re-imports it, so it doesn't collide
  // with knowledge_model_package's own uniqueness constraint. Deleting it also removes
  // any project built from it (ON DELETE CASCADE).
  async function knowledgeModelPackageDelete({ tenantId, id }) {
    await pg.query(`DELETE FROM knowledge_model_package WHERE id = '${id}' AND tenant_uuid = '${await tenantUuid(tenantId)}'`)
    return true
  }

  // Same fixed-id-fixture cleanup as knowledgeModelPackageDelete, for document
  // templates - child tables cascade, so this one DELETE is enough.
  async function documentTemplateDelete({ tenantId, id }) {
    await pg.query(`DELETE FROM document_template WHERE id = '${id}' AND tenant_uuid = '${await tenantUuid(tenantId)}'`)
    return true
  }

  // Wipes every KM package (not just a fixed-id fixture) - run before each Knowledge
  // Models listing spec, since a leftover package from an earlier failed run can push
  // that spec's own fresh row off the listing's first page.
  async function knowledgeModelPackageDeleteAll({ tenantId }) {
    await pg.query(`DELETE FROM knowledge_model_package WHERE tenant_uuid = '${await tenantUuid(tenantId)}'`)
    return true
  }

  // Same as knowledgeModelPackageDeleteAll above, for document templates.
  async function documentTemplateDeleteAll({ tenantId }) {
    await pg.query(`DELETE FROM document_template WHERE tenant_uuid = '${await tenantUuid(tenantId)}'`)
    return true
  }

  async function projectDeleteAll({ tenantId }) {
    await pg.query(`DELETE FROM project WHERE tenant_uuid = '${await tenantUuid(tenantId)}'`)
    return true
  }

  // Wipes every user in the tenant except the fixed personas every spec's own login
  // relies on. The real table is user_entity, not "user".
  async function userDeleteAll({ tenantId, excludeEmails }) {
    await pg.query(`
      DELETE FROM user_entity
      WHERE tenant_uuid = '${await tenantUuid(tenantId)}' AND email NOT IN ('${excludeEmails.join("', '")}')
    `)
    return true
  }

  async function userGroupDeleteAll({ tenantId }) {
    await pg.query(`DELETE FROM user_group WHERE tenant_uuid = '${await tenantUuid(tenantId)}'`)
    return true
  }

  // Wipes every KM editor, plus every KM package whose id starts with "km-" (the fixed
  // prefix every KM Migration spec's own generated package ids use). Editors are
  // deleted first: a package's own ON DELETE CASCADE removes any editor forked from it,
  // but one created from scratch isn't covered by that.
  async function knowledgeModelMigrationTestDataDeleteAll({ tenantId }) {
    const uuid = await tenantUuid(tenantId)
    await pg.query(`DELETE FROM knowledge_model_editor WHERE tenant_uuid = '${uuid}'`)
    await pg.query(`DELETE FROM knowledge_model_package WHERE tenant_uuid = '${uuid}' AND id LIKE 'km-%'`)
    return true
  }

  on('task', {
    'db:query': ({ qs }) => pg.query(qs),
    'db:get': ({ table, where }) => pg.get({ table, where }),
    'db:update': ({ table, values, where }) => pg.update({ table, values, where }),
    'db:delete': ({ table, where }) => pg.delete({ table, where }),
    'workspace:defaultUuid': workspaceDefaultUuid,
    'knowledgeModelPackage:delete': knowledgeModelPackageDelete,
    'knowledgeModelPackage:deleteAll': knowledgeModelPackageDeleteAll,
    'documentTemplate:delete': documentTemplateDelete,
    'documentTemplate:deleteAll': documentTemplateDeleteAll,
    'project:deleteAll': projectDeleteAll,
    'user:deleteAll': userDeleteAll,
    'userGroup:deleteAll': userGroupDeleteAll,
    'knowledgeModel:deleteMigrationTestData': knowledgeModelMigrationTestDataDeleteAll,
  })
}
