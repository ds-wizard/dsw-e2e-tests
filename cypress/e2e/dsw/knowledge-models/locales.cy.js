import { importLocaleAndUseItInProject } from '../../shared/knowledge-models/knowledgeModelsLocales'

// Data Steward imports the locale, Researcher uses it - each logs in inside the shared
// core, since the test switches persona halfway through.
describe('Knowledge Models / locales', () => {
  it('imports a locale and answers a project in its language', () => {
    importLocaleAndUseItInProject()
  })
})
