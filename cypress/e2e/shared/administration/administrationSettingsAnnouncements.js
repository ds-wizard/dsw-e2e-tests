// Adds an announcement to a settings section's announcement list (dashboard and menu,
// or login screen), filling its level and markdown content.
export function addAnnouncement(index, level, content) {
  const path = `announcements-${index}`
  cy.getCy('form-announcements_add').click()
  cy.getCy(`form-${path}-level_${level}AnnouncementLevelType`).click()
  cy.get(`ui-markdown-editor[input-id="form-${path}-content"]`).within(() => {
    cy.getCy('markdown-editor_mode-markdown').click()
  })
  cy.get(`#form-${path}-content`).type(content)
}
