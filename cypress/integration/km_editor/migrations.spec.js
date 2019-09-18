import * as migration from '../../support/km-migrations-helpers'

describe('KM Editor Migrations', () => {
    before(() => {
        cy.task('mongo:delete', {
            collection: 'packages',
            args: { kmId: migration.parentKmId }
        })
        cy.task('mongo:delete', {
            collection: 'branches',
            args: { kmId: migration.parentKmId }
        })
        cy.task('mongo:updateOne', {
            collection: 'organizations',
            query: {},
            update: {
                $set: {
                    name: 'DSW Global',
                    organizationId: 'dsw'
                }
            }
        })

        // import parent-km with latest (inc. all lower version)
        cy.fixture(migration.getParentKM('1.11.0')).then((km) => {
            cy.importKM(km)
        })
    })

    beforeEach(() => {
        cy.task('mongo:delete', {
            collection: 'packages',
            args: { kmId: migration.childKmId }
        })
        cy.task('mongo:delete', {
            collection: 'branches',
            args: { kmId: migration.childKmId }
        })

        cy.loginAs('datasteward')
    })

    // BASIC
    it('contains upgrade option', () => {
        migration.prepareChildKmEditor('1.0.0')

        cy.getListingItem(migration.childKmId).should('contain', migration.editorName).and('contain', migration.getParentPackageId('1.0.0'))
        cy.clickListingItemAction(migration.editorName, 'Upgrade')
        cy.clickBtn('Cancel')
    })

    it('can pause, resume, and cancel migration', () => {
        migration.createMigration('1.0.0', '1.10.0')

        cy.contains('Add chapter')
        cy.clickBtn('Apply')

        cy.visitApp('/km-editor')
        cy.clickListingItemAction(migration.editorName, 'Continue Migration')
        cy.contains('Add question')
        cy.clickBtn('Reject')

        cy.visitApp('/km-editor')
        cy.clickListingItemAction(migration.editorName, 'Cancel Migration')
        cy.getListingItem(migration.childKmId).should('contain', migration.editorName).and('contain', 'Upgrade')
    })

    // CHAPTER
    it('can migrate with applying "add chapter"', () => {
        migration.createMigration('1.0.0', '1.1.0')

        cy.contains('Add chapter')
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
        cy.clickBtn('Apply')

        cy.contains('Question 2.1')
        cy.clickBtn('Apply') // some question (no assertions now)
        cy.contains('Question 2.2')
        cy.clickBtn('Apply') // some question (no assertions now)

        migration.finishMigrationAndPublish(1, 1, 0)
        migration.verifyChildPackageForMigration('1.1.0', '1.0.0')
    })

    it('can migrate with applying "edit chapter"', () => {
        migration.createMigration('1.1.0', '1.1.1')

        cy.contains('Edit chapter')
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
        cy.clickBtn('Apply')

        cy.contains('**New** chapter text')
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
        cy.clickBtn('Apply')

        migration.finishMigrationAndPublish(1, 1, 1)
        migration.verifyChildPackageForMigration('1.1.1', '1.1.0')
    })

    it('can migrate with applying "delete chapter"', () => {
        migration.createMigration('1.1.1', '1.1.2')

        cy.contains('Delete chapter')
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
        cy.clickBtn('Apply')

        migration.finishMigrationAndPublish(1, 1, 2)
        migration.verifyChildPackageForMigration('1.1.2', '1.1.1')
    })

    // EXPERT
    it('can migrate with applying "add expert"', () => {
        migration.createMigration('1.1.2', '1.2.0')

        cy.contains('Add expert')
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
        cy.clickBtn('Apply')

        migration.finishMigrationAndPublish(1, 2, 0)
        migration.verifyChildPackageForMigration('1.2.0', '1.1.2')
    })

    it('can migrate with applying "edit expert"', () => {
        migration.createMigration('1.2.0', '1.2.1')

        cy.contains('Edit expert')
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
        cy.clickBtn('Apply')

        migration.finishMigrationAndPublish(1, 2, 1)
        migration.verifyChildPackageForMigration('1.2.1', '1.2.0')
    })

    it('can migrate with applying "delete expert"', () => {
        migration.createMigration('1.2.1', '1.2.2')

        cy.contains('Delete expert')
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
        cy.clickBtn('Apply')

        migration.finishMigrationAndPublish(1, 2, 2)
        migration.verifyChildPackageForMigration('1.2.2', '1.2.1')
    })

    // REFERENCE
    it('can migrate with applying "add reference"', () => {
        migration.createMigration('1.2.2', '1.3.0')

        cy.contains('atq') // Add reference (book)
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
        cy.clickBtn('Apply')

        cy.contains('http://example.com') // Add reference (URL)
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
        cy.clickBtn('Apply')

        cy.contains('4ae6a08a-c94e-4a0f-8391-24765ad8fdb4') // Add reference (cross reference)
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
        cy.clickBtn('Apply')

        migration.finishMigrationAndPublish(1, 3, 0)
        migration.verifyChildPackageForMigration('1.3.0', '1.2.2')
    })

    it('can migrate with applying "edit reference"', () => {
        migration.createMigration('1.3.0', '1.3.1')

        cy.contains('atq') // Edit reference (book)
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
        cy.clickBtn('Apply')

        cy.contains('http://example.com') // Edit reference (URL)
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
        cy.clickBtn('Apply')

        cy.contains('4ae6a08a-c94e-4a0f-8391-24765ad8fdb4') // Edit reference (cross reference)
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
        cy.clickBtn('Apply')

        cy.contains('Type') // Change order of references
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
        cy.clickBtn('Apply')

        migration.finishMigrationAndPublish(1, 3, 1)
        migration.verifyChildPackageForMigration('1.3.1', '1.3.0')
    })

    it('can migrate with applying "delete reference"', () => {
        migration.createMigration('1.3.1', '1.3.2')

        cy.contains('http://google.com') // Delete reference (URL)
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
        cy.clickBtn('Apply')

        cy.contains('4ae6a08a-c94e-4a0f-8391-24765ad8fdb4') // Delete reference (cross reference)
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
        cy.clickBtn('Apply')

        cy.contains('xyz') // Delete reference (book)
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
        cy.clickBtn('Apply')

        migration.finishMigrationAndPublish(1, 3, 2)
        migration.verifyChildPackageForMigration('1.3.2', '1.3.1')
    })

    // TAG
    it('can migrate with applying "add tag"', () => {
        migration.createMigration('1.3.2', '1.4.0')

        cy.contains('Tag 1')
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
        cy.clickBtn('Apply')

        cy.contains('Tag 2')
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
        cy.clickBtn('Apply')

        migration.finishMigrationAndPublish(1, 4, 0)
        migration.verifyChildPackageForMigration('1.4.0', '1.3.2')
    })

    it('can migrate with applying "edit tag"', () => {
        migration.createMigration('1.4.0', '1.4.1')

        cy.contains('Tag 2')
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
        cy.clickBtn('Apply')

        cy.contains('Tag 01')
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
        cy.clickBtn('Apply')

        cy.contains('Edit question')
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
        cy.clickBtn('Apply')

        migration.finishMigrationAndPublish(1, 4, 1)
        migration.verifyChildPackageForMigration('1.4.1', '1.4.0')
    })

    it('can migrate with applying "delete tag"', () => {
        migration.createMigration('1.4.1', '1.4.2')

        cy.contains('Tag 01')
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
        cy.clickBtn('Apply')

        cy.contains('Tag 2')
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
        cy.clickBtn('Apply')

        migration.finishMigrationAndPublish(1, 4, 2)
        migration.verifyChildPackageForMigration('1.4.2', '1.4.1')
    })

    // INTEGRATION
    it('can migrate with applying "add integration"', () => {
        migration.createMigration('1.4.2', '1.5.0')

        cy.contains('Add integration')
        migration.checkMigrationForm([
            {
                'label': 'Id', 'validate': (x) => {
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
                'label': 'Request Method', 'validate': (x) => {
                    x.get('ins').contains('GET')
                }
            },
            {
                'label': 'Request URL', 'validate': (x) => {
                    x.get('ins').contains('/')
                }
            },
            {
                'label': 'Request Headers', 'validate': (x) => {
                    x.get('ins').contains('Accept: application-json')
                }
            },
            {
                'label': 'Request Body', 'validate': (x) => {
                    x.get('ins').contains('{ "q": "${q}" }')
                }
            },
            {
                'label': 'Response List Field', 'validate': (x) => {
                    x.get('ins').contains('items')
                }
            },
            {
                'label': 'Response Id Field', 'validate': (x) => {
                    x.get('ins').contains('id')
                }
            },
            {
                'label': 'Response Name Field', 'validate': (x) => {
                    x.get('ins').contains('name')
                }
            }
        ])
        migration.checkDiffTreeAdded(['My Test Integration'])
        cy.clickBtn('Apply')

        migration.finishMigrationAndPublish(1, 5, 0)
        migration.verifyChildPackageForMigration('1.5.0', '1.4.2')
    })

    it('can migrate with applying "edit integration"', () => {
        migration.createMigration('1.5.0', '1.5.1')

        cy.contains('Edit integration')
        migration.checkMigrationForm([
            {
                'label': 'Id', 'validate': (x) => {
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
                'label': 'Request Method', 'validate': (x) => {
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
                'label': 'Request Headers', 'validate': (x) => {
                    x.get('del').contains('Accept: application-json')
                    x.get('ins').contains('Accept: application-json, Authorization: token ${token}')
                }
            },
            {
                'label': 'Request Body', 'validate': (x) => {
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
                'label': 'Response Id Field', 'validate': (x) => {
                    x.get('del').contains('id')
                    x.get('ins').contains('doi')
                }
            },
            {
                'label': 'Response Name Field', 'validate': (x) => {
                    x.get('del').contains('name')
                    x.get('ins').contains('title')
                }
            }
        ])
        migration.checkDiffTreeEdited(['Test Integration'])
        cy.clickBtn('Apply')

        migration.finishMigrationAndPublish(1, 5, 1)
        migration.verifyChildPackageForMigration('1.5.1', '1.5.0')
    })

    it('can migrate with applying "delete integration"', () => {
        migration.createMigration('1.5.1', '1.5.2')

        cy.contains('Delete integration')
        migration.checkMigrationForm([
            {
                'label': 'Id', 'validate': (x) => {
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
                'label': 'Request Method', 'validate': (x) => {
                    x.get('del').contains('DELETE')
                }
            },
            {
                'label': 'Request URL', 'validate': (x) => {
                    x.get('del').contains('/all')
                }
            },
            {
                'label': 'Request Headers', 'validate': (x) => {
                    x.get('del').contains('Accept: application-json, Authorization: token ${token}')
                }
            },
            {
                'label': 'Request Body', 'validate': (x) => {
                    x.get('del').contains('{ "q": "${q}", "yes": true }')
                }
            },
            {
                'label': 'Response List Field', 'validate': (x) => {
                    x.get('del').contains('fields')
                }
            },
            {
                'label': 'Response Id Field', 'validate': (x) => {
                    x.get('del').contains('doi')
                }
            },
            {
                'label': 'Response Name Field', 'validate': (x) => {
                    x.get('del').contains('title')
                }
            }
        ])
        migration.checkDiffTreeDeleted(['Test Integration'])
        cy.clickBtn('Apply')

        migration.finishMigrationAndPublish(1, 5, 2)
        migration.verifyChildPackageForMigration('1.5.2', '1.5.1')
    })

    // QUESTION
    it('can migrate with applying "add question"', () => {
        migration.createMigration('1.5.2', '1.6.0')

        cy.contains('Add question')
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
                'label': 'Text', 'validate': (x) => {}
            },
            {
                'label': 'Tags', 'validate': (x) => {
                    x.contains('-')
                }
            }
        ])
        migration.checkDiffTreeAdded(['Question 1.2'])
        cy.clickBtn('Apply')

        cy.contains('Question 1.3')
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
        cy.clickBtn('Apply')

        cy.contains('Question 1.4')
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
                'label': 'Text', 'validate': (x) => {}
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
        cy.clickBtn('Apply')

        cy.contains('Add integration')
        cy.clickBtn('Apply')

        cy.contains('Question 1.5')
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
                'label': 'Text', 'validate': (x) => {}
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
        cy.clickBtn('Apply')

        migration.finishMigrationAndPublish(1, 6, 0)
        migration.verifyChildPackageForMigration('1.6.0', '1.5.2')
    })

    it('can migrate with applying "edit question"', () => {
        migration.createMigration('1.6.0', '1.6.1')

        cy.contains('Edit question')
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
        cy.clickBtn('Apply')

        cy.contains('Question 1.3')
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
        cy.clickBtn('Apply')

        cy.contains('Question 1.4')
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
        cy.clickBtn('Apply')

        cy.contains('Question 1.5')
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
                'label': 'Integration', 'validate': (x) => {}
            },
            {
                'label': 'Props', 'validate': (x) => {}
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
        cy.clickBtn('Apply')

        cy.contains('Add integration')
        cy.clickBtn('Apply')

        cy.contains('Question 1.5')
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
                'label': 'Integration', 'validate': (x) => {}
            },
            {
                'label': 'Props', 'validate': (x) => {}
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
        cy.clickBtn('Apply')

        migration.finishMigrationAndPublish(1, 6, 1)
        migration.verifyChildPackageForMigration('1.6.1', '1.6.0')
    })

    it('can migrate with applying "edit question"', () => {
        migration.createMigration('1.6.1', '1.6.2')

        cy.contains('Delete integration')
        cy.clickBtn('Apply')

        cy.contains('Edit question')
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
        cy.clickBtn('Apply')

        cy.contains('Question 1.5 (value)')
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
        cy.clickBtn('Apply')

        cy.contains('Question 1.3 (list)')
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
        cy.clickBtn('Apply')

        cy.contains('Question 1.3 (options)')
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
        cy.clickBtn('Apply')

        cy.contains('Question 1.2 (value)')
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
        cy.clickBtn('Apply')

        cy.contains('Question 1.2 (integration)')
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
                'label': 'Integration', 'validate': (x) => {}
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
        cy.clickBtn('Apply')

        migration.finishMigrationAndPublish(1, 6, 2)
        migration.verifyChildPackageForMigration('1.6.2', '1.6.1')
    })

    it('can migrate with applying "delete question"', () => {
        migration.createMigration('1.6.2', '1.6.3')

        cy.contains('Delete integration')
        cy.clickBtn('Apply')

        cy.contains('Delete question')
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
        cy.clickBtn('Apply')

        cy.contains('Question 1.3 (options)')
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
        cy.clickBtn('Apply')

        cy.contains('Question 1.4 (items)')
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
        cy.clickBtn('Apply')

        cy.contains('Question 1.5 (value)')
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
        cy.clickBtn('Apply')

        migration.finishMigrationAndPublish(1, 6, 3)
        migration.verifyChildPackageForMigration('1.6.3', '1.6.2')
    })

    // ANSWER
    it('can migrate with applying "add answer"', () => {
        migration.createMigration('1.6.3', '1.7.0')

        cy.contains('Add answer')
        migration.checkMigrationForm([
            {
                'label': 'Label', 'validate': (x) => {
                    x.get('ins').contains('Answer 1.1c')
                }
            },
            {
                'label': 'Advice', 'validate': (x) => {}
            },
            {
                'label': 'Metrics', 'validate': (x) => {
                    x.contains('-')
                }
            }
        ])
        migration.checkDiffTreeAdded(['Answer 1.1c'])
        cy.clickBtn('Apply')

        cy.contains('Answer 1.1d')
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
        cy.clickBtn('Apply')

        migration.finishMigrationAndPublish(1, 7, 0)
        migration.verifyChildPackageForMigration('1.7.0', '1.6.3')
    })

    it('can migrate with applying "edit answer"', () => {
        migration.createMigration('1.7.0', '1.7.1')

        cy.contains('Edit question') // reorder
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
                'label': 'Text', 'validate': (x) => {}
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
        cy.clickBtn('Apply')

        cy.contains('Edit answer')
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
        cy.clickBtn('Apply')

        cy.contains('Edit answer')
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
        cy.clickBtn('Apply')

        migration.finishMigrationAndPublish(1, 7, 1)
        migration.verifyChildPackageForMigration('1.7.1', '1.7.0')
    })


    it('can migrate with applying "delete answer"', () => {
        migration.createMigration('1.7.1', '1.7.2')

        cy.contains('Delete answer')
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
        cy.clickBtn('Apply')

        cy.contains('Answer 1.1 two')
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
        cy.clickBtn('Apply')

        migration.finishMigrationAndPublish(1, 7, 2)
        migration.verifyChildPackageForMigration('1.7.2', '1.7.1')
    })

    // FOLLOW-UP QUESTION
    it('can migrate with applying "add follow-up question"', () => {
        migration.createMigration('1.7.2', '1.8.0')

        cy.contains('Add question')
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
                'label': 'Text', 'validate': (x) => {}
            },
            {
                'label': 'Tags', 'validate': (x) => {
                    x.contains('-')
                }
            }
        ])
        migration.checkDiffTreeAdded(['Followup options 1.1a.1'])
        cy.clickBtn('Apply')

        cy.contains('Followup value 1.1a.2')
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
                'label': 'Text', 'validate': (x) => {}
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
        cy.clickBtn('Apply')

        cy.contains('Followup list 1.1a.3')
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
                'label': 'Text', 'validate': (x) => {}
            },
            {
                'label': 'Tags', 'validate': (x) => {
                    x.contains('-')
                }
            }
        ])
        migration.checkDiffTreeAdded(['Followup list 1.1a.3'])
        cy.clickBtn('Apply')

        migration.finishMigrationAndPublish(1, 8, 0)
        migration.verifyChildPackageForMigration('1.8.0', '1.7.2')
    })

    it('can migrate with applying "edit follow-up question"', () => {
        migration.createMigration('1.8.0', '1.8.1')

        cy.contains('Edit answer')  // reorder followups
        migration.checkMigrationForm([
            {
                'label': 'Label', 'validate': (x) => {
                    x.contains('Answer 1.1a')
                }
            },
            {
                'label': 'Advice', 'validate': (x) => {}
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
        cy.clickBtn('Apply')

        cy.contains('Followup options 1.1a.1')
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
                'label': 'Text', 'validate': (x) => {}
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
        cy.clickBtn('Apply')

        cy.contains('Add reference')
        migration.checkDiffTreeAdded(['See also'])
        cy.clickBtn('Apply')

        cy.contains('Followup list 1.1a.3')
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
        cy.clickBtn('Apply')

        cy.contains('Add question')
        migration.checkDiffTreeAdded(['New question'])
        cy.clickBtn('Apply')

        cy.contains('Followup value 1.1a.2')
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
                'label': 'Text', 'validate': (x) => {}
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
        cy.clickBtn('Apply')

        cy.contains('Followup options 1.1a.1')
        migration.checkDiffTreeAdded(['Followup options 1.1a.1'])
        cy.clickBtn('Apply')

        cy.contains('Answer 1.1a')  // reorder followups
        migration.checkMigrationForm([
            {
                'label': 'Label', 'validate': (x) => {
                    x.contains('Answer 1.1a')
                }
            },
            {
                'label': 'Advice', 'validate': (x) => {}
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
        cy.clickBtn('Apply')

        migration.finishMigrationAndPublish(1, 8, 1)
        migration.verifyChildPackageForMigration('1.8.1', '1.8.0')
    })

    it('can migrate with applying "delete follow-up question"', () => {
        migration.createMigration('1.8.1', '1.8.2')

        cy.contains('Delete question')
        migration.checkDiffTreeDeleted(['Followup options 1.1a.1'])
        cy.clickBtn('Apply')

        cy.contains('Followup list 1.1a.3')
        migration.checkDiffTreeDeleted(['Followup list 1.1a.3'])
        cy.clickBtn('Apply')

        cy.contains('Followup value 1.1a.2')
        migration.checkDiffTreeDeleted(['Followup value 1.1a.2'])
        cy.clickBtn('Apply')

        cy.contains('Followup options 1.1a.4')
        migration.checkDiffTreeDeleted(['Followup options 1.1a.4'])
        cy.clickBtn('Apply')

        migration.finishMigrationAndPublish(1, 8, 2)
        migration.verifyChildPackageForMigration('1.8.2', '1.8.1')
    })

    // ITEM TEMPLATE QUESTION
    it('can migrate with applying "add item template question"', () => {
        migration.createMigration('1.8.2', '1.9.0')

        cy.contains('Add question')
        cy.clickBtn('Apply')

        cy.contains('Items options')
        cy.clickBtn('Apply')

        cy.contains('New answer')
        cy.clickBtn('Apply')

        cy.contains('Items list')
        cy.clickBtn('Apply')

        cy.contains('Items value')
        cy.clickBtn('Apply')

        cy.contains('Dummy integration')
        cy.clickBtn('Apply')

        cy.contains('Items integration')
        cy.clickBtn('Apply')

        migration.finishMigrationAndPublish(1, 9, 0)
        migration.verifyChildPackageForMigration('1.9.0', '1.8.2')
    })

    it('can migrate with applying "edit item template question"', () => {
        migration.createMigration('1.9.0', '1.9.1')

        cy.contains('Add question')
        migration.checkDiffTreeAdded(['Some follow-up'])
        cy.clickBtn('Apply')

        cy.contains('Add answer')
        migration.checkDiffTreeAdded(['Yes'])
        cy.clickBtn('Apply')
        migration.checkDiffTreeAdded(['No'])
        cy.clickBtn('Apply')

        migration.checkDiffTreeAdded(['Another item template question'])
        cy.clickBtn('Apply')

        migration.checkDiffTreeEdited(['Items value'])
        cy.clickBtn('Apply')

        migration.checkDiffTreeEdited(['Items integration'])
        cy.clickBtn('Apply')

        migration.checkDiffTreeEdited(['Items list'])
        cy.clickBtn('Apply')

        cy.contains('Question 1.2') // reorder
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
        cy.clickBtn('Apply')

        migration.finishMigrationAndPublish(1, 9, 1)
        migration.verifyChildPackageForMigration('1.9.1', '1.9.0')
    })

    it('can migrate with applying "edit item template question"', () => {
        migration.createMigration('1.9.1', '1.9.2')

        migration.checkDiffTreeDeleted(['Some follow-up'])
        cy.clickBtn('Apply')

        migration.checkDiffTreeDeleted(['Another item template question'])
        cy.clickBtn('Apply')

        migration.finishMigrationAndPublish(1, 9, 2)
        migration.verifyChildPackageForMigration('1.9.2', '1.9.1')
    })

    it('can migrate with applying "edit item template question"', () => {
        migration.createMigration('1.9.2', '1.9.3')

        migration.checkDiffTreeDeleted(['Items list'])
        cy.clickBtn('Apply')

        migration.checkDiffTreeDeleted(['Items value'])
        cy.clickBtn('Apply')

        migration.checkDiffTreeDeleted(['Items options'])
        cy.clickBtn('Apply')

        migration.checkDiffTreeDeleted(['Items list'])
        cy.clickBtn('Apply')

        migration.finishMigrationAndPublish(1, 9, 3)
        migration.verifyChildPackageForMigration('1.9.3', '1.9.2')
    })

    // KNOWLEDGE MODEL
    it('can migrate with applying "edit knowledge model"', () => {
        migration.createMigration('1.9.3', '1.10.0')

        cy.contains('Edit knowledge model')
        migration.checkMigrationForm([
            {
                'label': 'Name', 'validate': (x) => {
                    x.get('del').contains('Parent KM')
                    x.get('ins').contains('Parenting KM')
                },
            },
            {
                'label': 'Chapters', 'validate': (x) => {
                    x.contains('li', 'Custom chapter')
                },
            },
            {
                'label': 'Tags', 'validate': (x) => {
                    x.contains('-')
                },
            },
            {
                'label': 'Name', 'validate': (x) => {
                    x.contains('Dummy integration')
                },
            }
        ])
        migration.checkDiffTreeEdited(['Parenting KM'])
        cy.clickBtn('Apply')

        cy.contains('Add chapter')
        migration.checkDiffTreeAdded(['Intro'])
        cy.clickBtn('Apply')

        migration.checkMigrationForm([
            {
                'label': 'Name', 'validate': (x) => {
                    x.contains('Parenting KM')
                },
            },
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
                'label': 'Tags', 'validate': (x) => {
                    x.contains('-')
                },
            },
            {
                'label': 'Name', 'validate': (x) => {
                    x.contains('Dummy integration')
                },
            }
        ])
        migration.checkDiffTreeEdited(['Parenting KM'])
        cy.clickBtn('Apply')

        cy.contains('Add integration')
        migration.checkDiffTreeAdded(['New Integration'])
        cy.clickBtn('Apply')

        migration.checkMigrationForm([
            {
                'label': 'Name', 'validate': (x) => {
                    x.contains('Parenting KM')
                },
            },
            {
                'label': 'Chapters', 'validate': (x) => {
                    x.contains('li', 'Custom chapter')
                },
            },
            {
                'label': 'Tags', 'validate': (x) => {
                    x.contains('-')
                },
            },
            {
                'label': 'Name', 'validate': (x) => {
                    x.get('ul.del > li').should('have.length', 2)
                    x.get('ul.del > li').eq(0).contains('Dummy integration')
                    x.get('ul.del > li').eq(1).contains('New Integration')
                    x.get('ul.ins > li').should('have.length', 2)
                    x.get('ul.ins > li').eq(0).contains('New Integration')
                    x.get('ul.ins > li').eq(1).contains('Dummy integration')
                },
            }
        ])
        migration.checkDiffTreeEdited(['Parenting KM'])
        cy.clickBtn('Apply')

        migration.finishMigrationAndPublish(1, 10, 0)
        migration.verifyChildPackageForMigration('1.10.0', '1.9.3')
    })

    // COMPLEX
    it('can migrate with apply and reject', () => {
        migration.createMigration('2.0.0', '1.11.0')

        cy.contains('Edit knowledge model')
        migration.checkMigrationForm([
            {
                'label': 'Name', 'validate': (x) => {
                    x.contains('Parenting KM')
                },
            },
            {
                'label': 'Chapters', 'validate': (x) => {
                    x.contains('li', 'Custom chapter')
                },
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
        migration.checkDiffTreeEdited(['Parenting KM'])
        cy.clickBtn('Apply')

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
                'label': 'Text', 'validate': (x) => {},
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
        cy.clickBtn('Apply')

        cy.contains('Add expert')
        migration.checkDiffTreeAdded(['Our Specialist 1'])
        cy.clickBtn('Apply')
        migration.checkDiffTreeAdded(['Our Specialist 0'])
        cy.clickBtn('Reject')

        cy.contains('Question 1.2')
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
        cy.clickBtn('Apply')

        cy.contains('Extra chapter')
        migration.checkDiffTreeAdded(['Extra chapter'])
        cy.clickBtn('Reject')

        cy.contains('Question 1.0')
        migration.checkDiffTreeAdded(['Question 1.0'])
        cy.clickBtn('Apply')

        cy.contains('Edit chapter')
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
        cy.clickBtn('Apply')

        cy.contains('Extraordinary question')
        migration.checkDiffTreeAdded(['Extraordinary question'])
        cy.clickBtn('Reject')

        cy.contains('Answer 1.1c')
        migration.checkDiffTreeAdded(['Answer 1.1c'])
        cy.clickBtn('Apply')

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
                'label': 'Text', 'validate': (x) => {},
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
        cy.clickBtn('Apply')

        cy.contains('nope')
        migration.checkDiffTreeAdded(['nope'])
        cy.clickBtn('Reject')

        cy.contains('Extra integration')
        migration.checkDiffTreeAdded(['Extra integration'])
        cy.clickBtn('Reject')

        // reorder with rejected integration (no reorder in the end)
        migration.checkDiffTreeEdited(['Parenting KM'])
        cy.clickBtn('Reject')

        migration.finishMigrationAndPublish(2, 1, 0)
        migration.verifyChildPackageForMigration('2.1.0', '1.11.0')
    })
})
