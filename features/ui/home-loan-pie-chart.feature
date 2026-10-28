@ui @tc1 @live
Feature: Home Loan EMI Calculation and Payment Breakup Pie Chart
  As a prospective home loan borrower
  I want to calculate my monthly EMI, total interest, and total repayment amount
  And verify the Highcharts payment breakup pie chart proportions
  So that I have verified financial calculations and visual evidence of loan costs

  @tc1 @scenario_outline
  Scenario Outline: Verify Home Loan EMI and Pie Chart Breakup for <scenario>
    Given I am on the EMI calculator home loan page
    When I enter a loan amount of <amount>
    And I enter an interest rate of <rate> percent
    And I enter a loan tenure of <tenure> years
    Then the displayed monthly EMI should match the calculated EMI within tolerance
    And the EMI pie chart should be visible
    And each pie chart slice value should be greater than zero
    And the pie chart slices should be consistent with the loan details
    And I capture and attach the chart screenshot for "<scenario>"

    Examples:
      | scenario   | amount  | rate | tenure |
      | Scenario A | 2500000 | 10.0 | 10     |
      | Scenario B | 5000000 | 7.5  | 15     |
