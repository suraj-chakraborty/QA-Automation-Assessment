@smoke @api
Feature: Framework Smoke Verification Gate
  As an automation SDET
  I want to verify that Cucumber BDD runner, CustomWorld, ApiClient, and the Express REST API are fully integrated
  So that the core test automation framework is proven before building higher-level test suites

  @smoke @health
  Scenario: API Health Check returns 200 OK
    When I send a GET request to "/health"
    Then the response status code should be 200
    And the response body should contain status "ok"
    And the response body should have a valid health check payload

  @smoke @players
  Scenario: API Players List returns paginated players
    When I send a GET request to "/api/players"
    Then the response status code should be 200
    And the response body should be a paginated list with valid schema
    And the response should contain a non-empty list of players

