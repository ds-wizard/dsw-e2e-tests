#!/usr/bin/env node

const request = require('@cypress/request')

// Provisions the personas the tests log in as (keep in sync with cypress.config.js's
// users). Albert Einstein (Admin), Nikola Tesla (Data Steward) and Isaac Newton
// (Researcher) are seeded by the server itself, this script only adjusts their roles and
// adds the Permission Probe persona, all through the real API.

const apiUrl = 'http://localhost:8080/api'

const ADMIN_EMAIL = 'albert.einstein@example.com'
const ADMIN_PASSWORD = 'password'

// Data Steward also gets projects.edit, the permission that gates the Documents list.
const DATA_STEWARD_PERMISSIONS = [
  'projects.create',
  'userGroups.create',
  'projects.manageTemplates',
  'projects.edit',
  'knowledgeModels.useEditor',
  'knowledgeModels.manage',
  'documentTemplates.useEditor',
  'documentTemplates.manage'
]
const RESEARCHER_PERMISSIONS = ['projects.create', 'userGroups.create']

// Starts with no permissions at all, navByPerm-style specs grant them one at a time
// (cy.setPermissionProbePermissions).
const PERMISSION_PROBE = {
  firstName: 'Permission',
  lastName: 'Probe',
  email: 'permission.probe@example.com',
  password: 'nE1RloidlOsOqOt'
}

function log(message) {
  process.stdout.write(message)
}

const call = (token, method, path, body) => new Promise((resolve) => {
  request({
    method,
    url: `${apiUrl}${path}`,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body,
    json: true
  }, (error, response, responseBody) => {
    if (error || response.statusCode >= 300) {
      console.error(`Error: ${method} ${path}`, error, response && response.statusCode, JSON.stringify(responseBody))
      process.exit(1)
    }
    resolve(responseBody)
  })
})

const main = async () => {
  log('Provisioning users... ')
  const { token } = await call(null, 'POST', '/tokens', { email: ADMIN_EMAIL, password: ADMIN_PASSWORD })

  const roles = (await call(token, 'GET', '/roles?size=100'))._embedded.roles
  const findRole = (name) => roles.find((role) => role.name === name)

  await call(token, 'PUT', `/roles/${findRole('Data Steward').uuid}`, { name: 'Data Steward', permissions: DATA_STEWARD_PERMISSIONS })
  await call(token, 'PUT', `/roles/${findRole('Researcher').uuid}`, { name: 'Researcher', permissions: RESEARCHER_PERMISSIONS })

  let permissionProbeRole = findRole('Permission Probe')
  if (!permissionProbeRole) {
    permissionProbeRole = await call(token, 'POST', '/roles', { name: 'Permission Probe', permissions: [] })
  }

  const users = (await call(token, 'GET', `/users?q=${encodeURIComponent(PERMISSION_PROBE.email)}`))._embedded.users
  if (users.length === 0) {
    await call(token, 'POST', '/users', {
      firstName: PERMISSION_PROBE.firstName,
      lastName: PERMISSION_PROBE.lastName,
      email: PERMISSION_PROBE.email,
      affiliation: null,
      roleUuid: permissionProbeRole.uuid,
      password: PERMISSION_PROBE.password
    })
  }

  log('done\n')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
