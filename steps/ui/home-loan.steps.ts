/**
 * Home Loan UI Step Definitions
 * Location: steps/ui/home-loan.steps.ts
 *
 * Implements Gherkin steps for Home Loan EMI calculation and Highcharts pie chart validation.
 */

import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../../support/world';
import { HomeLoanPage, PieChartSlices } from '../../pages/emi/HomeLoanPage';
import {
  calculateEmi,
  EmiCalculationResult,
  EMI_ROUNDING_TOLERANCE,
  TOTAL_INTEREST_TOLERANCE,
  TOTAL_PAYMENT_TOLERANCE,
} from '../../utils/emiCalculator';

Given(
  'I am on the EMI calculator home loan page',
  async function (this: CustomWorld): Promise<void> {
    expect(
      this.page,
      'Playwright Page instance must be initialized for @ui scenarios'
    ).toBeDefined();
    const homeLoanPage = new HomeLoanPage(this.page!);
    await homeLoanPage.open();
    await homeLoanPage.selectHomeLoanTab();
    this.setTestData('homeLoanPage', homeLoanPage);
  }
);

When(
  'I enter a loan amount of {float}',
  async function (this: CustomWorld, amount: number): Promise<void> {
    const homeLoanPage = this.getTestData<HomeLoanPage>('homeLoanPage');
    await homeLoanPage.setLoanAmount(amount);
    this.setTestData('loanAmount', amount);
  }
);

When(
  'I enter an interest rate of {float} percent',
  async function (this: CustomWorld, rate: number): Promise<void> {
    const homeLoanPage = this.getTestData<HomeLoanPage>('homeLoanPage');
    await homeLoanPage.setInterestRate(rate);
    this.setTestData('interestRate', rate);
  }
);

When(
  'I enter a loan tenure of {float} years',
  async function (this: CustomWorld, tenure: number): Promise<void> {
    const homeLoanPage = this.getTestData<HomeLoanPage>('homeLoanPage');
    await homeLoanPage.setLoanTenureYears(tenure);
    this.setTestData('loanTenure', tenure);
  }
);

Then(
  'the displayed monthly EMI should match the calculated EMI within tolerance',
  async function (this: CustomWorld): Promise<void> {
    const homeLoanPage = this.getTestData<HomeLoanPage>('homeLoanPage');
    const principal = this.getTestData<number>('loanAmount');
    const rate = this.getTestData<number>('interestRate');
    const tenure = this.getTestData<number>('loanTenure');

    const expected = calculateEmi(principal, rate, tenure);
    this.setTestData<EmiCalculationResult>('expectedCalculation', expected);

    const displayedEmi = await homeLoanPage.getDisplayedEmi();
    this.setTestData('displayedEmi', displayedEmi);

    const delta = Math.abs(displayedEmi - expected.emi);
    expect(
      delta,
      `Displayed EMI (₹${displayedEmi}) should match calculated EMI (₹${expected.emi}) within ±${EMI_ROUNDING_TOLERANCE}`
    ).toBeLessThanOrEqual(EMI_ROUNDING_TOLERANCE);
  }
);

Then('the EMI pie chart should be visible', async function (this: CustomWorld): Promise<void> {
  const homeLoanPage = this.getTestData<HomeLoanPage>('homeLoanPage');
  const isVisible = await homeLoanPage.isPieChartVisible();
  expect(isVisible, 'Highcharts pie chart container (#emipiechart) should be visible in DOM').toBe(
    true
  );
});

Then(
  'each pie chart slice value should be greater than zero',
  async function (this: CustomWorld): Promise<void> {
    const homeLoanPage = this.getTestData<HomeLoanPage>('homeLoanPage');
    const slices = await homeLoanPage.getPieChartSlices();
    this.setTestData<PieChartSlices>('pieSlices', slices);

    expect(
      slices.principal,
      `Principal slice value (${slices.principal}) must be strictly greater than 0`
    ).toBeGreaterThan(0);

    expect(
      slices.interest,
      `Interest slice value (${slices.interest}) must be strictly greater than 0`
    ).toBeGreaterThan(0);
  }
);

Then(
  'the pie chart slices should be consistent with the loan details',
  async function (this: CustomWorld): Promise<void> {
    const homeLoanPage = this.getTestData<HomeLoanPage>('homeLoanPage');
    const principal = this.getTestData<number>('loanAmount');
    const slices = this.getTestData<PieChartSlices>('pieSlices');

    const displayedTotalInterest = await homeLoanPage.getDisplayedTotalInterest();
    const displayedTotalPayment = await homeLoanPage.getDisplayedTotalPayment();

    this.setTestData('displayedTotalInterest', displayedTotalInterest);
    this.setTestData('displayedTotalPayment', displayedTotalPayment);

    // 1. Principal slice equals loan amount (within ±1 tolerance)
    const principalDelta = Math.abs(slices.principal - principal);
    expect(
      principalDelta,
      `Principal slice (${slices.principal}) must equal loan amount (${principal}) within ±1`
    ).toBeLessThanOrEqual(1);

    // 2. Interest slice matches total interest within ±2 tolerance
    const interestDelta = Math.abs(slices.interest - displayedTotalInterest);
    expect(
      interestDelta,
      `Interest slice (${slices.interest}) must match displayed total interest (${displayedTotalInterest}) within ±${TOTAL_INTEREST_TOLERANCE}`
    ).toBeLessThanOrEqual(TOTAL_INTEREST_TOLERANCE);

    // 3. Principal + Interest sum equals total payment within ±2 tolerance
    const sum = slices.principal + slices.interest;
    const sumDelta = Math.abs(sum - displayedTotalPayment);
    expect(
      sumDelta,
      `Slice sum (${sum}) must equal displayed total payment (${displayedTotalPayment}) within ±${TOTAL_PAYMENT_TOLERANCE}`
    ).toBeLessThanOrEqual(TOTAL_PAYMENT_TOLERANCE);
  }
);

Then(
  'I capture and attach the chart screenshot for {string}',
  async function (this: CustomWorld, scenarioName: string): Promise<void> {
    const homeLoanPage = this.getTestData<HomeLoanPage>('homeLoanPage');
    const sanitized = scenarioName.replace(/[^a-zA-Z0-9_-]/g, '_');
    const buffer = await homeLoanPage.takeChartScreenshot(`chart_${sanitized}`);
    this.attachScreenshot(buffer, 'image/png');
  }
);
