describe('Edit profile', () => {
    const user = {
        email: 'alex.day@example.com',
        firstName: 'Alex',
        lastName: 'Day',
        role: 'researcher',
        password: 'StronkPassw0rd',
    }

    const newUser = {
        firstName: 'Gabe',
        lastName: 'Anderson'
    }

    beforeEach(() => {
        cy.task('user:delete', { email: user.email })
        cy.clearServerCache()

        cy.createUser(user)
        cy.task('user:activate', { email: user.email, active: true })
    })

    it('can edit profile', () => {
        cy.visitApp('/')
        cy.fillFields({ email: user.email, password: user.password })
        cy.submitForm()

        cy.get('.profile-name').should('contain', `${user.firstName} ${user.lastName}`)

        cy.getCy('menu_profile').click({ force: true })
        cy.fillFields({
            firstName: newUser.firstName,
            lastName: newUser.lastName
        })
        cy.submitForm()

        cy.get('.profile-name').should('contain', `${newUser.firstName} ${newUser.lastName}`)
    })
})
