@ui @self-heal-demo
Feature: AI Self-Healing Demo - Intentionally Broken Locators
  As a QA Automation Engineer
  I want to demonstrate intentional locator failures with brittle strategies
  So that the AI self-healing pipeline can capture failure artifacts, diagnose root causes, and propose resilient repairs

  Scenario: SH-01 Positional CSS locator failure
    Given I am on the EMI calculator home page for self-healing
    When I attempt to interact using a brittle positional CSS selector

  Scenario: SH-02 Stale auto-generated ID locator failure
    Given I am on the EMI calculator home page for self-healing
    When I attempt to interact using a stale dynamic ID selector

  Scenario: SH-03 Absolute indexed XPath locator failure
    Given I am on the EMI calculator home page for self-healing
    When I attempt to interact using an absolute indexed XPath selector

  Scenario: SH-04 Incorrect accessible name role locator failure
    Given I am on the EMI calculator home page for self-healing
    When I attempt to interact using an invalid accessible name role selector

  Scenario: SH-05 Non-existent data-testid locator failure
    Given I am on the EMI calculator home page for self-healing
    When I attempt to interact using a missing data-testid selector
