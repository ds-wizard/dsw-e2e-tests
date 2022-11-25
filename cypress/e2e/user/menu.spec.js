describe('Menu', () => {
    [{
        role: 'admin',
        contains: [
            'users',
            'knowledge-models',
            'projects',
            'documents',
            'system',
            'profile',
        ],
        notContains: [
            'document-templates',
        ]
    }, {
        role: 'datasteward',
        contains: [
            'knowledge-models',
            'projects',
            'document-templates',
            'profile',
        ],
        notContains: [
            'users',
            'documents',
            'system',  
        ]
    }, {
        role: 'researcher',
        contains: [ 
            'projects', 
            'profile',
        ],
        notContains: [
            'users',
            'knowledge-models',
            'document-templates',
            'documents',
            'system',
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
