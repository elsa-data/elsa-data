# E2E Testing

The application as a whole can be end to end tested using Playwright.

## CI

There is a Github action that will run Playwright tests against
a locally deployed instance.

Playwright itself runs the web server backend - see
the Playwright config `webServer` section for details.

## Deployed

TBD - make a setup for Playwright that can execute against a real
deployed instance such as https://elsa.dev.umccr.org.

We would hope to be able to share most of the tests with the CI
execution.
