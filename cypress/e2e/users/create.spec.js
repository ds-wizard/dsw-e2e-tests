describe('Users Create', () => {
    const userEmail = 'jayden.mills@example.com'

    let researcherRoleUuid

    before(() => {
        cy.task('role:get', { name: 'Researcher' }).then((result) => {
            researcherRoleUuid = result.rows[0].uuid
        })
    })

    beforeEach(() => {
        cy.task('user:delete', { email: userEmail })
        cy.clearServerCache()

        cy.loginAs('admin')
        cy.visitApp('/users')
    })

    it('can be created', () => {
        const user = {
            email: userEmail,
            firstName: 'Jayden',
            lastName: 'Mills',
            s_roleUuid: researcherRoleUuid,
            password: 'StronkPassw0rd'
        }

        cy.getCy('users_create-button').click()
        cy.fillFields(user)
        cy.submitForm()

        cy.url().should('match', /\/users$/)
        cy.getListingItem(user.email)
            .should('contain', user.firstName)
            .and('contain', user.lastName)
            .and('contain', 'Researcher')
    })
})
