# Contributing

When contributing to this repository, please first discuss the change you wish to make via issue, email, or any other
method with the owners of this repository before making a change.

## Development and Code Style

- Follow [Cypress Best Practices](https://docs.cypress.io/guides/references/best-practices)

## Pull Request Process

1. Ensure any unnecessary install or build dependencies and other generated files are removed (adjust `.gitignore` if necessary).
2. Explain the changes and update in the Pull Request message.
3. Be ready to communicate about the Pull Request and make changes if required by reviewers.
4. The Pull Request may be merged once it passes the review and automatic checks.

## Gitflow Workflow

We use the standard [Gitflow Workflow](https://www.atlassian.com/git/tutorials/comparing-workflows/gitflow-workflow):

* __develop__ branch is used for development and as a base for following development branches of features, support
  stuff, and as a base for releases
* __feature/*__ (base develop, rebase-merged back to develop when done) - new tests for existing or new feature
* __chore/*__ (like the feature but semantically different, not the feature but some chore, e.g., cleanup or update)
* __fix/*__ (like the feature but semantically different, not something new but fix of a non-critical bug) - fixing a bug in tests

Please note, that for tasks from [our Jira](https://ds-wizard.atlassian.net/projects/DSW/issues), we use such
as `[DSW-XXX]` identifying the project and task number.
