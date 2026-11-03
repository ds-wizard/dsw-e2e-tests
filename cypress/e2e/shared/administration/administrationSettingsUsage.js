// Administration / settings / usage - read-only: every row shows the same figure as
// the tenant's own usage endpoint. Admin only.

// Usage table row key (usage_row_<key>) -> field of GET /tenants/current/usages.
// Storage is left out: it's rendered in human-readable byte units.
const ROWS = {
  users: 'users',
  'active-users': 'activeUsers',
  'knowledge-model-editors': 'knowledgeModelEditors',
  'knowledge-models': 'knowledgeModels',
  'document-template-editors': 'documentTemplateDrafts',
  'document-templates': 'documentTemplates',
  projects: 'projects',
  documents: 'documents'
}

const figure = ({ current, max }) => (max > 0 ? `${current} / ${max}` : `${current}`)

export function showUsageMatchingApi() {
  cy.intercept('GET', /\/tenants\/current\/usages/).as('usage')
  cy.visitApp('/settings/usage')

  cy.wait('@usage').then(({ response }) => {
    expect(response.statusCode).to.equal(200)

    Object.entries(ROWS).forEach(([key, field]) => {
      cy.getCy(`usage_row_${key}`).find('td').eq(1).should('have.text', figure(response.body[field]))
    })
  })
}
