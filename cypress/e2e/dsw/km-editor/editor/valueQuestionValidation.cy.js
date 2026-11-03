import {
  minLengthValidation,
  maxLengthValidation,
  regexValidation,
  orcidValidation,
  doiValidation,
  minNumberValidation,
  maxNumberValidation,
  fromDateValidation,
  toDateValidation,
  fromDateTimeValidation,
  toDateTimeValidation,
  fromTimeValidation,
  toTimeValidation,
  domainValidation
} from '../../../shared/km-editor/editor/kmEditorValueQuestionValidation'

describe('KM Editor / value question validation', () => {
  beforeEach(() => {
    cy.loginAs('dataSteward')
  })

  it('enforces MinLength', () => {
    minLengthValidation()
  })

  it('enforces MaxLength', () => {
    maxLengthValidation()
  })

  it('enforces Regex', () => {
    regexValidation()
  })

  it('enforces Orcid', () => {
    orcidValidation()
  })

  it('enforces Doi', () => {
    doiValidation()
  })

  it('enforces MinNumber', () => {
    minNumberValidation()
  })

  it('enforces MaxNumber', () => {
    maxNumberValidation()
  })

  it('enforces FromDate', () => {
    fromDateValidation()
  })

  it('enforces ToDate', () => {
    toDateValidation()
  })

  it('enforces FromDateTime', () => {
    fromDateTimeValidation()
  })

  it('enforces ToDateTime', () => {
    toDateTimeValidation()
  })

  it('enforces FromTime', () => {
    fromTimeValidation()
  })

  it('enforces ToTime', () => {
    toTimeValidation()
  })

  it('enforces Domain', () => {
    domainValidation()
  })
})
