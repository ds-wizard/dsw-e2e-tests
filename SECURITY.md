# Security Policy

Although this E2E Tests Suite is intended only for testing of DSW release candidates (based on [test policy](https://guide.ds-wizard.org/miscellaneous/development/contributing#test-policy)), it may be executed using GitHub Actions and Cypress.io (cloud services). Therefore, secrets may potentially leak and must be protected:

* Credentials to Docker Hub
* Credentials to private Docker Registry
* GitHub token
* Cypress record key

## Supported Versions

There is currently no versioning for this repository. Always use the latest version in the desired branch.

## Reporting a Vulnerability

In case you find a vulnerability, please report it via [issue](https://github.com/ds-wizard/ds-wizard/issues/new/choose) or email as 
soon as possible.

You can directly propose a solution using a Pull Request (see [CONTRIBUTING](CONTRIBUTING.md) file).

More information on vulnerability reporting, known and solved vulnerabilities 
is also available in our [User Guide](https://guide.ds-wizard.org/miscellaneous/self-hosted-dsw/upgrade-guidelines).
