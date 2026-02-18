import * as editor from '../../../../support/editor-helpers'
import * as phases from '../../../../support/phases-helpers'


describe('KM Editor Preview - Phases', () => {
    const kmName = 'KM for testing phases hases'
    let previousPackageUuid


    before(() => {
        cy.task('knowledgeModelPackage:delete', { km_id: phases.kmId })
        cy.clearServerCache()
        
        cy.importKM(phases.kmId, (uuid) => {
            previousPackageUuid = uuid
        })
    })


    beforeEach(() => {
        cy.task('knowledgeModelEditor:delete', { km_id: phases.kmId })
        cy.createKMEditor({ kmId: phases.kmId, name: kmName, version: '1.0.0', previousPackageUuid })
        cy.loginAs('datasteward')
        cy.visitApp('/knowledge-model-editors')
        editor.open(phases.kmId)
        editor.openPreview()
    })

    
    phases.runCommonTests()
})
