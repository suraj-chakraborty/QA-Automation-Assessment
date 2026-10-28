@api @performances
Feature: Performances API Endpoint Automation
  As an API consumer and SDET
  I want to verify the /api/performances and /api/players/:id/performances endpoints
  So that player per-match batting and bowling statistics are accurately accessible

  Background:
    Given the API server is operational

  # ---------------------------------------------------------------------------
  # Global Performances Listing & Detail
  # ---------------------------------------------------------------------------
  @happy
  Scenario: Retrieve global performances list with default pagination
    When I send a GET request to "/api/performances"
    Then the response status code should be 200
    And the response header "Content-Type" should contain "application/json"
    And the response body should match the performances list schema
    And the response data array should contain at least 10 items

  @happy
  Scenario: Retrieve single performance by ID
    When I send a GET request to "/api/performances/1"
    Then the response status code should be 200
    And the response body should match the performance entity schema
    And the performance ID should be 1

  # ---------------------------------------------------------------------------
  # Filtering by Player, Match, Min Runs
  # ---------------------------------------------------------------------------
  @filter @happy
  Scenario: Filter performances by player ID
    When I send a GET request to "/api/performances?player_id=1"
    Then the response status code should be 200
    And all returned performances should have player_id 1

  @filter @happy
  Scenario: Filter performances by match ID
    When I send a GET request to "/api/performances?match_id=1"
    Then the response status code should be 200
    And all returned performances should have match_id 1

  @filter @happy
  Scenario Outline: Filter performances by minimum runs scored
    When I send a GET request to "/api/performances?min_runs=<minRuns>"
    Then the response status code should be 200
    And all returned performances should have runs greater than or equal to <minRuns>

    Examples:
      | minRuns |
      | 30      |
      | 50      |
      | 75      |

  # ---------------------------------------------------------------------------
  # Nested Resource: /api/players/:id/performances
  # ---------------------------------------------------------------------------
  @nested @happy
  Scenario: Retrieve nested performances for specific player
    When I send a GET request to "/api/players/1/performances"
    Then the response status code should be 200
    And the response body should match the performances list schema
    And all returned performances should have player_id 1

  @nested @filter @happy
  Scenario: Filter nested player performances by min_runs and sort by runs descending
    When I send a GET request to "/api/players/1/performances?min_runs=30&sort_by=runs&order=desc"
    Then the response status code should be 200
    And all returned performances should have player_id 1
    And all returned performances should have runs greater than or equal to 30
    And the returned performances should be sorted by "runs" in "desc" order

  # ---------------------------------------------------------------------------
  # Negative & Validation Tests
  # ---------------------------------------------------------------------------
  @negative @validation
  Scenario Outline: Rejection of invalid and unrecognized performance query parameters
    When I send a GET request to "<endpoint>"
    Then the response status code should be 400
    And the response error code should be "VALIDATION_ERROR"

    Examples:
      | endpoint                             |
      | /api/performances?min_runs=-1        |
      | /api/performances?min_runs=301       |
      | /api/performances?min_runs=abc       |
      | /api/performances?playerId=1         |
      | /api/performances?matchId=1          |
      | /api/performances?isCaptain=true     |
      | /api/performances?isWicketKeeper=true|

  @negative @boundary
  Scenario: Non-existent performance ID and nested player ID return 404
    When I send a GET request to "/api/performances/999999"
    Then the response status code should be 404
    And the response error code should be "RESOURCE_NOT_FOUND"
    When I send a GET request to "/api/players/999999/performances"
    Then the response status code should be 404
    And the response error code should be "RESOURCE_NOT_FOUND"

  @negative @method
  Scenario: Write verbs on performances endpoint return 405 Method Not Allowed
    When I send an unsupported POST request to "/api/performances" with body "{}"
    Then the response status code should be 405
    And the response header "Allow" should contain "GET, HEAD"
    And the response error code should be "METHOD_NOT_ALLOWED"
