@api @matches
Feature: Matches API Endpoint Automation
  As an API consumer and SDET
  I want to verify the /api/matches endpoint for date filtering, team filtering, sorting, pagination, and date semantic validation
  So that cricket match schedules and results are accurately retrievable

  Background:
    Given the API server is operational

  # ---------------------------------------------------------------------------
  # Happy Path Listing & Detail
  # ---------------------------------------------------------------------------
  @happy
  Scenario: Retrieve matches list with default pagination
    When I send a GET request to "/api/matches"
    Then the response status code should be 200
    And the response header "Content-Type" should contain "application/json"
    And the response body should match the matches list schema
    And the response data array should contain at least 10 items

  @happy
  Scenario: Retrieve single match details by ID
    When I send a GET request to "/api/matches/1"
    Then the response status code should be 200
    And the response body should match the match entity schema
    And the match ID should be 1

  # ---------------------------------------------------------------------------
  # Filtering: Team, Venue, Date Range
  # ---------------------------------------------------------------------------
  @filter @happy
  Scenario Outline: Filter matches involving specific team
    When I send a GET request to "/api/matches?team=<team>"
    Then the response status code should be 200
    And all returned matches should involve team "<team>"

    Examples:
      | team |
      | CSK  |
      | MI   |
      | RCB  |
      | KKR  |

  @filter @happy
  Scenario: Filter matches by venue substring
    When I send a GET request to "/api/matches?venue=Wankhede"
    Then the response status code should be 200
    And all returned matches should have venue containing "Wankhede" ignoring case

  @filter @happy
  Scenario: Filter matches by valid ISO date range
    When I send a GET request to "/api/matches?date_from=2024-04-01&date_to=2024-04-30"
    Then the response status code should be 200
    And all returned matches should have dates between "2024-04-01" and "2024-04-30"

  # ---------------------------------------------------------------------------
  # Sorting & Pagination
  # ---------------------------------------------------------------------------
  @sort @happy
  Scenario Outline: Verify match sorting by date and match number
    When I send a GET request to "/api/matches?sort_by=<sortBy>&order=<order>"
    Then the response status code should be 200
    And the returned matches should be sorted by "<sortBy>" in "<order>" order

    Examples:
      | sortBy   | order |
      | date     | asc   |
      | date     | desc  |
      | match_no | asc   |

  @pagination @happy
  Scenario: Pagination controls for matches endpoint
    When I send a GET request to "/api/matches?page=1&limit=5"
    Then the response status code should be 200
    And the response pagination meta should have page 1 and limit 5
    When I send a GET request to "/api/matches?page=2&limit=5"
    Then the response status code should be 200
    And the matches on page 1 and page 2 should have no overlapping IDs

  # ---------------------------------------------------------------------------
  # Negative & Validation Tests
  # ---------------------------------------------------------------------------
  @negative @semantic
  Scenario: Inverted date range returns 422 Unprocessable Entity
    When I send a GET request to "/api/matches?date_from=2024-05-15&date_to=2024-05-01"
    Then the response status code should be 422
    And the response error code should be "UNPROCESSABLE_ENTITY"
    And the response error message should contain "date_from cannot be after date_to"

  @negative @validation
  Scenario Outline: Invalid date format and unrecognized query parameters return 400
    When I send a GET request to "<endpoint>"
    Then the response status code should be 400
    And the response error code should be "VALIDATION_ERROR"

    Examples:
      | endpoint                          |
      | /api/matches?date_from=2024-13-40 |
      | /api/matches?date_from=invalid-date |
      | /api/matches?startDate=2024-04-01 |
      | /api/matches?endDate=2024-04-30   |
      | /api/matches?sort_by=invalid_field |
      | /api/matches?unrecognized_key=xyz |

  @negative @method
  Scenario: Read-only matches resource rejects write verbs with 405 Method Not Allowed
    When I send an unsupported DELETE request to "/api/matches/1"
    Then the response status code should be 405
    And the response header "Allow" should contain "GET, HEAD"
    And the response error code should be "METHOD_NOT_ALLOWED"

  @negative @boundary
  Scenario: Non-existent match ID returns 404 Not Found
    When I send a GET request to "/api/matches/999999"
    Then the response status code should be 404
    And the response error code should be "RESOURCE_NOT_FOUND"
