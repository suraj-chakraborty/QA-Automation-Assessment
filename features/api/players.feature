@api @players
Feature: Players API Endpoint Automation
  As an API consumer and SDET
  I want to verify the /api/players endpoint for CRUD operations, filtering, sorting, pagination, and negative edge cases
  So that player data management meets the Streamhub API specification

  Background:
    Given the API server is operational

  # ---------------------------------------------------------------------------
  # CRUD Operations
  # ---------------------------------------------------------------------------
  @crud @happy
  Scenario: Full CRUD lifecycle for player entity
    # 1. CREATE (POST)
    When I send a POST request to "/api/players" with body:
      """
      {
        "name": "Arjun Test Player",
        "team": "RCB",
        "role": "all-rounder",
        "batting_style": "Right-hand bat",
        "bowling_style": "Right-arm medium",
        "isOverseas": false,
        "total_runs": 150,
        "total_wickets": 8,
        "matches_played": 6
      }
      """
    Then the response status code should be 201
    And the response header "Location" should be present
    And the response header "Content-Type" should contain "application/json"
    And the response body should match the player entity schema
    And the created player ID should be stored in scenario context

    # 2. READ (GET by ID)
    When I request the created player by ID
    Then the response status code should be 200
    And the response body should match the player entity schema
    And the player name should be "Arjun Test Player"

    # 3. UPDATE (PUT by ID)
    When I update the created player with body:
      """
      {
        "total_runs": 220,
        "matches_played": 8
      }
      """
    Then the response status code should be 200
    And the player total_runs should be 220
    And the player matches_played should be 8

    # 4. DELETE
    When I delete the created player
    Then the response status code should be 200

    # 5. VERIFY DELETION (GET returns 404)
    When I request the created player by ID
    Then the response status code should be 404
    And the response error code should be "RESOURCE_NOT_FOUND"

  # ---------------------------------------------------------------------------
  # Filtering & Searching
  # ---------------------------------------------------------------------------
  @filter @happy
  Scenario Outline: Filter players by team and role combinations
    When I send a GET request to "/api/players?team=<team>&role=<role>"
    Then the response status code should be 200
    And the response body should match the players list schema
    And all returned players should belong to team "<team>"
    And all returned players should have role "<role>"

    Examples:
      | team | role         |
      | CSK  | batter       |
      | MI   | bowler       |
      | RCB  | all-rounder  |
      | KKR  | wicketkeeper |

  @filter @happy
  Scenario: Substring search by player name
    When I send a GET request to "/api/players?q=ar"
    Then the response status code should be 200
    And the response body should match the players list schema
    And all returned players names should contain "ar" ignoring case

  @filter @happy
  Scenario: Filter players by minimum total runs threshold
    When I send a GET request to "/api/players?min_runs=300"
    Then the response status code should be 200
    And all returned players should have total_runs greater than or equal to 300

  # ---------------------------------------------------------------------------
  # Sorting
  # ---------------------------------------------------------------------------
  @sort @happy
  Scenario Outline: Verify player sorting order and stable tie-breaking
    When I send a GET request to "/api/players?sort_by=<sortBy>&order=<order>"
    Then the response status code should be 200
    And the returned players should be sorted by "<sortBy>" in "<order>" order

    Examples:
      | sortBy     | order |
      | name       | asc   |
      | name       | desc  |
      | total_runs | desc  |
      | team       | asc   |

  # ---------------------------------------------------------------------------
  # Pagination
  # ---------------------------------------------------------------------------
  @pagination @happy
  Scenario: Verify pagination arithmetic and non-overlapping pages
    When I send a GET request to "/api/players?page=1&limit=5"
    Then the response status code should be 200
    And the response pagination meta should have page 1 and limit 5
    When I send a GET request to "/api/players?page=2&limit=5"
    Then the response status code should be 200
    And the response pagination meta should have page 2 and limit 5
    And the players on page 1 and page 2 should have no overlapping IDs

  @pagination @boundary
  Scenario: Querying page beyond total records returns empty array with 200
    When I send a GET request to "/api/players?page=9999&limit=10"
    Then the response status code should be 200
    And the response data array should be empty
    And the response pagination meta should have page 9999 and limit 10

  # ---------------------------------------------------------------------------
  # Negative & Validation Tests
  # ---------------------------------------------------------------------------
  @negative @validation
  Scenario Outline: Strict rejection of invalid query parameters with 400
    When I send a GET request to "<endpoint>"
    Then the response status code should be 400
    And the response error code should be "VALIDATION_ERROR"

    Examples:
      | endpoint                             |
      | /api/players?limit=0                 |
      | /api/players?limit=51                |
      | /api/players?limit=-5                |
      | /api/players?limit=abc               |
      | /api/players?page=0                  |
      | /api/players?page=-1                 |
      | /api/players?q=x                     |
      | /api/players?sortBy=name             |
      | /api/players?nationality=IND         |
      | /api/players?unrecognized_param=true |

  @negative @boundary
  Scenario: Non-numeric and non-existent player ID handling
    When I send a GET request to "/api/players/abc"
    Then the response status code should be 400
    And the response error code should be "VALIDATION_ERROR"
    When I send a GET request to "/api/players/999999"
    Then the response status code should be 404
    And the response error code should be "RESOURCE_NOT_FOUND"

  @negative @method
  Scenario: Unsupported HTTP method on /api/players returns 405 with Allow header
    When I send an unsupported PATCH request to "/api/players"
    Then the response status code should be 405
    And the response header "Allow" should contain "GET, POST"
    And the response error code should be "METHOD_NOT_ALLOWED"

  @negative @domain
  Scenario: Player creation with invalid team returns 422 Unprocessable Entity
    When I send a POST request to "/api/players" with body:
      """
      {
        "name": "Invalid Team Player",
        "team": "INVALID_TEAM",
        "role": "batter"
      }
      """
    Then the response status code should be 422
    And the response error code should be "UNPROCESSABLE_ENTITY"
