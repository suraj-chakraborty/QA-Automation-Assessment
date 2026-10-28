@api @streaks
Feature: Analytical Streaks API Endpoint Automation
  As an API consumer and SDET
  I want to verify the analytical batting streaks endpoint (/api/streaks and /api/streaks/batting-30)
  So that consistent 30+ runs batting performance sequences are accurately identified matching SQL B4-S2 window logic

  Background:
    Given the API server is operational

  # ---------------------------------------------------------------------------
  # Deterministic 30+ Runs Batting Streak Calculation
  # ---------------------------------------------------------------------------
  @happy @deterministic
  Scenario: Default streak calculation returns qualifying players with 30+ runs across 3+ consecutive matches
    When I send a GET request to "/api/streaks"
    Then the response status code should be 200
    And the response header "Content-Type" should contain "application/json"
    And the response body should match the streak list schema
    And all returned streaks should have streak_length greater than or equal to 3
    And all returned streaks should have all match runs greater than or equal to 30

  @happy @alias
  Scenario: Route alias /api/streaks/batting-30 returns identical streak calculation
    When I send a GET request to "/api/streaks/batting-30"
    Then the response status code should be 200
    And the response body should match the streak list schema
    And all returned streaks should have streak_length greater than or equal to 3
    And all returned streaks should have all match runs greater than or equal to 30

  # ---------------------------------------------------------------------------
  # Persona Validation (Aarav, Liam, Ethan, Rohan)
  # ---------------------------------------------------------------------------
  @happy @personas
  Scenario: Validate deterministic streak personas Aarav, Liam, Ethan, and Rohan
    When I send a GET request to "/api/streaks"
    Then the response status code should be 200
    And the response body should match the streak list schema
    And the streak list should include persona "Aarav Varma" with streak length 3
    And the streak list should include persona "Liam Sterling" with streak length 5
    And the streak list should include persona "Rohan Chakraborty" with streak length 3
    And the streak list should include persona "Ethan Brooks" with streak length at least 9

  # ---------------------------------------------------------------------------
  # Season Filtering & Threshold Variations
  # ---------------------------------------------------------------------------
  @filter @happy
  Scenario: Filter streaks by 2024 season
    When I send a GET request to "/api/streaks?season=2024"
    Then the response status code should be 200
    And all returned streaks should have start date in year 2024

  @boundary @happy
  Scenario Outline: Verify boundary threshold combinations for min_matches and min_runs
    When I send a GET request to "/api/streaks?min_matches=<minMatches>&min_runs=<minRuns>"
    Then the response status code should be 200
    And the response body should match the streak list schema
    And all returned streaks should have streak_length greater than or equal to <minMatches>
    And all returned streaks should have all match runs greater than or equal to <minRuns>

    Examples:
      | minMatches | minRuns |
      | 1          | 0       |
      | 2          | 25      |
      | 3          | 30      |
      | 4          | 40      |

  # ---------------------------------------------------------------------------
  # Negative & Validation Tests
  # ---------------------------------------------------------------------------
  @negative @validation
  Scenario Outline: Reject out-of-range streak query parameters with 400 Bad Request
    When I send a GET request to "<endpoint>"
    Then the response status code should be 400
    And the response error code should be "VALIDATION_ERROR"

    Examples:
      | endpoint                       |
      | /api/streaks?min_matches=0     |
      | /api/streaks?min_matches=21    |
      | /api/streaks?min_matches=abc   |
      | /api/streaks?min_runs=-1       |
      | /api/streaks?min_runs=301      |
      | /api/streaks?season=200        |
      | /api/streaks?season=1999       |
      | /api/streaks?season=2200       |
      | /api/streaks?invalid_flag=true |

  @negative @method
  Scenario: Write verbs on streaks endpoint return 405 Method Not Allowed
    When I send an unsupported POST request to "/api/streaks" with body "{}"
    Then the response status code should be 405
    And the response header "Allow" should contain "GET, HEAD"
    And the response error code should be "METHOD_NOT_ALLOWED"
