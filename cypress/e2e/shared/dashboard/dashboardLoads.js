// Dashboard / loads smoke check (Common.Pages.Dashboard, /dashboard). Asserts the
// "Welcome, <firstName>!" greeting for the logged-in persona.
export function dashboardLoads() {
  cy.visitApp('/dashboard')
  cy.contains('Welcome, Isaac!').should('exist')
}
