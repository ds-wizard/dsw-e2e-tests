describe('Menu', () => {
    [{
        role: 'admin',
        contains: [
            'users-link', 
            'km-editor-link', 
            'km-link',
            'projects-link', 
            'documents-link', 
            'templates-link', 
            'settings-link', 
            'help', 
            'profile'
        ],
        notContains: []
    }, {
        role: 'datasteward',
        contains: [
            'km-editor-link', 
            'km-link',
            'projects-link', 
            'templates-link', 
            'help', 
            'profile'
        ],
        notContains: [
            'users-link',
            'documents-link', 
            'settings-link', 
        ]
    }, {
        role: 'researcher',
        contains: [ 
            'projects-link', 
            'km-link',
            'help', 
            'profile'
        ],
        notContains: [
            'users-link',
            'km-editor-link',
            'documents-link', 
            'templates-link', 
            'settings-link', 
        ]
    }].forEach((roleItems) => {
        it('should contain correct items for ' + roleItems.role, () => {
            cy.loginAs(roleItems.role)
            cy.visitApp('/dashboard')

            roleItems.contains.forEach((item) => {
                cy.getCy(`menu_${item}`).should('exist')
            })

            roleItems.notContains.forEach((item) => {
                cy.getCy(`menu_${item}`).should('not.exist')
            })
        })
    })
})
