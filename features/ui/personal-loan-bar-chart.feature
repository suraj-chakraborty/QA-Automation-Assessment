@ui @tc2 @live
Feature: Personal Loan EMI Bar Chart, Sliders, and Amortization Schedule
  As a prospective personal loan borrower
  I want to adjust loan parameters using interactive sliders and customize the repayment start month
  And inspect the Highcharts annual repayment bar chart and interactive tooltips
  So that I have verified financial calculations of yearly principal, interest, and total repayment amounts

  @tc2 @scenario_outline
  Scenario Outline: Verify Personal Loan bar chart derivation and tooltip amortization for <scenario>
    Given I am on the EMI calculator personal loan page
    When I adjust the loan amount slider to <amount>
    And I adjust the interest rate slider to <rate> percent
    And I adjust the loan tenure slider to <tenure> years
    And I set the repayment start month to "<start_month>" "<start_year>" via the calendar widget
    Then the displayed personal loan monthly EMI should match the calculated EMI within tolerance
    And the amortization bar chart should be visible
    And the bar chart column count should equal the derived count for <tenure> years starting in "<start_month>"
    And the bar tooltip for the first repayment year should match the calculated amortization breakdown
    And the bar tooltip for the final repayment year should match the calculated amortization breakdown
    And I capture and attach the bar chart screenshot for "<scenario>"

    Examples:
      | scenario                     | amount  | rate | tenure | start_month | start_year |
      | Non-January Start (Jul 2026) | 1000000 | 12.0 | 5      | Jul         | 2026       |
      | January Start (Jan 2027)     | 1000000 | 12.0 | 5      | Jan         | 2027       |
