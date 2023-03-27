import * as editor from '../../../../support/editor-helpers'
import * as phases from '../../../../support/phases-helpers'


describe('KM Editor Preview - Phases', () => {
    const kmName = 'KM for testing phases hases'


    before(() => {
        cy.task('package:delete', { km_id: phases.kmId })
        cy.clearServerCache()
        
        cy.importKM(phases.kmId)
    })


    beforeEach(() => {
        cy.task('branch:delete', { km_id: phases.kmId })
        cy.createKMEditor({ kmId: phases.kmId, name: kmName, version: '1.0.0', previousPackageId: phases.packageId })
        cy.loginAs('datasteward')
        cy.visitApp('/km-editor')
        editor.open(phases.kmId)
        editor.openPreview()
    })

    
    phases.runCommonTests()
})
