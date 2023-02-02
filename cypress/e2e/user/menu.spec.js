describe('Menu', () => {
    [{
        role: 'admin',
        contains: [
            'knowledge-models',
            'document-templates',
            'projects',
            'documents',
            'administration',
            'profile',
        ],
        notContains: []
    }, {
        role: 'datasteward',
        contains: [
            'knowledge-models',
            'document-templates',
            'projects',
            'profile',
        ],
        notContains: [
            'documents',
            'administration', 
        ]
    }, {
        role: 'researcher',
        contains: [ 
            'projects', 
            'profile',
        ],
        notContains: [
            'knowledge-models',
            'document-templates',
            'documents',
            'administration',
        ]
    }].forEach((roleItems) => {
        it('should contain correct items for ' + roleItems.role, () => {
            cy.loginAs(roleItems.role)
            cy.visitApp('/dashboard')

            roleItems.contains.forEach((item) => {
                cy.get(`#menu_${item}`).should('exist')
            })

            roleItems.notContains.forEach((item) => {
                cy.get(`#menu_${item}`).should('not.exist')
            })
        })
    })
})
