import * as migration from '../../../support/migration-helpers'
import { dataCy } from '../../../support/utils'


describe('KM Editor Migrations', () => {
    const config = new migration.Config(
        'child-km',
        'parent-km',
        'Child KM'
    )

    before(() => {
        cy.task('package:delete', { km_id: config.parentKmId })
        cy.putDefaultAppConfig()
        cy.clearServerCache()

        // import parent-km with latest (inc. all lower version)
        cy.importKM(config.getParentKM('1.11.0'))
    })

    beforeEach(() => {
        cy.task('package:delete', { km_id: config.childKmId })
        cy.task('branch:delete')
        cy.clearServerCache()

        cy.loginAs('datasteward')
    })

    // BASIC
    it('contains upgrade option', () => {
        migration.prepareChildKmEditor(config, '1.0.0')

        cy.getListingItem(config.childKmId)
            .should('contain', config.editorName)
            .and('contain', config.getParentPackageId('1.0.0'))
        cy.clickListingItemAction(config.editorName, 'upgrade')
        cy.clickModalCancel()
    })

    it('can click "update available" badge', () => {
        migration.prepareChildKmEditor(config, '1.0.0')
        cy.getCy('km-editor_list_outdated-badge').click()
        cy.expectModalOpen('km-editor-upgrade')
    })

    it('can pause, resume, and cancel migration', () => {
        migration.createMigration(config, '1.0.0', '1.10.0')

        migration.expectEvent('1a6a2d81-96b0-48ef-8c15-6668be5133e0')
        migration.apply()
        migration.expectEvent('fb9fe60e-ebec-4c73-a157-189c125e4197')

        cy.visitApp('/km-editor')
        cy.clickListingItemAction(config.editorName, 'continue-migration')

        migration.expectEvent('fb9fe60e-ebec-4c73-a157-189c125e4197')
        migration.reject()
        migration.expectEvent('db1be474-da77-4ce9-80df-8ebc9d108d3d')

        cy.visitApp('/km-editor')
        cy.clickListingItemAction(config.editorName, 'cancel-migration')
        cy.getListingItem(config.childKmId).should('contain', config.editorName)
        cy.getListingItem(config.childKmId).find(dataCy('km-editor_list_outdated-badge')).should('exist')
    })

    // CHAPTER
    it('can migrate with applying "add chapter"', () => {
        migration.createMigration(config, '1.0.0', '1.1.0')

        cy.contains('Add chapter')
        migration.expectEvent('1a6a2d81-96b0-48ef-8c15-6668be5133e0')
        migration.checkMigrationForm([
            {
                'label': 'Title', 'validate': (x) => {
                    x.get('ins').contains('Chapter 2')
                }
            },
            {
                'label': 'Text', 'validate': (x) => {
                    x.get('ins').contains('Chapter text')
                }
            }
        ])
        migration.checkDiffTreeAdded(['Chapter 2'])
        migration.apply()

        migration.expectEvent('fb9fe60e-ebec-4c73-a157-189c125e4197')
        migration.apply() // some question (no assertions now)

        migration.expectEvent('db1be474-da77-4ce9-80df-8ebc9d108d3d')
        migration.apply() // some question (no assertions now)

        migration.finishMigrationAndPublish(1, 1, 0)
        migration.verifyChildPackageForMigration(config, '1.1.0', '1.0.0')
    })

    it('can migrate with applying "edit chapter"', () => {
        migration.createMigration(config, '1.1.0', '1.1.1')

        migration.expectEvent('e75f8d8c-76ef-4ce7-a7b6-86d45052170f')
        migration.checkMigrationForm([
            {
                'label': 'Title', 'validate': (x) => {
                    x.contains('Chapter 2')
                }
            },
            {
                'label': 'Text', 'validate': (x) => {
                    x.contains('Chapter text')
                }
            },
            {
                'label': 'Questions', 'validate': (x) => {
                    x.get('ul.del li').should('have.length', 2)
                    x.get('ul.del li').first().contains('Question 2.1')
                    x.get('ul.del li').first().next().contains('Question 2.2')
                    x.get('ul.ins li').should('have.length', 2)
                    x.get('ul.ins li').first().contains('Question 2.2')
                    x.get('ul.ins li').first().next().contains('Question 2.1')
                }
            }
        ])
        migration.checkDiffTreeEdited(['Chapter 2'])
        migration.apply()

        migration.expectEvent('9135e30e-3c72-426d-a3b0-8e7551576adc')
        migration.checkMigrationForm([
            {
                'label': 'Title', 'validate': (x) => {
                    x.contains('Chapter 2')
                }
            },
            {
                'label': 'Text', 'validate': (x) => {
                    x.get('del').contains('Chapter text')
                    x.get('ins').contains('**New** chapter text')
                }
            },
            {
                'label': 'Questions', 'validate': (x) => {
                    x.get('.form-value > ul > li').should('have.length', 2)
                    x.get('.form-value > ul > li').first().contains('Question 2.2')
                    x.get('.form-value > ul > li').first().next().contains('Question 2.1')
                }
            }
        ])
        migration.checkDiffTreeEdited(['Chapter 2'])
        migration.apply()

        migration.finishMigrationAndPublish(1, 1, 1)
        migration.verifyChildPackageForMigration(config, '1.1.1', '1.1.0')
    })

    it('can migrate with applying "delete chapter"', () => {
        migration.createMigration(config, '1.1.1', '1.1.2')

        migration.expectEvent('60575da5-6e8f-43e4-9829-ca535618f060')
        migration.checkMigrationForm([
            {
                'label': 'Title', 'validate': (x) => {
                    x.get('del').contains('Chapter 2')
                }
            },
            {
                'label': 'Text', 'validate': (x) => {
                    x.get('del').contains('**New** chapter text')
                }
            },
            {
                'label': 'Questions', 'validate': (x) => {
                    x.get('.form-value > ul.del > li').should('have.length', 2)
                    x.get('.form-value > ul.del > li').first().contains('Question 2.2')
                    x.get('.form-value > ul.del > li').first().next().contains('Question 2.1')
                }
            }
        ])
        migration.checkDiffTreeDeleted(['Chapter 2'])
        migration.apply()

        migration.finishMigrationAndPublish(1, 1, 2)
        migration.verifyChildPackageForMigration(config, '1.1.2', '1.1.1')
    })

    // EXPERT
    it('can migrate with applying "add expert"', () => {
        migration.createMigration(config, '1.1.2', '1.2.0')

        migration.expectEvent('0e7c20a4-4181-49c9-8a7b-1014d6500f60')
        migration.checkMigrationForm([
            {
                'label': 'Name', 'validate': (x) => {
                    x.get('ins').contains('Leonardo da Vinci')
                }
            },
            {
                'label': 'Email', 'validate': (x) => {
                    x.get('ins').contains('leonardo.da.vinci@science.it')
                }
            }
        ])
        migration.checkDiffTreeAdded(['Leonardo da Vinci'])
        migration.apply()

        migration.finishMigrationAndPublish(1, 2, 0)
        migration.verifyChildPackageForMigration(config, '1.2.0', '1.1.2')
    })

    it('can migrate with applying "edit expert"', () => {
        migration.createMigration(config, '1.2.0', '1.2.1')

        migration.expectEvent('d0986c0b-42d9-4311-a1b2-b66004fc6ca3')
        migration.checkMigrationForm([
            {
                'label': 'Name', 'validate': (x) => {
                    x.get('del').contains('Leonardo da Vinci')
                    x.get('ins').contains('Leonardo da Vinci (di ser Piero)')
                }
            },
            {
                'label': 'Email', 'validate': (x) => {
                    x.get('del').contains('leonardo.da.vinci@science.it')
                    x.get('ins').contains('leonardo.da.vinci@images.it')
                }
            }
        ])
        migration.checkDiffTreeEdited(['Leonardo da Vinci'])
        migration.apply()

        migration.finishMigrationAndPublish(1, 2, 1)
        migration.verifyChildPackageForMigration(config, '1.2.1', '1.2.0')
    })

    it('can migrate with applying "delete expert"', () => {
        migration.createMigration(config, '1.2.1', '1.2.2')

        migration.expectEvent('fddcc925-ac70-4caa-a6ba-01ae6d9ca946')
        migration.checkMigrationForm([
            {
                'label': 'Name', 'validate': (x) => {
                    x.get('del').contains('Leonardo da Vinci (di ser Piero)')
                }
            },
            {
                'label': 'Email', 'validate': (x) => {
                    x.get('del').contains('leonardo.da.vinci@images.it')
                }
            }
        ])
        migration.checkDiffTreeDeleted(['Leonardo da Vinci (di ser Piero)'])
        migration.apply()

        migration.finishMigrationAndPublish(1, 2, 2)
        migration.verifyChildPackageForMigration(config, '1.2.2', '1.2.1')
    })

    // REFERENCE
    it('can migrate with applying "add reference"', () => {
        migration.createMigration(config, '1.2.2', '1.3.0')

        // Add reference (book)
        migration.expectEvent('c9e7f61c-4037-4d83-93fe-9ab4be9cb04b')
        migration.checkMigrationForm([
            {
                'label': 'Reference Type', 'validate': (x) => {
                    x.get('ins').contains('Resource Page')
                }
            },
            {
                'label': 'Short UUID', 'validate': (x) => {
                    x.get('ins').contains('atq')
                }
            }
        ])
        migration.checkDiffTreeAdded(['atq'])
        migration.apply()

        // Add reference (URL)
        migration.expectEvent('227d70b9-6ace-4bc7-8051-3c334bd9c865')
        migration.checkMigrationForm([
            {
                'label': 'Reference Type', 'validate': (x) => {
                    x.get('ins').contains('URL')
                }
            },
            {
                'label': 'URL', 'validate': (x) => {
                    x.get('ins').contains('http://example.com')
                }
            },
            {
                'label': 'Label', 'validate': (x) => {
                    x.get('ins').contains('See also')
                }
            }
        ])
        migration.checkDiffTreeAdded(['See also'])
        migration.apply()

        // Add reference (cross reference)
        migration.expectEvent('bba8dfa4-93f9-445e-b35d-cc00e07fb700')
        migration.checkMigrationForm([
            {
                'label': 'Reference Type', 'validate': (x) => {
                    x.get('ins').contains('Cross Reference')
                }
            },
            {
                'label': 'Target UUID', 'validate': (x) => {
                    x.get('ins').contains('4ae6a08a-c94e-4a0f-8391-24765ad8fdb4')
                }
            },
            {
                'label': 'Description', 'validate': (x) => {
                    x.get('ins').contains('Self-reference for testing')
                }
            }
        ])
        migration.checkDiffTreeAdded(['4ae6a08a-c94e-4a0f-8391-24765ad8fdb4'])
        migration.apply()

        migration.finishMigrationAndPublish(1, 3, 0)
        migration.verifyChildPackageForMigration(config, '1.3.0', '1.2.2')
    })

    it('can migrate with applying "edit reference"', () => {
        migration.createMigration(config, '1.3.0', '1.3.1')

        // Edit reference (book)
        migration.expectEvent('65d2540b-e268-42bc-9d6b-d2375b9f96ea')
        migration.checkMigrationForm([
            {
                'label': 'Reference Type', 'validate': (x) => {
                    x.contains('Resource Page')
                }
            },
            {
                'label': 'Short UUID', 'validate': (x) => {
                    x.get('del').contains('atq')
                    x.get('ins').contains('xyz')
                }
            }
        ])
        migration.checkDiffTreeEdited(['xyz'])
        migration.apply()

        // Edit reference (URL)
        migration.expectEvent('f1dcd85e-62f5-4c37-9fcf-8b8ef10d5d4b')
        migration.checkMigrationForm([
            {
                'label': 'Reference Type', 'validate': (x) => {
                    x.contains('URL')
                }
            },
            {
                'label': 'URL', 'validate': (x) => {
                    x.get('del').contains('http://example.com')
                    x.get('ins').contains('http://google.com')
                }
            },
            {
                'label': 'Label', 'validate': (x) => {
                    x.get('del').contains('See also')
                    x.get('ins').contains('Better Google it')
                }
            }
        ])
        migration.checkDiffTreeEdited(['Better Google it'])
        migration.apply()

        // Edit reference (cross reference)
        migration.expectEvent('0f8be8eb-e9f9-494c-a251-0a0ba33aaa86')
        migration.checkMigrationForm([
            {
                'label': 'Reference Type', 'validate': (x) => {
                    x.contains('Cross Reference')
                }
            },
            {
                'label': 'Target UUID', 'validate': (x) => {
                    x.contains('4ae6a08a-c94e-4a0f-8391-24765ad8fdb4')
                }
            },
            {
                'label': 'Description', 'validate': (x) => {
                    x.get('del').contains('Self-reference for testing')
                    x.get('ins').contains('Self-reference just for testing')
                }
            }
        ])
        migration.checkDiffTreeEdited(['4ae6a08a-c94e-4a0f-8391-24765ad8fdb4'])
        migration.apply()

        // Change order of references
        migration.expectEvent('96f716e1-3ac0-4576-ad0c-28ff241c5354')
        migration.checkMigrationForm([
            {
                'label': 'Type', 'validate': (x) => {
                    x.contains('Options')
                }
            },
            {
                'label': 'Title', 'validate': (x) => {
                    x.contains('Question 1.1')
                }
            },
            { 'label': 'Text', 'validate': (x) => { } },
            { 'label': 'Tags', 'validate': (x) => { } },
            { 'label': 'Answers', 'validate': (x) => { } },
            {
                'label': 'References', 'validate': (x) => {
                    x.get('ul.del > li').should('have.length', 3)
                    x.get('ul.del > li').eq(0).contains('xyz')
                    x.get('ul.del > li').eq(1).contains('Better Google it')
                    x.get('ul.del > li').eq(2).contains('4ae6a08a-c94e-4a0f-8391-24765ad8fdb4')
                    x.get('ul.ins > li').should('have.length', 3)
                    x.get('ul.ins > li').eq(0).contains('Better Google it')
                    x.get('ul.ins > li').eq(1).contains('xyz')
                    x.get('ul.ins > li').eq(2).contains('4ae6a08a-c94e-4a0f-8391-24765ad8fdb4')
                }
            },
            { 'label': 'Experts', 'validate': (x) => { } },
        ])
        migration.checkDiffTreeEdited(['Question 1.1'])
        migration.apply()

        migration.finishMigrationAndPublish(1, 3, 1)
        migration.verifyChildPackageForMigration(config, '1.3.1', '1.3.0')
    })

    it('can migrate with applying "delete reference"', () => {
        migration.createMigration(config, '1.3.1', '1.3.2')

        // Delete reference (URL)
        migration.expectEvent('aaf9ef18-7bb4-4c03-a891-fd45fce523e6')
        migration.checkMigrationForm([
            {
                'label': 'Reference Type', 'validate': (x) => {
                    x.get('del').contains('URL')
                }
            },
            {
                'label': 'URL', 'validate': (x) => {
                    x.get('del').contains('http://google.com')
                }
            },
            {
                'label': 'Label', 'validate': (x) => {
                    x.get('del').contains('Better Google it')
                }
            }
        ])
        migration.checkDiffTreeDeleted(['Better Google it'])
        migration.apply()

        // Delete reference (cross reference)
        migration.expectEvent('990aac24-7409-4af8-9180-b3bf1090c904')
        migration.checkMigrationForm([
            {
                'label': 'Reference Type', 'validate': (x) => {
                    x.get('del').contains('Cross Reference')
                }
            },
            {
                'label': 'Target UUID', 'validate': (x) => {
                    x.get('del').contains('4ae6a08a-c94e-4a0f-8391-24765ad8fdb4')
                }
            },
            {
                'label': 'Description', 'validate': (x) => {
                    x.get('del').contains('Self-reference just for testing')
                }
            }
        ])
        migration.checkDiffTreeDeleted(['4ae6a08a-c94e-4a0f-8391-24765ad8fdb4'])
        migration.apply()

        // Delete reference (book)
        migration.expectEvent('fd97fa49-4338-4568-8d57-d06abb1cbb43')
        migration.checkMigrationForm([
            {
                'label': 'Reference Type', 'validate': (x) => {
                    x.get('del').contains('Resource Page')
                }
            },
            {
                'label': 'Short UUID', 'validate': (x) => {
                    x.get('del').contains('xyz')
                }
            }
        ])
        migration.checkDiffTreeDeleted(['xyz'])
        migration.apply()

        migration.finishMigrationAndPublish(1, 3, 2)
        migration.verifyChildPackageForMigration(config, '1.3.2', '1.3.1')
    })

    // TAG
    it('can migrate with applying "add tag"', () => {
        migration.createMigration(config, '1.3.2', '1.4.0')

        cy.contains('Tag 1')
        migration.expectEvent('9fa64b40-1e8a-4b11-b9ce-4dda6758caad')
        migration.checkMigrationForm([
            {
                'label': 'Name', 'validate': (x) => {
                    x.get('ins').contains('Tag 1')
                }
            },
            {
                'label': 'Description', 'validate': (x) => {
                    x.get('ins').contains('First tag')
                }
            },
            {
                'label': 'Color', 'validate': (x) => {
                    x.get('ins').contains('#3498DB')
                }
            }
        ])
        migration.checkDiffTreeAdded(['Tag 1'])
        migration.apply()

        migration.expectEvent('f9057be2-57f2-4089-8534-7dcd419d795a')
        migration.checkMigrationForm([
            {
                'label': 'Name', 'validate': (x) => {
                    x.get('ins').contains('Tag 2')
                }
            },
            {
                'label': 'Description', 'validate': (x) => {
                    x.get('ins').contains('The second tag')
                }
            },
            {
                'label': 'Color', 'validate': (x) => {
                    x.get('ins').contains('#D35400')
                }
            }
        ])
        migration.checkDiffTreeAdded(['Tag 2'])
        migration.apply()

        migration.finishMigrationAndPublish(1, 4, 0)
        migration.verifyChildPackageForMigration(config, '1.4.0', '1.3.2')
    })

    it('can migrate with applying "edit tag"', () => {
        migration.createMigration(config, '1.4.0', '1.4.1')

        migration.expectEvent('0b66a862-6f24-425f-ab21-8d8c463e947b')
        migration.checkMigrationForm([
            {
                'label': 'Name', 'validate': (x) => {
                    x.contains('Tag 2')
                }
            },
            {
                'label': 'Description', 'validate': (x) => {
                    x.contains('The second tag')
                }
            },
            {
                'label': 'Color', 'validate': (x) => {
                    x.get('del').contains('#D35400')
                    x.get('ins').contains('#8E44AD')
                }
            }
        ])
        migration.checkDiffTreeEdited(['Tag 2'])
        migration.apply()

        migration.expectEvent('196c429f-9004-44f6-a415-28bbacf23a58')
        migration.checkMigrationForm([
            {
                'label': 'Name', 'validate': (x) => {
                    x.get('del').contains('Tag 1')
                    x.get('ins').contains('Tag 01')
                }
            },
            {
                'label': 'Description', 'validate': (x) => {
                    x.get('del').contains('First tag')
                    x.get('ins').contains('The first tag')
                }
            },
            {
                'label': 'Color', 'validate': (x) => {
                    x.get('del').contains('#3498DB')
                    x.get('ins').contains('#16A085')
                }
            }
        ])
        migration.checkDiffTreeEdited(['Tag 01'])
        migration.apply()

        migration.expectEvent('0408f280-97ce-46ea-bf9e-7e58720940ac')
        migration.checkMigrationForm([
            {
                'label': 'Type', 'validate': (x) => {
                    x.contains('Options')
                }
            },
            {
                'label': 'Title', 'validate': (x) => {
                    x.contains('Question 1.1')
                }
            },
            { 'label': 'Text', 'validate': (x) => { } },
            {
                'label': 'Tags', 'validate': (x) => {
                    x.get('ul.ins li').should('have.length', 1)
                    x.get('ul.ins li').eq(0).contains('Tag 01')
                }
            },
            { 'label': 'Answers', 'validate': (x) => { } },
            {
                'label': 'References', 'validate': (x) => {
                    x.contains('-')
                }
            },
            {
                'label': 'Experts', 'validate': (x) => {
                    x.contains('-')
                }
            },
        ])
        migration.checkDiffTreeEdited(['Question 1.1'])
        migration.apply()

        migration.finishMigrationAndPublish(1, 4, 1)
        migration.verifyChildPackageForMigration(config, '1.4.1', '1.4.0')
    })

    it('can migrate with applying "delete tag"', () => {
        migration.createMigration(config, '1.4.1', '1.4.2')

        migration.expectEvent('6560f955-5d81-4bc4-9117-068bdee4db0a')
        migration.checkMigrationForm([
            {
                'label': 'Name', 'validate': (x) => {
                    x.get('del').contains('Tag 01')
                }
            },
            {
                'label': 'Description', 'validate': (x) => {
                    x.get('del').contains('The first tag')
                }
            },
            {
                'label': 'Color', 'validate': (x) => {
                    x.get('del').contains('#16A085')
                }
            }
        ])
        migration.checkDiffTreeDeleted(['Tag 01'])
        migration.apply()

        migration.expectEvent('7efc1b58-d74b-4d35-b7ab-1418808b83ad')
        migration.checkMigrationForm([
            {
                'label': 'Name', 'validate': (x) => {
                    x.get('del').contains('Tag 2')
                }
            },
            {
                'label': 'Description', 'validate': (x) => {
                    x.get('del').contains('The second tag')
                }
            },
            {
                'label': 'Color', 'validate': (x) => {
                    x.get('del').contains('#8E44AD')
                }
            }
        ])
        migration.checkDiffTreeDeleted(['Tag 2'])
        migration.apply()

        migration.finishMigrationAndPublish(1, 4, 2)
        migration.verifyChildPackageForMigration(config, '1.4.2', '1.4.1')
    })

    // INTEGRATION
    it('can migrate with applying "add integration"', () => {
        migration.createMigration(config, '1.4.2', '1.5.0')

        migration.expectEvent('5fed062d-41c9-48bd-b0f1-72441aefd981')
        migration.checkMigrationForm([
            {
                'label': 'Type', 'validate': (x) => {
                    x.get('ins').contains('Api')
                }
            },
            {
                'label': 'ID', 'validate': (x) => {
                    x.get('ins').contains('idIntegration')
                }
            },
            {
                'label': 'Name', 'validate': (x) => {
                    x.get('ins').contains('My Test Integration')
                }
            },
            {
                'label': 'Props', 'validate': (x) => {
                    x.get('ins').contains('prop1, prop2')
                }
            },
            {
                'label': 'Item URL', 'validate': (x) => {
                    x.get('ins').contains('https://google.com/${id}')
                }
            },
            {
                'label': 'Request HTTP Method', 'validate': (x) => {
                    x.get('ins').contains('GET')
                }
            },
            {
                'label': 'Request URL', 'validate': (x) => {
                    x.get('ins').contains('/')
                }
            },
            {
                'label': 'Request HTTP Headers', 'validate': (x) => {
                    x.get('ins').contains('Accept: application-json')
                }
            },
            {
                'label': 'Request HTTP Body', 'validate': (x) => {
                    x.get('ins').contains('{ "q": "${q}" }')
                }
            },
            {
                'label': 'Response List Field', 'validate': (x) => {
                    x.get('ins').contains('items')
                }
            },
            {
                'label': 'Response Item ID', 'validate': (x) => {
                    x.get('ins').contains('id')
                }
            },
            {
                'label': 'Response Item Template', 'validate': (x) => {
                    x.get('ins').contains('name')
                }
            }
        ])
        migration.checkDiffTreeAdded(['My Test Integration'])
        migration.apply()

        migration.finishMigrationAndPublish(1, 5, 0)
        migration.verifyChildPackageForMigration(config, '1.5.0', '1.4.2')
    })

    it('can migrate with applying "edit integration"', () => {
        migration.createMigration(config, '1.5.0', '1.5.1')

        migration.expectEvent('061f5fd2-fdcd-4882-befe-8a740c542878')
        migration.checkMigrationForm([
            {
                'label': 'Type', 'validate': (x) => {
                    x.contains('Api')
                }
            },
            {
                'label': 'ID', 'validate': (x) => {
                    x.get('del').contains('idIntegration')
                    x.get('ins').contains('google')
                }
            },
            {
                'label': 'Name', 'validate': (x) => {
                    x.get('del').contains('My Test Integration')
                    x.get('ins').contains('Test Integration')
                }
            },
            {
                'label': 'Props', 'validate': (x) => {
                    x.get('del').contains('prop1, prop2')
                    x.get('ins').contains('prop1, prop2, prop3')
                }
            },
            {
                'label': 'Item URL', 'validate': (x) => {
                    x.get('del').contains('https://google.com/${id}')
                    x.get('ins').contains('https://google.com/api/${id}')
                }
            },
            {
                'label': 'Request HTTP Method', 'validate': (x) => {
                    x.get('del').contains('GET')
                    x.get('ins').contains('DELETE')
                }
            },
            {
                'label': 'Request URL', 'validate': (x) => {
                    x.get('del').contains('/')
                    x.get('ins').contains('/all')
                }
            },
            {
                'label': 'Request HTTP Headers', 'validate': (x) => {
                    x.get('del').contains('Accept: application-json')
                    x.get('ins').contains('Accept: application-json, Authorization: token ${token}')
                }
            },
            {
                'label': 'Request HTTP Body', 'validate': (x) => {
                    x.get('del').contains('{ "q": "${q}" }')
                    x.get('ins').contains('{ "q": "${q}", "yes": true }')
                }
            },
            {
                'label': 'Response List Field', 'validate': (x) => {
                    x.get('del').contains('items')
                    x.get('ins').contains('fields')
                }
            },
            {
                'label': 'Response Item ID', 'validate': (x) => {
                    x.get('del').contains('id')
                    x.get('ins').contains('doi')
                }
            },
            {
                'label': 'Response Item Template', 'validate': (x) => {
                    x.get('del').contains('name')
                    x.get('ins').contains('title')
                }
            }
        ])
        migration.checkDiffTreeEdited(['Test Integration'])
        migration.apply()

        migration.finishMigrationAndPublish(1, 5, 1)
        migration.verifyChildPackageForMigration(config, '1.5.1', '1.5.0')
    })

    it('can migrate with applying "delete integration"', () => {
        migration.createMigration(config, '1.5.1', '1.5.2')

        migration.expectEvent('974f0ecf-208f-4316-80ba-7ea1e2585da1')
        migration.checkMigrationForm([
            {
                'label': 'Type', 'validate': (x) => {
                    x.get('del').contains('Api')
                }
            },
            {
                'label': 'ID', 'validate': (x) => {
                    x.get('del').contains('google')
                }
            },
            {
                'label': 'Name', 'validate': (x) => {
                    x.get('del').contains('Test Integration')
                }
            },
            {
                'label': 'Props', 'validate': (x) => {
                    x.get('del').contains('prop1, prop2, prop3')
                }
            },
            {
                'label': 'Item URL', 'validate': (x) => {
                    x.get('del').contains('https://google.com/api/${id}')
                }
            },
            {
                'label': 'Request HTTP Method', 'validate': (x) => {
                    x.get('del').contains('DELETE')
                }
            },
            {
                'label': 'Request URL', 'validate': (x) => {
                    x.get('del').contains('/all')
                }
            },
            {
                'label': 'Request HTTP Headers', 'validate': (x) => {
                    x.get('del').contains('Accept: application-json, Authorization: token ${token}')
                }
            },
            {
                'label': 'Request HTTP Body', 'validate': (x) => {
                    x.get('del').contains('{ "q": "${q}", "yes": true }')
                }
            },
            {
                'label': 'Response List Field', 'validate': (x) => {
                    x.get('del').contains('fields')
                }
            },
            {
                'label': 'Response Item ID', 'validate': (x) => {
                    x.get('del').contains('doi')
                }
            },
            {
                'label': 'Response Item Template', 'validate': (x) => {
                    x.get('del').contains('title')
                }
            }
        ])
        migration.checkDiffTreeDeleted(['Test Integration'])
        migration.apply()

        migration.finishMigrationAndPublish(1, 5, 2)
        migration.verifyChildPackageForMigration(config, '1.5.2', '1.5.1')
    })

    // QUESTION
    it('can migrate with applying "add question"', () => {
        migration.createMigration(config, '1.5.2', '1.6.0')

        migration.expectEvent('4eea8d70-646f-4640-b6bd-205a8f57e806')
        migration.checkMigrationForm([
            {
                'label': 'Type', 'validate': (x) => {
                    x.get('ins').contains('Options')
                }
            },
            {
                'label': 'Title', 'validate': (x) => {
                    x.get('ins').contains('Question 1.2')
                }
            },
            {
                'label': 'Text', 'validate': (x) => { }
            },
            {
                'label': 'Tags', 'validate': (x) => {
                    x.contains('-')
                }
            }
        ])
        migration.checkDiffTreeAdded(['Question 1.2'])
        migration.apply()

        migration.expectEvent('d45f1014-9c89-4678-baa8-db9850d4b5c9')
        migration.checkMigrationForm([
            {
                'label': 'Type', 'validate': (x) => {
                    x.get('ins').contains('List')
                }
            },
            {
                'label': 'Title', 'validate': (x) => {
                    x.get('ins').contains('Question 1.3')
                }
            },
            {
                'label': 'Text', 'validate': (x) => {
                    x.get('ins').contains('Some text')
                }
            },
            {
                'label': 'Tags', 'validate': (x) => {
                    x.contains('-')
                }
            }
        ])
        migration.checkDiffTreeAdded(['Question 1.3'])
        migration.apply()

        migration.expectEvent('65ec27bb-2579-4d4c-b641-7de47392363c')
        migration.checkMigrationForm([
            {
                'label': 'Type', 'validate': (x) => {
                    x.get('ins').contains('Value')
                }
            },
            {
                'label': 'Title', 'validate': (x) => {
                    x.get('ins').contains('Question 1.4')
                }
            },
            {
                'label': 'Text', 'validate': (x) => { }
            },
            {
                'label': 'Value Type', 'validate': (x) => {
                    x.get('ins').contains('String')
                }
            },
            {
                'label': 'Tags', 'validate': (x) => {
                    x.contains('-')
                }
            }
        ])
        migration.checkDiffTreeAdded(['Question 1.4'])
        migration.apply()

        migration.expectEvent('be7b2164-f50f-4486-81e5-26c1858944bd')
        migration.apply()

        migration.expectEvent('2e7584bf-c129-49cb-82d0-04da97124cee')
        migration.checkMigrationForm([
            {
                'label': 'Type', 'validate': (x) => {
                    x.get('ins').contains('Integration')
                }
            },
            {
                'label': 'Title', 'validate': (x) => {
                    x.get('ins').contains('Question 1.5')
                }
            },
            {
                'label': 'Text', 'validate': (x) => { }
            },
            {
                'label': 'Integration', 'validate': (x) => {
                    x.get('ins').contains('Dummy Integration')
                }
            },
            {
                'label': 'Props', 'validate': (x) => {
                    x.contains('-')
                }
            },
            {
                'label': 'Tags', 'validate': (x) => {
                    x.contains('-')
                }
            }
        ])
        migration.checkDiffTreeAdded(['Question 1.5'])
        migration.apply()

        migration.finishMigrationAndPublish(1, 6, 0)
        migration.verifyChildPackageForMigration(config, '1.6.0', '1.5.2')
    })

    it('can migrate with applying "edit question" 1', () => {
        migration.createMigration(config, '1.6.0', '1.6.1')

        migration.expectEvent('91d7260e-6835-4b19-a601-a8c0c17f5d31')
        migration.checkMigrationForm([
            {
                'label': 'Type', 'validate': (x) => {
                    x.contains('Options')
                }
            },
            {
                'label': 'Title', 'validate': (x) => {
                    x.get('del').contains('Question 1.2')
                    x.get('ins').contains('Question 1.2 (options)')
                }
            },
            {
                'label': 'Text', 'validate': (x) => {
                    x.get('ins').contains('Some options question')
                }
            },
            {
                'label': 'Tags', 'validate': (x) => {
                    x.contains('-')
                }
            },
            {
                'label': 'Answers', 'validate': (x) => {
                    x.contains('-')
                }
            },
            {
                'label': 'References', 'validate': (x) => {
                    x.contains('-')
                }
            },
            {
                'label': 'Experts', 'validate': (x) => {
                    x.contains('-')
                }
            }
        ])
        migration.checkDiffTreeEdited(['Question 1.2 (options)'])
        migration.apply()

        migration.expectEvent('c3540ce9-e4b4-4594-b078-009d500434ff')
        migration.checkMigrationForm([
            {
                'label': 'Type', 'validate': (x) => {
                    x.contains('List')
                }
            },
            {
                'label': 'Title', 'validate': (x) => {
                    x.get('del').contains('Question 1.3')
                    x.get('ins').contains('Question 1.3 (list)')
                }
            },
            {
                'label': 'Text', 'validate': (x) => {
                    x.get('del').contains('Some text')
                    x.get('ins').contains('Some list question')
                }
            },
            {
                'label': 'Tags', 'validate': (x) => {
                    x.contains('-')
                }
            },
            {
                'label': 'Questions', 'validate': (x) => {
                    x.contains('-')
                }
            },
            {
                'label': 'References', 'validate': (x) => {
                    x.contains('-')
                }
            },
            {
                'label': 'Experts', 'validate': (x) => {
                    x.contains('-')
                }
            }
        ])
        migration.checkDiffTreeEdited(['Question 1.3 (list)'])
        migration.apply()

        migration.expectEvent('f5ad501c-ac6d-4357-8e6d-2711e056c148')
        migration.checkMigrationForm([
            {
                'label': 'Type', 'validate': (x) => {
                    x.contains('Value')
                }
            },
            {
                'label': 'Title', 'validate': (x) => {
                    x.get('del').contains('Question 1.4')
                    x.get('ins').contains('Question 1.4 (value)')
                }
            },
            {
                'label': 'Text', 'validate': (x) => {
                    x.get('ins').contains('some number that used to be string')
                }
            },
            {
                'label': 'Value Type', 'validate': (x) => {
                    x.get('del').contains('String')
                    x.get('ins').contains('Number')
                }
            },
            {
                'label': 'Tags', 'validate': (x) => {
                    x.contains('-')
                }
            },
            {
                'label': 'References', 'validate': (x) => {
                    x.contains('-')
                }
            },
            {
                'label': 'Experts', 'validate': (x) => {
                    x.contains('-')
                }
            }
        ])
        migration.checkDiffTreeEdited(['Question 1.4 (value)'])
        migration.apply()

        migration.expectEvent('fad4a198-5f53-40eb-a09e-837ba29b063b')
        migration.checkMigrationForm([
            {
                'label': 'Type', 'validate': (x) => {
                    x.contains('Integration')
                }
            },
            {
                'label': 'Title', 'validate': (x) => {
                    x.get('del').contains('Question 1.5')
                    x.get('ins').contains('Question 1.5 (integration)')
                }
            },
            {
                'label': 'Text', 'validate': (x) => {
                    x.get('ins').contains('integration question that changed integration')
                }
            },
            {
                'label': 'Integration', 'validate': (x) => { }
            },
            {
                'label': 'Props', 'validate': (x) => { }
            },
            {
                'label': 'Tags', 'validate': (x) => {
                    x.contains('-')
                }
            },
            {
                'label': 'References', 'validate': (x) => {
                    x.contains('-')
                }
            },
            {
                'label': 'Experts', 'validate': (x) => {
                    x.contains('-')
                }
            }
        ])
        migration.checkDiffTreeEdited(['Question 1.5 (integration)'])
        migration.apply()

        migration.expectEvent('1cce11e4-bb09-4169-9de6-fb6b3a355141')
        migration.apply()

        migration.expectEvent('c43ea178-9a65-435c-b551-759a531a5cc5')
        migration.checkMigrationForm([
            {
                'label': 'Type', 'validate': (x) => {
                    x.contains('Integration')
                }
            },
            {
                'label': 'Title', 'validate': (x) => {
                    x.contains('Question 1.5 (integration)')
                }
            },
            {
                'label': 'Text', 'validate': (x) => {
                    x.contains('integration question that changed integration')
                }
            },
            {
                'label': 'Integration', 'validate': (x) => { }
            },
            {
                'label': 'Props', 'validate': (x) => { }
            },
            {
                'label': 'Tags', 'validate': (x) => {
                    x.contains('-')
                }
            },
            {
                'label': 'References', 'validate': (x) => {
                    x.contains('-')
                }
            },
            {
                'label': 'Experts', 'validate': (x) => {
                    x.contains('-')
                }
            }
        ])
        migration.checkDiffTreeEdited(['Question 1.5 (integration)'])
        migration.apply()

        migration.finishMigrationAndPublish(1, 6, 1)
        migration.verifyChildPackageForMigration(config, '1.6.1', '1.6.0')
    })

    it('can migrate with applying "edit question" 2', () => {
        migration.createMigration(config, '1.6.1', '1.6.2')

        migration.expectEvent('ebdc4add-a99a-4b80-afad-660f19106b9d')
        migration.apply()

        migration.expectEvent('f72de8ff-7230-4f3e-98c8-0ac423d79498')
        migration.checkMigrationForm([
            {
                'label': 'Type', 'validate': (x) => {
                    x.get('del').contains('Value')
                    x.get('ins').contains('List')
                }
            },
            {
                'label': 'Title', 'validate': (x) => {
                    x.get('del').contains('Question 1.4 (value)')
                    x.get('ins').contains('Question 1.4 (items)')
                }
            },
            {
                'label': 'Text', 'validate': (x) => {
                    x.contains('some number that used to be string')
                }
            },
            {
                'label': 'Tags', 'validate': (x) => {
                    x.contains('-')
                }
            },
            {
                'label': 'Questions', 'validate': (x) => {
                    x.contains('-')
                }
            },
            {
                'label': 'References', 'validate': (x) => {
                    x.contains('-')
                }
            },
            {
                'label': 'Experts', 'validate': (x) => {
                    x.contains('-')
                }
            }
        ])
        migration.checkDiffTreeEdited(['Question 1.4 (items)'])
        migration.apply()

        migration.expectEvent('64ff7d51-a5ab-49a6-a85b-91dcb8f30897')
        migration.checkMigrationForm([
            {
                'label': 'Type', 'validate': (x) => {
                    x.contains('Value')
                }
            },
            {
                'label': 'Title', 'validate': (x) => {
                    x.get('del').contains('Question 1.5 (integration)')
                    x.get('ins').contains('Question 1.5 (value)')
                }
            },
            {
                'label': 'Text', 'validate': (x) => {
                    x.contains('integration question that changed integration')
                }
            },
            {
                'label': 'Value Type', 'validate': (x) => {
                    x.contains('String')
                }
            },
            {
                'label': 'Tags', 'validate': (x) => {
                    x.contains('-')
                }
            },
            {
                'label': 'References', 'validate': (x) => {
                    x.contains('-')
                }
            },
            {
                'label': 'Experts', 'validate': (x) => {
                    x.contains('-')
                }
            }
        ])
        migration.checkDiffTreeEdited(['Question 1.5 (value)'])
        migration.apply()

        migration.expectEvent('728e5090-0270-414d-aed9-158d0e2a1ef1')
        migration.checkMigrationForm([
            {
                'label': 'Type', 'validate': (x) => {
                    x.get('del').contains('List')
                    x.get('ins').contains('Options')
                }
            },
            {
                'label': 'Title', 'validate': (x) => {
                    x.contains('Question 1.3 (list)')
                }
            },
            {
                'label': 'Text', 'validate': (x) => {
                    x.contains('Some list question')
                }
            },
            {
                'label': 'Tags', 'validate': (x) => {
                    x.contains('-')
                }
            },
            {
                'label': 'Answers', 'validate': (x) => {
                    x.contains('-')
                }
            },
            {
                'label': 'References', 'validate': (x) => {
                    x.contains('-')
                }
            },
            {
                'label': 'Experts', 'validate': (x) => {
                    x.contains('-')
                }
            }
        ])
        migration.checkDiffTreeEdited(['Question 1.3 (list)'])
        migration.apply()

        migration.expectEvent('0b737043-4544-488b-82ba-371ef559cbc7')
        migration.checkMigrationForm([
            {
                'label': 'Type', 'validate': (x) => {
                    x.contains('Options')
                }
            },
            {
                'label': 'Title', 'validate': (x) => {
                    x.get('del').contains('Question 1.3 (list)')
                    x.get('ins').contains('Question 1.3 (options)')
                }
            },
            {
                'label': 'Text', 'validate': (x) => {
                    x.contains('Some list question')
                }
            },
            {
                'label': 'Tags', 'validate': (x) => {
                    x.contains('-')
                }
            },
            {
                'label': 'Answers', 'validate': (x) => {
                    x.contains('-')
                }
            },
            {
                'label': 'References', 'validate': (x) => {
                    x.contains('-')
                }
            },
            {
                'label': 'Experts', 'validate': (x) => {
                    x.contains('-')
                }
            }
        ])
        migration.checkDiffTreeEdited(['Question 1.3 (options)'])
        migration.apply()

        migration.expectEvent('8a9f599e-ad41-43ee-bb42-c42fa767adf6')
        migration.checkMigrationForm([
            {
                'label': 'Type', 'validate': (x) => {
                    x.get('del').contains('Options')
                    x.get('ins').contains('Value')
                }
            },
            {
                'label': 'Title', 'validate': (x) => {
                    x.get('del').contains('Question 1.2 (options)')
                    x.get('ins').contains('Question 1.2 (value)')
                }
            },
            {
                'label': 'Text', 'validate': (x) => {
                    x.contains('Some options question')
                }
            },
            {
                'label': 'Value Type', 'validate': (x) => {
                    x.get('ins').contains('Number')
                }
            },
            {
                'label': 'Tags', 'validate': (x) => {
                    x.contains('-')
                }
            },
            {
                'label': 'References', 'validate': (x) => {
                    x.contains('-')
                }
            },
            {
                'label': 'Experts', 'validate': (x) => {
                    x.contains('-')
                }
            }
        ])
        migration.checkDiffTreeEdited(['Question 1.2 (value)'])
        migration.apply()

        migration.expectEvent('67e859e4-0c3f-41de-8976-153647b58f58')
        migration.checkMigrationForm([
            {
                'label': 'Type', 'validate': (x) => {
                    x.get('del').contains('Value')
                    x.get('ins').contains('Integration')
                }
            },
            {
                'label': 'Title', 'validate': (x) => {
                    x.get('del').contains('Question 1.2 (value)')
                    x.get('ins').contains('Question 1.2 (integration)')
                }
            },
            {
                'label': 'Text', 'validate': (x) => {
                    x.contains('Some options question')
                }
            },
            {
                'label': 'Integration', 'validate': (x) => { }
            },
            {
                'label': 'Props', 'validate': (x) => {
                    x.contains('-')
                }
            },
            {
                'label': 'Tags', 'validate': (x) => {
                    x.contains('-')
                }
            },
            {
                'label': 'References', 'validate': (x) => {
                    x.contains('-')
                }
            },
            {
                'label': 'Experts', 'validate': (x) => {
                    x.contains('-')
                }
            }
        ])
        migration.checkDiffTreeEdited(['Question 1.2 (integration)'])
        migration.apply()

        migration.finishMigrationAndPublish(1, 6, 2)
        migration.verifyChildPackageForMigration(config, '1.6.2', '1.6.1')
    })

    it('can migrate with applying "delete question"', () => {
        migration.createMigration(config, '1.6.2', '1.6.3')

        migration.expectEvent('dce24a0f-9bc6-4a3f-ac86-468a41603383')
        migration.apply()

        migration.expectEvent('5bd4a2be-a576-4ece-bbf2-37ff4cff4549')
        migration.checkMigrationForm([
            {
                'label': 'Type', 'validate': (x) => {
                    x.get('del').contains('Value')
                }
            },
            {
                'label': 'Title', 'validate': (x) => {
                    x.get('del').contains('Question 1.2 (integration)')
                }
            },
            {
                'label': 'Text', 'validate': (x) => {
                    x.get('del').contains('Some options question')
                }
            },
            {
                'label': 'Value Type', 'validate': (x) => {
                    x.get('del').contains('String')
                }
            },
            {
                'label': 'Tags', 'validate': (x) => {
                    x.contains('-')
                }
            },
            {
                'label': 'References', 'validate': (x) => {
                    x.contains('-')
                }
            },
            {
                'label': 'Experts', 'validate': (x) => {
                    x.contains('-')
                }
            }
        ])
        migration.checkDiffTreeDeleted(['Question 1.2 (integration)'])
        migration.apply()

        migration.expectEvent('2d4f3878-cbb5-494d-b8cb-0b0d4e60a68c')
        migration.checkMigrationForm([
            {
                'label': 'Type', 'validate': (x) => {
                    x.get('del').contains('Options')
                }
            },
            {
                'label': 'Title', 'validate': (x) => {
                    x.get('del').contains('Question 1.3 (options)')
                }
            },
            {
                'label': 'Text', 'validate': (x) => {
                    x.get('del').contains('Some list question')
                }
            },
            {
                'label': 'Tags', 'validate': (x) => {
                    x.contains('-')
                }
            },
            {
                'label': 'Answers', 'validate': (x) => {
                    x.contains('-')
                }
            },
            {
                'label': 'References', 'validate': (x) => {
                    x.contains('-')
                }
            },
            {
                'label': 'Experts', 'validate': (x) => {
                    x.contains('-')
                }
            }
        ])
        migration.checkDiffTreeDeleted(['Question 1.3 (options)'])
        migration.apply()

        migration.expectEvent('489d747f-7795-4eac-bab7-9191d0db414f')
        migration.checkMigrationForm([
            {
                'label': 'Type', 'validate': (x) => {
                    x.get('del').contains('List')
                }
            },
            {
                'label': 'Title', 'validate': (x) => {
                    x.get('del').contains('Question 1.4 (items)')
                }
            },
            {
                'label': 'Text', 'validate': (x) => {
                    x.get('del').contains('some number that used to be string')
                }
            },
            {
                'label': 'Tags', 'validate': (x) => {
                    x.contains('-')
                }
            },
            {
                'label': 'Questions', 'validate': (x) => {
                    x.contains('-')
                }
            },
            {
                'label': 'References', 'validate': (x) => {
                    x.contains('-')
                }
            },
            {
                'label': 'Experts', 'validate': (x) => {
                    x.contains('-')
                }
            }
        ])
        migration.checkDiffTreeDeleted(['Question 1.4 (items)'])
        migration.apply()

        migration.expectEvent('54302389-bfe1-45ce-9527-df5afb45ba36')
        migration.checkMigrationForm([
            {
                'label': 'Type', 'validate': (x) => {
                    x.get('del').contains('Value')
                }
            },
            {
                'label': 'Title', 'validate': (x) => {
                    x.get('del').contains('Question 1.5 (value)')
                }
            },
            {
                'label': 'Text', 'validate': (x) => {
                    x.get('del').contains('integration question that changed integration')
                }
            },
            {
                'label': 'Value Type', 'validate': (x) => {
                    x.get('del').contains('String')
                }
            },
            {
                'label': 'Tags', 'validate': (x) => {
                    x.contains('-')
                }
            },
            {
                'label': 'References', 'validate': (x) => {
                    x.contains('-')
                }
            },
            {
                'label': 'Experts', 'validate': (x) => {
                    x.contains('-')
                }
            }
        ])
        migration.checkDiffTreeDeleted(['Question 1.5 (value)'])
        migration.apply()

        migration.finishMigrationAndPublish(1, 6, 3)
        migration.verifyChildPackageForMigration(config, '1.6.3', '1.6.2')
    })

    // ANSWER
    it('can migrate with applying "add answer"', () => {
        migration.createMigration(config, '1.6.3', '1.7.0')

        migration.expectEvent('9fff84eb-bc94-4577-b03d-1dedfebc4c9a')
        migration.checkMigrationForm([
            {
                'label': 'Label', 'validate': (x) => {
                    x.get('ins').contains('Answer 1.1c')
                }
            },
            {
                'label': 'Advice', 'validate': (x) => { }
            },
            {
                'label': 'Metrics', 'validate': (x) => {
                    x.contains('-')
                }
            }
        ])
        migration.checkDiffTreeAdded(['Answer 1.1c'])
        migration.apply()

        migration.expectEvent('6ad4c1a1-d869-4b31-a0f9-ce99d15059fd')
        migration.checkMigrationForm([
            {
                'label': 'Label', 'validate': (x) => {
                    x.get('ins').contains('Answer 1.1d')
                }
            },
            {
                'label': 'Advice', 'validate': (x) => {
                    x.get('ins').contains('are u sure?')
                }
            },
            {
                'label': 'Metrics', 'validate': (x) => {
                    x.contains('-')
                }
            }
        ])
        migration.checkDiffTreeAdded(['Answer 1.1d'])
        migration.apply()

        migration.finishMigrationAndPublish(1, 7, 0)
        migration.verifyChildPackageForMigration(config, '1.7.0', '1.6.3')
    })

    it('can migrate with applying "edit answer"', () => {
        migration.createMigration(config, '1.7.0', '1.7.1')

        // reorder
        migration.expectEvent('2d1eeb71-c890-4954-afd1-46ffbd20712b')
        migration.checkMigrationForm([
            {
                'label': 'Type', 'validate': (x) => {
                    x.contains('Options')
                }
            },
            {
                'label': 'Title', 'validate': (x) => {
                    x.contains('Question 1.1')
                }
            },
            {
                'label': 'Text', 'validate': (x) => { }
            },
            {
                'label': 'Tags', 'validate': (x) => {
                    x.contains('-')
                }
            },
            {
                'label': 'Answers', 'validate': (x) => {
                    x.get('ul.del li').should('have.length', 4)
                    x.get('ul.del li').eq(0).contains('Answer 1.1a')
                    x.get('ul.del li').eq(1).contains('Answer 1.1b')
                    x.get('ul.del li').eq(2).contains('Answer 1.1c')
                    x.get('ul.del li').eq(3).contains('Answer 1.1d')
                    x.get('ul.ins li').should('have.length', 4)
                    x.get('ul.ins li').eq(0).contains('Answer 1.1a')
                    x.get('ul.ins li').eq(1).contains('Answer 1.1b')
                    x.get('ul.ins li').eq(2).contains('Answer 1.1d')
                    x.get('ul.ins li').eq(3).contains('Answer 1.1c')
                }
            },
            {
                'label': 'References', 'validate': (x) => {
                    x.contains('-')
                }
            },
            {
                'label': 'Experts', 'validate': (x) => {
                    x.contains('-')
                }
            }
        ])
        migration.checkDiffTreeEdited(['Question 1.1'])
        migration.apply()

        migration.expectEvent('72fc7f05-644c-4bd2-b77b-190952934138')
        migration.checkMigrationForm([
            {
                'label': 'Label', 'validate': (x) => {
                    x.get('del').contains('Answer 1.1d')
                    x.get('ins').contains('Answer 1.1 one')
                }
            },
            {
                'label': 'Advice', 'validate': (x) => {
                    x.get('del').contains('are u sure?')
                    x.get('ins').contains('are you really sure?')
                }
            },
            {
                'label': 'Questions', 'validate': (x) => {
                    x.contains('-')
                }
            },
            {
                'label': 'Metrics', 'validate': (x) => {
                    x.get('ul.ins > li').should('have.length', 2)
                    x.get('ul.ins > li').eq(0).contains('Findability (weight = 1, measure = 1)')
                    x.get('ul.ins > li').eq(1).contains('Good DMP Practice (weight = 0, measure = 0.3)')
                }
            }
        ])
        migration.checkDiffTreeEdited(['Answer 1.1 one'])
        migration.apply()

        migration.expectEvent('eb77d742-42f9-4216-b53a-e8512a84898c')
        migration.checkMigrationForm([
            {
                'label': 'Label', 'validate': (x) => {
                    x.get('del').contains('Answer 1.1c')
                    x.get('ins').contains('Answer 1.1 two')
                }
            },
            {
                'label': 'Advice', 'validate': (x) => {
                    x.get('ins').contains('Yay!')
                }
            },
            {
                'label': 'Questions', 'validate': (x) => {
                    x.contains('-')
                }
            },
            {
                'label': 'Metrics', 'validate': (x) => {
                    x.get('ul.ins > li').should('have.length', 2)
                    x.get('ul.ins > li').eq(0).contains('Accessibility (weight = 1, measure = 0.2)')
                    x.get('ul.ins > li').eq(1).contains('Openness (weight = 0.5, measure = 1)')
                }
            }
        ])
        migration.checkDiffTreeEdited(['Answer 1.1 two'])
        migration.apply()

        migration.finishMigrationAndPublish(1, 7, 1)
        migration.verifyChildPackageForMigration(config, '1.7.1', '1.7.0')
    })


    it('can migrate with applying "delete answer"', () => {
        migration.createMigration(config, '1.7.1', '1.7.2')

        migration.expectEvent('134b55b7-c5d6-45ce-8879-39256043c9b1')
        migration.checkMigrationForm([
            {
                'label': 'Label', 'validate': (x) => {
                    x.get('del').contains('Answer 1.1 one')
                }
            },
            {
                'label': 'Advice', 'validate': (x) => {
                    x.get('del').contains('are you really sure?')
                }
            },
            {
                'label': 'Questions', 'validate': (x) => {
                    x.contains('-')
                }
            },
            {
                'label': 'Metrics', 'validate': (x) => {
                    x.get('ul.del > li').should('have.length', 2)
                    x.get('ul.del > li').eq(0).contains('Findability (weight = 1, measure = 1)')
                    x.get('ul.del > li').eq(1).contains('Good DMP Practice (weight = 0, measure = 0.3)')
                }
            }
        ])
        migration.checkDiffTreeDeleted(['Answer 1.1 one'])
        migration.apply()

        migration.expectEvent('9765b08a-bc7c-41a6-8485-b51164b744d8')
        migration.checkMigrationForm([
            {
                'label': 'Label', 'validate': (x) => {
                    x.get('del').contains('Answer 1.1 two')
                }
            },
            {
                'label': 'Advice', 'validate': (x) => {
                    x.get('del').contains('Yay!')
                }
            },
            {
                'label': 'Questions', 'validate': (x) => {
                    x.contains('-')
                }
            },
            {
                'label': 'Metrics', 'validate': (x) => {
                    x.get('ul.del > li').should('have.length', 2)
                    x.get('ul.del > li').eq(0).contains('Accessibility (weight = 1, measure = 0.2)')
                    x.get('ul.del > li').eq(1).contains('Openness (weight = 0.5, measure = 1)')
                }
            }
        ])
        migration.checkDiffTreeDeleted(['Answer 1.1 two'])
        migration.apply()

        migration.finishMigrationAndPublish(1, 7, 2)
        migration.verifyChildPackageForMigration(config, '1.7.2', '1.7.1')
    })

    // FOLLOW-UP QUESTION
    it('can migrate with applying "add follow-up question"', () => {
        migration.createMigration(config, '1.7.2', '1.8.0')

        migration.expectEvent('42d14c51-19e3-444a-b63b-8f63908b87b7')
        migration.checkMigrationForm([
            {
                'label': 'Type', 'validate': (x) => {
                    x.get('ins').contains('Options')
                }
            },
            {
                'label': 'Title', 'validate': (x) => {
                    x.get('ins').contains('Followup options 1.1a.1')
                }
            },
            {
                'label': 'Text', 'validate': (x) => { }
            },
            {
                'label': 'Tags', 'validate': (x) => {
                    x.contains('-')
                }
            }
        ])
        migration.checkDiffTreeAdded(['Followup options 1.1a.1'])
        migration.apply()

        migration.expectEvent('78461d3b-788c-4c59-9346-851e31d87a26')
        migration.checkMigrationForm([
            {
                'label': 'Type', 'validate': (x) => {
                    x.get('ins').contains('Value')
                }
            },
            {
                'label': 'Title', 'validate': (x) => {
                    x.get('ins').contains('Followup value 1.1a.2')
                }
            },
            {
                'label': 'Text', 'validate': (x) => { }
            },
            {
                'label': 'Value Type', 'validate': (x) => {
                    x.get('ins').contains('String')
                }
            },
            {
                'label': 'Tags', 'validate': (x) => {
                    x.contains('-')
                }
            }
        ])
        migration.checkDiffTreeAdded(['Followup value 1.1a.2'])
        migration.apply()

        migration.expectEvent('a3a74fae-5926-4f14-a4dd-13907531c331')
        migration.checkMigrationForm([
            {
                'label': 'Type', 'validate': (x) => {
                    x.get('ins').contains('List')
                }
            },
            {
                'label': 'Title', 'validate': (x) => {
                    x.get('ins').contains('Followup list 1.1a.3')
                }
            },
            {
                'label': 'Text', 'validate': (x) => { }
            },
            {
                'label': 'Tags', 'validate': (x) => {
                    x.contains('-')
                }
            }
        ])
        migration.checkDiffTreeAdded(['Followup list 1.1a.3'])
        migration.apply()

        migration.finishMigrationAndPublish(1, 8, 0)
        migration.verifyChildPackageForMigration(config, '1.8.0', '1.7.2')
    })

    
    it('can migrate with applying "edit follow-up question"', () => {
        migration.createMigration(config, '1.8.0', '1.8.1')

        // reorder followups
        cy.getCy('km-editor_migration').should('exist')
        migration.checkMigrationForm([
            {
                'label': 'Label', 'validate': (x) => {
                    x.contains('Answer 1.1a')
                }
            },
            {
                'label': 'Advice', 'validate': (x) => { }
            },
            {
                'label': 'Questions', 'validate': (x) => {
                    x.get('ul.del > li').should('have.length', 4)
                    x.get('ul.del > li').eq(0).contains('Custom followup')
                    x.get('ul.del > li').eq(1).contains('Followup options 1.1a.1')
                    x.get('ul.del > li').eq(2).contains('Followup value 1.1a.2')
                    x.get('ul.del > li').eq(3).contains('Followup list 1.1a.3')
                    x.get('ul.ins > li').should('have.length', 4)
                    x.get('ul.ins > li').eq(0).contains('Followup value 1.1a.2')
                    x.get('ul.ins > li').eq(1).contains('Followup list 1.1a.3')
                    x.get('ul.ins > li').eq(2).contains('Followup options 1.1a.1')
                    x.get('ul.ins > li').eq(3).contains('Custom followup')
                }
            },
            {
                'label': 'Metrics', 'validate': (x) => {
                    x.contains('-')
                }
            }
        ])
        migration.checkDiffTreeEdited(['Answer 1.1a'])
        migration.apply()

        migration.expectEvent('03c0e7db-330c-4226-8889-f8c25969a8ad')
        migration.checkMigrationForm([
            {
                'label': 'Type', 'validate': (x) => {
                    x.contains('Options')
                }
            },
            {
                'label': 'Title', 'validate': (x) => {
                    x.get('del').contains('Followup options 1.1a.1')
                    x.get('ins').contains('Followup options 1.1a.4')
                }
            },
            {
                'label': 'Text', 'validate': (x) => { }
            },
            {
                'label': 'Tags', 'validate': (x) => {
                    x.contains('-')
                }
            },
            {
                'label': 'Answers', 'validate': (x) => {
                    x.contains('-')
                }
            },
            {
                'label': 'References', 'validate': (x) => {
                    x.contains('-')
                }
            },
            {
                'label': 'Experts', 'validate': (x) => {
                    x.contains('-')
                }
            }
        ])
        migration.checkDiffTreeEdited(['Followup options 1.1a.4'])
        migration.apply()

        migration.expectEvent('1b45ba27-6dfd-47cf-8bb5-82997be47ee5')
        migration.checkDiffTreeAdded(['See also'])
        migration.apply()

        migration.expectEvent('c3358d8b-b43d-4983-ab05-689adb953d67')
        migration.checkMigrationForm([
            {
                'label': 'Type', 'validate': (x) => {
                    x.contains('List')
                }
            },
            {
                'label': 'Title', 'validate': (x) => {
                    x.contains('Followup list 1.1a.3')
                }
            },
            {
                'label': 'Text', 'validate': (x) => {
                    x.get('ins').contains('some items')
                }
            },
            {
                'label': 'Tags', 'validate': (x) => {
                    x.contains('-')
                }
            },
            {
                'label': 'Questions', 'validate': (x) => {
                    x.contains('-')
                }
            },
            {
                'label': 'References', 'validate': (x) => {
                    x.contains('-')
                }
            },
            {
                'label': 'Experts', 'validate': (x) => {
                    x.contains('-')
                }
            }
        ])
        migration.checkDiffTreeEdited(['Followup list 1.1a.3'])
        migration.apply()

        migration.expectEvent('874e5f1b-2bce-46c1-9bd7-27c490ae0e02')
        migration.checkDiffTreeAdded(['New question'])
        migration.apply()

        migration.expectEvent('7fbd5460-de15-425d-bbf0-2445849d8569')
        migration.checkMigrationForm([
            {
                'label': 'Type', 'validate': (x) => {
                    x.contains('Value')
                }
            },
            {
                'label': 'Title', 'validate': (x) => {
                    x.contains('Followup value 1.1a.2')
                }
            },
            {
                'label': 'Text', 'validate': (x) => { }
            },
            {
                'label': 'Value Type', 'validate': (x) => {
                    x.get('del').contains('String')
                    x.get('ins').contains('Date')
                }
            },
            {
                'label': 'Tags', 'validate': (x) => {
                    x.contains('-')
                }
            },
            {
                'label': 'References', 'validate': (x) => {
                    x.contains('-')
                }
            },
            {
                'label': 'Experts', 'validate': (x) => {
                    x.contains('-')
                }
            }
        ])
        migration.checkDiffTreeEdited(['Followup value 1.1a.2'])
        migration.apply()

        migration.expectEvent('b145070b-833d-4fbd-83ce-00a9b01919f0')
        migration.checkDiffTreeAdded(['Followup options 1.1a.1'])
        migration.apply()

        // reorder followups
        // next event uuid changed by DSW
        cy.getCy('km-migration_event_b145070b-833d-4fbd-83ce-00a9b01919f0').should('not.exist')
        migration.checkMigrationForm([
            {
                'label': 'Label', 'validate': (x) => {
                    x.contains('Answer 1.1a')
                }
            },
            {
                'label': 'Advice', 'validate': (x) => { }
            },
            {
                'label': 'Questions', 'validate': (x) => {
                    x.get('ul.del > li').should('have.length', 5)
                    x.get('ul.del > li').eq(0).contains('Followup value 1.1a.2')
                    x.get('ul.del > li').eq(1).contains('Followup list 1.1a.3')
                    x.get('ul.del > li').eq(2).contains('Followup options 1.1a.4')
                    x.get('ul.del > li').eq(3).contains('Custom followup')
                    x.get('ul.del > li').eq(4).contains('Followup options 1.1a.1')
                    x.get('ul.ins > li').should('have.length', 5)
                    x.get('ul.ins > li').eq(0).contains('Followup options 1.1a.1')
                    x.get('ul.ins > li').eq(1).contains('Followup value 1.1a.2')
                    x.get('ul.ins > li').eq(2).contains('Followup list 1.1a.3')
                    x.get('ul.ins > li').eq(3).contains('Followup options 1.1a.4')
                    x.get('ul.ins > li').eq(4).contains('Custom followup')
                }
            },
            {
                'label': 'Metrics', 'validate': (x) => {
                    x.contains('-')
                }
            }
        ])
        migration.checkDiffTreeEdited(['Answer 1.1a'])
        migration.apply()

        migration.finishMigrationAndPublish(1, 8, 1)
        migration.verifyChildPackageForMigration(config, '1.8.1', '1.8.0', false)
    })

    it('can migrate with applying "delete follow-up question"', () => {
        migration.createMigration(config, '1.8.1', '1.8.2')

        migration.expectEvent('3e27d197-78d5-4746-90a5-fc5a6dad82b6')
        migration.checkDiffTreeDeleted(['Followup options 1.1a.1'])
        migration.apply()

        migration.expectEvent('4a4b6b6e-0e96-4b5d-b622-18efff214d66')
        migration.checkDiffTreeDeleted(['Followup list 1.1a.3'])
        migration.apply()

        migration.expectEvent('36141470-c609-4b44-8407-388c88116114')
        migration.checkDiffTreeDeleted(['Followup value 1.1a.2'])
        migration.apply()

        migration.expectEvent('ed86bc77-1add-46aa-80f1-f49562d22d44')
        migration.checkDiffTreeDeleted(['Followup options 1.1a.4'])
        migration.apply()

        migration.finishMigrationAndPublish(1, 8, 2)
        migration.verifyChildPackageForMigration(config, '1.8.2', '1.8.1')
    })

    // ITEM TEMPLATE QUESTION
    it('can migrate with applying "add item template question"', () => {
        migration.createMigration(config, '1.8.2', '1.9.0')

        migration.expectEvent('6720a49a-3a7c-47b3-ba4d-938052879482')
        cy.contains('Add question')
        migration.apply()

        migration.expectEvent('91bc7dfb-a42b-449c-a548-9c229a163b2c')
        cy.contains('Items options')
        migration.apply()

        migration.expectEvent('7749b8d9-f4e1-48c5-a938-c16195f3c1aa')
        cy.contains('New answer')
        migration.apply()

        migration.expectEvent('cf564267-dbb5-4fb6-b833-c33a4821d7fa')
        cy.contains('Items list')
        migration.apply()

        migration.expectEvent('6d29e822-a0ff-4f80-9328-9bb0123658df')
        cy.contains('Items value')
        migration.apply()

        migration.expectEvent('bb7eb904-4b35-4289-b25a-a1b19c343205')
        cy.contains('Dummy integration')
        migration.apply()

        migration.expectEvent('ce63caf1-e11a-45d6-97a7-68c1991aa53b')
        cy.contains('Items integration')
        migration.apply()

        migration.finishMigrationAndPublish(1, 9, 0)
        migration.verifyChildPackageForMigration(config, '1.9.0', '1.8.2')
    })

    it('can migrate with applying "edit item template question" 1', () => {
        migration.createMigration(config, '1.9.0', '1.9.1')

        migration.expectEvent('7bf90a1c-584e-485e-ba2c-33dbb5d1f289')
        migration.checkDiffTreeAdded(['Some follow-up'])
        migration.apply()

        migration.expectEvent('5bcbcadb-7c37-417e-b0c1-9d7d656fef97')
        migration.checkDiffTreeAdded(['Yes'])
        migration.apply()
        
        migration.expectEvent('db6a9849-984d-4992-beba-933a8208d114')
        migration.checkDiffTreeAdded(['No'])
        migration.apply()
        
        migration.expectEvent('e883e684-7653-4b01-81e8-2c5771d0cd1f')
        migration.checkDiffTreeAdded(['Another item template question'])
        migration.apply()

        migration.expectEvent('9b231994-6746-42b4-90b8-8509ef9e66b5')
        migration.checkDiffTreeEdited(['Items value'])
        migration.apply()

        migration.expectEvent('0271d4d6-fc17-448f-a16d-08f10b869ae9')
        migration.checkDiffTreeEdited(['Items integration'])
        migration.apply()

        migration.expectEvent('d83a4b49-d621-432c-9780-63c0c930d8c7')
        migration.checkDiffTreeEdited(['Items list'])
        migration.apply()

        // reorder
        migration.expectEvent('b9897b9b-ed3a-4fbc-a8ef-bf7d59b61c62')
        migration.checkMigrationForm([
            {
                'label': 'Type', 'validate': (x) => {
                    x.contains('List')
                }
            },
            {
                'label': 'Title', 'validate': (x) => {
                    x.contains('Question 1.2')
                }
            },
            {
                'label': 'Text', 'validate': (x) => {
                    x.contains('Question with items')
                }
            },
            {
                'label': 'Tags', 'validate': (x) => {
                    x.contains('-')
                }
            },
            {
                'label': 'Questions', 'validate': (x) => {
                    x.get('ul.del > li').should('have.length', 4)
                    x.get('ul.del > li').eq(0).contains('Items options')
                    x.get('ul.del > li').eq(1).contains('Items list')
                    x.get('ul.del > li').eq(2).contains('Items value')
                    x.get('ul.ins > li').eq(3).contains('Items list')
                    x.get('ul.ins > li').should('have.length', 4)
                    x.get('ul.ins > li').eq(0).contains('Items list')
                    x.get('ul.ins > li').eq(1).contains('Items value')
                    x.get('ul.ins > li').eq(2).contains('Items options')
                    x.get('ul.ins > li').eq(3).contains('Items list')
                }
            },
            {
                'label': 'References', 'validate': (x) => {
                    x.contains('-')
                }
            },
            {
                'label': 'Experts', 'validate': (x) => {
                    x.contains('-')
                }
            }
        ])
        migration.checkDiffTreeEdited(['Question 1.2'])
        migration.apply()

        migration.finishMigrationAndPublish(1, 9, 1)
        migration.verifyChildPackageForMigration(config, '1.9.1', '1.9.0')
    })

    it('can migrate with applying "edit item template question" 2', () => {
        migration.createMigration(config, '1.9.1', '1.9.2')

        migration.expectEvent('fff055e3-7498-4543-b43f-6c8ae85626d0')
        migration.checkDiffTreeDeleted(['Some follow-up'])
        migration.apply()

        migration.expectEvent('5883b713-78cb-4c9d-a7ef-ab0de8f62918')
        migration.checkDiffTreeDeleted(['Another item template question'])
        migration.apply()

        migration.finishMigrationAndPublish(1, 9, 2)
        migration.verifyChildPackageForMigration(config, '1.9.2', '1.9.1')
    })

    it('can migrate with applying "edit item template question" 3', () => {
        migration.createMigration(config, '1.9.2', '1.9.3')

        migration.expectEvent('142ece51-d301-49ac-9355-ae36540650e7')
        migration.checkDiffTreeDeleted(['Items list'])
        migration.apply()

        migration.expectEvent('4a81de49-c5d4-47a1-9a63-78420246f26c')
        migration.checkDiffTreeDeleted(['Items value'])
        migration.apply()

        migration.expectEvent('7cb52202-3dae-4758-aecf-b05f3fb3c7b9')
        migration.checkDiffTreeDeleted(['Items options'])
        migration.apply()

        migration.expectEvent('58fa4f6a-44fc-4bf9-8f88-bd5d3a706b31')
        migration.checkDiffTreeDeleted(['Items list'])
        migration.apply()

        migration.finishMigrationAndPublish(1, 9, 3)
        migration.verifyChildPackageForMigration(config, '1.9.3', '1.9.2')
    })

    // KNOWLEDGE MODEL
    it('can migrate with applying "edit knowledge model"', () => {
        migration.createMigration(config, '1.9.3', '1.10.0')

        migration.expectEvent('dd4d41ce-9359-47a3-b40f-b631da454ca7')
        migration.checkMigrationForm([
            {
                'label': 'Chapters', 'validate': (x) => {
                    x.contains('li', 'Custom chapter')
                },
            },
            {
                'label': 'Metrics', 'validate': (x) => {
                    x.contains('li', 'Findability')
                }
            },
            {
                'label': 'Phases', 'validate': (x) => {
                    x.contains('li', 'Before Submitting the Proposal')
                }
            },
            {
                'label': 'Tags', 'validate': (x) => {
                    x.contains('-')
                },
            },
            {
                'label': 'Integrations', 'validate': (x) => {
                    x.contains('Dummy integration')
                },
            }
        ])
        migration.checkDiffTreeEdited(['Child KM'])
        migration.apply()

        migration.expectEvent('e02f74e0-40b7-428d-bd3e-25d9898f2a46')
        migration.checkDiffTreeAdded(['Intro'])
        migration.apply()

        // next event uuid changed by DSW
        cy.getCy('km-migration_event_e02f74e0-40b7-428d-bd3e-25d9898f2a46').should('not.exist')
        migration.checkMigrationForm([
            {
                'label': 'Chapters', 'validate': (x) => {
                    x.get('ul.del > li').should('have.length', 3)
                    x.get('ul.del > li').eq(0).contains('Chapter 1')
                    x.get('ul.del > li').eq(1).contains('Custom chapter')
                    x.get('ul.del > li').eq(2).contains('Intro')
                    x.get('ul.ins > li').should('have.length', 3)
                    x.get('ul.ins > li').eq(0).contains('Intro')
                    x.get('ul.ins > li').eq(1).contains('Chapter 1')
                    x.get('ul.ins > li').eq(2).contains('Custom chapter')
                },
            },
            {
                'label': 'Metrics', 'validate': (x) => {
                    x.contains('li', 'Findability')
                }
            },
            {
                'label': 'Phases', 'validate': (x) => {
                    x.contains('li', 'Before Submitting the Proposal')
                }
            },
            {
                'label': 'Tags', 'validate': (x) => {
                    x.contains('-')
                },
            },
            {
                'label': 'Integrations', 'validate': (x) => {
                    x.contains('Dummy integration')
                },
            }
        ])
        migration.checkDiffTreeEdited(['Child KM'])
        migration.apply()

        migration.expectEvent('e80babb4-3309-4880-96ce-ce8eb4ab0f43')
        migration.checkDiffTreeAdded(['New Integration'])
        migration.apply()

        migration.expectEvent('c065c326-8499-42ff-92ea-33d3c9b48f89')
        migration.checkMigrationForm([
            {
                'label': 'Chapters', 'validate': (x) => {
                    x.contains('li', 'Custom chapter')
                },
            },
            {
                'label': 'Metrics', 'validate': (x) => {
                    x.contains('li', 'Findability')
                }
            },
            {
                'label': 'Phases', 'validate': (x) => {
                    x.contains('li', 'Before Submitting the Proposal')
                }
            },
            {
                'label': 'Tags', 'validate': (x) => {
                    x.contains('-')
                },
            },
            {
                'label': 'Integrations', 'validate': (x) => {
                    x.get('ul.del > li').should('have.length', 2)
                    x.get('ul.del > li').eq(0).contains('Dummy integration')
                    x.get('ul.del > li').eq(1).contains('New Integration')
                    x.get('ul.ins > li').should('have.length', 2)
                    x.get('ul.ins > li').eq(0).contains('New Integration')
                    x.get('ul.ins > li').eq(1).contains('Dummy integration')
                },
            }
        ])
        migration.checkDiffTreeEdited(['Child KM'])
        migration.apply()

        migration.finishMigrationAndPublish(1, 10, 0)
        migration.verifyChildPackageForMigration(config, '1.10.0', '1.9.3', false)
    })

    // COMPLEX
    it('can migrate with apply and reject', () => {
        migration.createMigration(config, '2.0.0', '1.11.0')

        cy.getCy('km-editor_migration').should('exist')
        migration.checkMigrationForm([
            {
                'label': 'Chapters', 'validate': (x) => {
                    x.contains('li', 'Custom chapter')
                },
            },
            {
                'label': 'Metrics', 'validate': (x) => {
                    x.contains('li', 'Findability')
                }
            },
            {
                'label': 'Phases', 'validate': (x) => {
                    x.contains('li', 'Before Submitting the Proposal')
                }
            },
            {
                'label': 'Tags', 'validate': (x) => {
                    x.contains('li', 'Custom Tag')
                },
            },
            {
                'label': 'Integrations', 'validate': (x) => {
                    x.get('ul.del > li').should('have.length', 3)
                    x.get('ul.del > li').eq(0).contains('New Integration')
                    x.get('ul.del > li').eq(1).contains('Dummy integration')
                    x.get('ul.del > li').eq(2).contains('Custom Integration')
                    x.get('ul.ins > li').should('have.length', 3)
                    x.get('ul.ins > li').eq(0).contains('Dummy integration')
                    x.get('ul.ins > li').eq(1).contains('New Integration')
                    x.get('ul.ins > li').eq(2).contains('Custom Integration')
                },
            }
        ])
        migration.checkDiffTreeEdited(['Child KM'])
        migration.apply()

        // next event uuid changed by DSW
        cy.contains('Edit question')
        migration.checkMigrationForm([
            {
                'label': 'Type', 'validate': (x) => {
                    x.contains('Options')
                },
            },
            {
                'label': 'Title', 'validate': (x) => {
                    x.contains('Question 1.1')
                },
            },
            {
                'label': 'Text', 'validate': (x) => { },
            },
            {
                'label': 'Tags', 'validate': (x) => {
                    x.contains('-')
                },
            },
            {
                'label': 'Answers', 'validate': (x) => {
                    x.get('ul.del > li').should('have.length', 3)
                    x.get('ul.del > li').eq(0).contains('Answer 1.1a')
                    x.get('ul.del > li').eq(1).contains('Answer 1.1b')
                    x.get('ul.del > li').eq(2).contains('Custom answer')
                    x.get('ul.ins > li').should('have.length', 3)
                    x.get('ul.ins > li').eq(0).contains('Answer 1.1b')
                    x.get('ul.ins > li').eq(1).contains('Answer 1.1a')
                    x.get('ul.ins > li').eq(2).contains('Custom answer')
                },
            },
            {
                'label': 'References', 'validate': (x) => {
                    x.contains('-')
                },
            },
            {
                'label': 'Experts', 'validate': (x) => {
                    x.contains('-')
                },
            }
        ])
        migration.checkDiffTreeEdited(['Question 1.1'])
        migration.apply()

        migration.expectEvent('35573362-46ef-41b6-a364-e66a0819a9c0')
        migration.checkDiffTreeAdded(['Our Specialist 1'])
        migration.apply()

        migration.expectEvent('6d33f09f-6850-49aa-998f-2cd968d3fa15')
        migration.checkDiffTreeAdded(['Our Specialist 0'])
        migration.reject()

        // next event uuid changed by DSW
        cy.getCy('km-migration_event_6d33f09f-6850-49aa-998f-2cd968d3fa15').should('not.exist')
        migration.checkMigrationForm([
            {
                'label': 'Type', 'validate': (x) => {
                    x.contains('List')
                },
            },
            {
                'label': 'Title', 'validate': (x) => {
                    x.contains('Question 1.2')
                },
            },
            {
                'label': 'Text', 'validate': (x) => {
                    x.contains('Question with items')
                },
            },
            {
                'label': 'Tags', 'validate': (x) => {
                    x.contains('-')
                },
            },
            {
                'label': 'Questions', 'validate': (x) => {
                    x.contains('-')
                },
            },
            {
                'label': 'References', 'validate': (x) => {
                    x.contains('li', 'Custom URL')
                },
            },
            {
                'label': 'Experts', 'validate': (x) => {
                    x.get('ul.del > li').should('have.length', 2)
                    x.get('ul.del > li').eq(0).contains('Mr. Custom Expert')
                    x.get('ul.del > li').eq(1).contains('Our Specialist 1')
                    x.get('ul.ins > li').should('have.length', 2)
                    x.get('ul.ins > li').eq(0).contains('Our Specialist 1')
                    x.get('ul.ins > li').eq(1).contains('Mr. Custom Expert')
                },
            }
        ])
        migration.checkDiffTreeEdited(['Question 1.2'])
        migration.apply()

        migration.expectEvent('dec48838-b562-4c7d-97cf-6d7fcfb9b2de')
        migration.checkDiffTreeAdded(['Extra chapter'])
        migration.reject()

        migration.expectEvent('813a5c88-1c8f-4370-a48e-4886235a7878')
        migration.checkDiffTreeAdded(['Question 1.0'])
        migration.apply()

        // next event uuid changed by DSW
        cy.getCy('km-migration_event_813a5c88-1c8f-4370-a48e-4886235a7878').should('not.exist')
        migration.checkDiffTreeEdited(['Chapter 1'])
        migration.checkMigrationForm([
            {
                'label': 'Title', 'validate': (x) => {
                    x.contains('Chapter 1')
                },
            },
            {
                'label': 'Text', 'validate': (x) => {
                    x.contains('Chapter text')
                },
            },
            {
                'label': 'Questions', 'validate': (x) => {
                    x.get('ul.del > li').should('have.length', 4)
                    x.get('ul.del > li').eq(0).contains('Question 1.1')
                    x.get('ul.del > li').eq(1).contains('Question 1.2')
                    x.get('ul.del > li').eq(2).contains('Custom question')
                    x.get('ul.del > li').eq(3).contains('Question 1.0')
                    x.get('ul.ins > li').should('have.length', 4)
                    x.get('ul.ins > li').eq(0).contains('Question 1.0')
                    x.get('ul.ins > li').eq(1).contains('Question 1.1')
                    x.get('ul.ins > li').eq(2).contains('Question 1.2')
                    x.get('ul.ins > li').eq(3).contains('Custom question')
                },
            }
        ])
        migration.apply()

        migration.expectEvent('2ade8b0d-f084-4481-98be-d9d2ea4f9b16')
        migration.checkDiffTreeAdded(['Extraordinary question'])
        migration.reject()

        migration.expectEvent('7fba5383-5374-49e8-a645-b7fad2ba657f')
        migration.checkDiffTreeAdded(['Answer 1.1c'])
        migration.apply()
        
        // next event uuid changed by DSW
        cy.getCy('km-migration_event_7fba5383-5374-49e8-a645-b7fad2ba657f').should('not.exist')
        migration.checkMigrationForm([
            {
                'label': 'Type', 'validate': (x) => {
                    x.contains('Options')
                },
            },
            {
                'label': 'Title', 'validate': (x) => {
                    x.contains('Question 1.1')
                },
            },
            {
                'label': 'Text', 'validate': (x) => { },
            },
            {
                'label': 'Tags', 'validate': (x) => {
                    x.contains('-')
                },
            },
            {
                'label': 'Answers', 'validate': (x) => {
                    x.get('ul.del > li').should('have.length', 4)
                    x.get('ul.del > li').eq(0).contains('Answer 1.1b')
                    x.get('ul.del > li').eq(1).contains('Answer 1.1a')
                    x.get('ul.del > li').eq(2).contains('Custom answer')
                    x.get('ul.del > li').eq(3).contains('Answer 1.1c')
                    x.get('ul.ins > li').should('have.length', 4)
                    x.get('ul.ins > li').eq(0).contains('Answer 1.1c')
                    x.get('ul.ins > li').eq(1).contains('Answer 1.1b')
                    x.get('ul.ins > li').eq(2).contains('Answer 1.1a')
                    x.get('ul.ins > li').eq(3).contains('Custom answer')
                },
            },
            {
                'label': 'References', 'validate': (x) => {
                    x.contains('-')
                },
            },
            {
                'label': 'Experts', 'validate': (x) => {
                    x.contains('-')
                },
            }
        ])
        migration.checkDiffTreeEdited(['Question 1.1'])
        migration.apply()

        migration.expectEvent('9d01e655-29d4-4c9e-a8c5-0de04996ff4e')
        migration.checkDiffTreeAdded(['nope'])
        migration.reject()

        migration.expectEvent('be06f0e8-677c-4cc5-9f21-4d906b405407')
        migration.checkDiffTreeAdded(['Extra integration'])
        migration.reject()

        // reorder with rejected integration (no reorder in the end)
        // next event uuid changed by DSW
        cy.getCy('km-migration_event_be06f0e8-677c-4cc5-9f21-4d906b405407').should('not.exist')
        migration.checkDiffTreeEdited(['Child KM'])
        migration.reject()

        migration.finishMigrationAndPublish(2, 1, 0)
        migration.verifyPackageWithBundle(
            config.getChildPackageId('2.1.0'),
            config.getChildKM('2.1.0'),
            {
                'previous_package_id': config.getChildPackageId('2.0.0'),
                'fork_of_package_id': config.getParentPackageId('1.11.0')
            },
            false
        )
    })

    it('can migrate with apply all', () => {
        migration.createMigration(config, '2.0.0', '1.11.0')

        cy.getCy('km-editor_migration').should('exist')
        cy.getCy('km-migration_apply-all-button').click()

        migration.finishMigrationAndPublish(2, 1, 0)
        migration.verifyPackageWithBundle(
            config.getChildPackageId('2.1.0'),
            config.getChildKM('2.1.0-applyall'),
            {
                'previous_package_id': config.getChildPackageId('2.0.0'),
                'fork_of_package_id': config.getParentPackageId('1.11.0')
            },
            false
        )
    })
})
