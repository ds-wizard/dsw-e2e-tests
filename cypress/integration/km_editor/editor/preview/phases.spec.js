import * as editor from '../../../../support/editor-helpers'
import * as phases from '../../../../support/phases-helpers'


describe('KM Editor Preview - Phases', () => {
    const kmName = 'KM for testing phases hases'


    before(() => {
        cy.task('mongo:delete', {
            collection: 'packages',
            args: { kmId: phases.kmId }
        })
        cy.fixture(phases.kmId).then((km) => {
            cy.importKM(km)
        })
    })


    beforeEach(() => {
        cy.task('mongo:delete', {
            collection: 'branches',
            args: { kmId: phases.kmId }
        })
        cy.createKMEditor({ kmId: phases.kmId, name: kmName, previousPackageId: phases.packageId })
        cy.loginAs('datasteward')
        cy.visitApp('/km-editor')
        editor.open(phases.kmId)
        editor.openPreview()
    })

    
    phases.runCommonTests()
})
