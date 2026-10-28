@sql @b4 @round-trip
Feature: SQL Round-Trip Transfers Verification (B4 Scenario 1)
  As an auditor
  I want to detect reciprocal bank transfers within 10% amount and 24 hours
  To identify potential payment reversals or round-trip transfers

  Scenario: Verify deterministic detection of 24h round-trip transfers within 10% amount
    Given an initialized SQLite database with round-trip transfer seed data
    When I execute the round-trip transfer query "sql/queries/05_round_trip_transfers.sql"
    Then the query should return exactly 5 matched transfer pairs:
      | txn_a_id | txn_b_id | account_a | account_b | amount_a_to_b | amount_b_to_a | pct_diff | hours_between |
      | 1        | 2        | ACC_100   | ACC_200   | 1000          | 950           | 5.0      | 8.0           |
      | 3        | 4        | ACC_101   | ACC_201   | 500           | 525           | 5.0      | 24.0          |
      | 5        | 6        | ACC_102   | ACC_202   | 200           | 220           | 10.0     | 3.0           |
      | 7        | 8        | ACC_103   | ACC_203   | 300           | 270           | 10.0     | 6.0           |
      | 9        | 10       | ACC_104   | ACC_204   | 70            | 77            | 10.0     | 4.0           |
    And no non-qualifying transactions should appear in the results

