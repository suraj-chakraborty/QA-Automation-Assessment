@sql @b4 @ipl-streaks
Feature: SQL IPL Player Performance Streaks (B4 Scenario 2)
  As a cricket analyst
  I want to identify players who scored 30+ runs in at least 3 consecutive matches in the 2024 season
  To analyze player consistency and form streaks

  Scenario: Verify deterministic detection of IPL 30+ runs streaks in 2024 season
    Given an initialized SQLite database with the IPL 2024 synthetic dataset
    When I execute the IPL streaks query "sql/queries/02_ipl_streaks.sql"
    Then the query should return exactly 5 qualifying streaks:
      | player_name       | streak_start_date | streak_end_date | streak_length |
      | Aarav Varma       | 2024-03-22        | 2024-03-31      | 3             |
      | Ethan Brooks      | 2024-03-24        | 2024-05-12      | 9             |
      | Liam Sterling     | 2024-03-24        | 2024-04-11      | 5             |
      | Rohan Chakraborty | 2024-03-23        | 2024-03-30      | 3             |
      | Tariq Al-Mansoor  | 2024-03-23        | 2024-04-03      | 4             |
    And players with interrupted streaks like Nathan Cross should not appear
    And performances from 2023 season should be strictly excluded

