import * as project from '../../../../support/project-helpers'

describe('Questionnaires Typehints', () => {
    const projectName = 'Typehints Test Questionnaire'
    const kmId = 'test-integrations'
    const packageId = 'dsw:test-integrations:1.0.0'
    const errorMessage = 'Unable to get type hints'
    const baseURI = 'http://mockserver:8083'
    const commonTypehints = [
        { "id": "standard01", "name": "Adverse Drug Reaction Markup Language" },
        { "id": "standard02", "name": "Analytical Information Markup Language" },
        { "id": "standard03", "name": "Gramene Taxonomy Ontology" },
        { "id": "standard04", "name": "Minimal Information About a Cellular Assay" }
    ]

    before(() => {
        cy.task('mongo:delete', {
            collection: 'packages',
            args: { kmId }
        })
        cy.clearServerCache()

        cy.fixture(kmId).then((km) => {
            cy.importKM(km)
        })
    })


    beforeEach(() => {
        cy.task('mongo:delete', {
            collection: 'questionnaires',
            args: {}
        })
        cy.clearServerCache()

        cy.loginAs('researcher')
        
        cy.createQuestionnaire({
            visibility: project.Private,
            sharing: project.Restricted,
            name: projectName,
            packageId
        })
        project.open(projectName)
    })


    const workingSpecs = [ {
        chapter: 'Basic',
        question: 'Basic items',
        slug: 'basic1',
        typehints: commonTypehints
    }, {
        chapter: 'Basic',
        question: 'Basic renamed',
        slug: 'basic2',
        typehints: commonTypehints
    }, {
        chapter: 'Nested',
        question: 'Nested results',
        slug: 'nested1',
        typehints: commonTypehints
    }, {
        chapter: 'Nested',
        question: 'Nested fields',
        slug: 'nested2',
        typehints: commonTypehints
    }, {
        chapter: 'Complex',
        question: 'Numeric IDs',
        slug: 'variableUsingProps',
        typehints: [
            { "id": "1", "name": "Adverse Drug Reaction Markup Language" },
            { "id": "2", "name": "Analytical Information Markup Language" },
            { "id": "3", "name": "Gramene Taxonomy Ontology" },
            { "id": "4", "name": "Minimal Information About a Cellular Assay" }
        ]
    }, {
        chapter: 'Complex',
        question: 'Numeric names',
        slug: 'variableUsingProps',
        typehints: [
            { "id": "standard01", "name": "5" },
            { "id": "standard02", "name": "5.25" },
            { "id": "standard03", "name": "7.00001" },
            { "id": "standard04", "name": "-12.3" }
        ]
    }, {
        chapter: 'Complex',
        question: 'Inconsistent IDs',
        slug: 'variableUsingProps',
        typehints: [
            { "id": "1", "name": "Adverse Drug Reaction Markup Language" },
            { "id": "2.3", "name": "Analytical Information Markup Language" },
            { "id": "False", "name": "Gramene Taxonomy Ontology" },
            { "id": "standard4", "name": "Minimal Information About a Cellular Assay" }
        ]
    }, {
        chapter: 'Complex',
        question: 'Inconsistent names',
        slug: 'variableUsingProps',
        typehints: [
            { "id": "standard01", "name": "Adverse Drug Reaction Markup Language" },
            { "id": "standard02", "name": "null" },
            { "id": "standard03", "name": "7" },
            { "id": "standard04", "name": "True" }
        ]
    }, {
        chapter: 'Complex',
        question: 'Duplicate ID',
        slug: 'variableUsingProps',
        typehints: [
            { "id": "standard01", "name": "Adverse Drug Reaction Markup Language" },
            { "id": "standard03", "name": "Analytical Information Markup Language" },
            { "id": "standard03", "name": "Gramene Taxonomy Ontology" },
            { "id": "standard04", "name": "Minimal Information About a Cellular Assay" }
        ]
    }, {
        chapter: 'Complex',
        question: 'Duplicate name',
        slug: 'variableUsingProps',
        typehints: [
            { "id": "standard01", "name": "Adverse Drug Reaction Markup Language" },
            { "id": "standard02", "name": "Gramene Taxonomy Ontology" },
            { "id": "standard03", "name": "Gramene Taxonomy Ontology" },
            { "id": "standard04", "name": "Minimal Information About a Cellular Assay" }
        ]
    }, {
        chapter: 'Configured',
        question: 'Config variables',
        slug: 'verySecret',
        typehints: [
            { "id": "secret01", "name": "First secret item" },
            { "id": "secret02", "name": "Second and even more secret item" }
        ]
    }]

    workingSpecs.forEach((spec) => {
        it(spec.question, () => {
            project.openChapter(spec.chapter)
            spec.typehints.forEach((typehint, index) => {
                project.useNthTypehint(spec.question, index, typehint)
                project.checkAnswer(spec.question, typehint.name)
                project.checkTypehintExtra(spec.question, `${baseURI}/${spec.slug}/${typehint.id}`)
            })
        })
    })


    const errorSpecs = [{
        chapter: 'Complex',
        question: 'Missing ID'
    }, {
        chapter: 'Complex',
        question: 'Missing name'
    }, {
        chapter: 'Complex',
        question: 'Null item'
    }, {
        chapter: 'Broken',
        question: 'Not found endpoint'
    }, {
        chapter: 'Broken',
        question: 'Missing config'
    }, {
        chapter: 'Broken',
        question: 'Null response'
    }, {
        chapter: 'HTTP',
        question: 'Not Found response (404)'
    }, {
        chapter: 'HTTP',
        question: 'Forbidden response (403)'
    }, {
        chapter: 'HTTP',
        question: 'Internal Server Error (500)'
    }]
    errorSpecs.forEach((spec) => {
        it(spec.question, () => {
            project.openChapter(spec.chapter)
            project.expectTypehintsError(spec.question, errorMessage)
        })
    })


    const searchSpecs = [{
        name: 'empty - all',
        query: '',
        typehints: commonTypehints
    }, {
        name: 'some',
        query: 'language',
        typehints: [commonTypehints[0], commonTypehints[1]]
    }, {
        name: 'one',
        query: 'Ontology',
        typehints: [commonTypehints[2]]
    }, {
        name: 'none',
        query: 'something',
        typehints: []
    }]

    searchSpecs.forEach((spec) => {
        it(`Search query (${spec.name})`, () => {
            const chapter = 'Searchable'
            const question = 'Simulate search'
    
            project.openChapter(chapter)
            project.expectTypehints(question, spec.typehints, spec.query)
        })
    })


    const httpSpecs = [{
        question: 'POST empty',
        query: ''
    }, {
        question: 'POST with body',
        query: ''
    }, {
        question: 'POST with body (configured)',
        query: 'myQuery'
    }, {
        question: 'GET with headers',
        query: 'myQuery'
    }, {
        question: 'Redirect (302)',
        query: ''
    }]
    
    httpSpecs.forEach((spec) => {
        it(spec.question, () => {
            project.openChapter('HTTP')
            project.expectTypehints(spec.question, commonTypehints, spec.query)
        })
    })


    it('Many items', () => {
        const chapter = 'Complex'
        const question = 'Many items'
        const slug = 'variableUsingProps'
        const indices = [0, 42, 123, 348, 666, 999] // size 1000

        project.openChapter(chapter)
        indices.forEach((index) => {
            const typehint = { id: `item-${index}`, name: `Item #${index}` }
            project.useNthTypehint(question, index, typehint)
            project.checkAnswer(question, typehint.name)
            project.checkTypehintExtra(question, `${baseURI}/${slug}/${typehint.id}`)
        })
    })


    it('Integration logo', () => {
        const chapter = 'Configured'
        const question = 'With logo'
        const slug = 'basic1'
    
        project.openChapter(chapter)
        commonTypehints.forEach((typehint, index) => {
            project.useNthTypehint(question, index, typehint)
            project.checkTypehintExtra(question, `${baseURI}/${slug}/${typehint.id}`, true)
        })
    })
})
