describe('Menu', () => {
    [{
        role: 'admin',
        contains: ['Organization', 'Users', 'Knowledge Models', 'Questionnaire', 'KM Editor'],
        notContais: []
    }, {
        role: 'datasteward',
        contains: ['Knowledge Models', 'Questionnaire', 'KM Editor'],
        notContais: ['Organization', 'Users']
    }, {
        role: 'researcher',
        contains: ['Knowledge Models', 'Questionnaire'],
        notContais: ['Organization', 'Users', 'KM Editor']
    }].forEach((roleItems) => {
        it('should contain correct items for ' + roleItems.role, () => {
            cy.loginAs(roleItems.role)
            cy.visitApp('/dashboard')

            roleItems.contains.forEach((item) => {
                cy.get('.menu li').contains(item)
            })

            roleItems.notContais.forEach((item) => {
                cy.get('.menu li').contains(item).should('not.exist')
            })
        })
    })
})
