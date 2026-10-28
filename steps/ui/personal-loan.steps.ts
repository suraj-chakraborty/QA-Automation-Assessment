/**
 * Personal Loan UI Step Definitions
 * Location: steps/ui/personal-loan.steps.ts
 *
 * Implements Gherkin steps for Personal Loan sliders, Bootstrap calendar datepicker,
 * Highcharts bar chart derived count verification, and tooltip amortization validation.
 */

import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../../support/world';
import { PersonalLoanPage, BarTooltipData } from '../../pages/emi/PersonalLoanPage';
import { calculateEmi, EMI_ROUNDING_TOLERANCE } from '../../utils/emiCalculator';
import {
  calculateAmortizationSchedule,
  deriveExpectedBarCount,
  AmortizationScheduleResult,
  AMORTIZATION_TOLERANCE,
} from '../../utils/amortization';

Given(
  'I am on the EMI calculator personal loan page',
  async function (this: CustomWorld): Promise<void> {
    expect(
      this.page,
      'Playwright Page instance must be initialized for @ui scenarios'
    ).toBeDefined();

    const personalLoanPage = new PersonalLoanPage(this.page!);
    await personalLoanPage.open();
    await personalLoanPage.selectPersonalLoanTab();
    this.setTestData('personalLoanPage', personalLoanPage);
  }
);

When(
  'I adjust the loan amount slider to {float}',
  async function (this: CustomWorld, amount: number): Promise<void> {
    const personalLoanPage = this.getTestData<PersonalLoanPage>('personalLoanPage');
    await personalLoanPage.setLoanAmountViaSlider(amount);
    this.setTestData('loanAmount', amount);
  }
);

When(
  'I set the personal loan amount to {lakh} using the slider',
  async function (this: CustomWorld, amount: number): Promise<void> {
    const personalLoanPage = this.getTestData<PersonalLoanPage>('personalLoanPage');
    await personalLoanPage.setLoanAmountViaSlider(amount);
    this.setTestData('loanAmount', amount);
  }
);

When(
  'I adjust the interest rate slider to {float} percent',
  async function (this: CustomWorld, rate: number): Promise<void> {
    const personalLoanPage = this.getTestData<PersonalLoanPage>('personalLoanPage');
    await personalLoanPage.setInterestRateViaSlider(rate);
    this.setTestData('interestRate', rate);
  }
);

When(
  'I set the personal interest rate to {percent} using the slider',
  async function (this: CustomWorld, rate: number): Promise<void> {
    const personalLoanPage = this.getTestData<PersonalLoanPage>('personalLoanPage');
    await personalLoanPage.setInterestRateViaSlider(rate);
    this.setTestData('interestRate', rate);
  }
);

When(
  'I adjust the loan tenure slider to {float} years',
  async function (this: CustomWorld, tenure: number): Promise<void> {
    const personalLoanPage = this.getTestData<PersonalLoanPage>('personalLoanPage');
    await personalLoanPage.setLoanTenureViaSlider(tenure);
    this.setTestData('loanTenure', tenure);
  }
);

When(
  'I set the personal loan tenure to {years} using the slider',
  async function (this: CustomWorld, tenure: number): Promise<void> {
    const personalLoanPage = this.getTestData<PersonalLoanPage>('personalLoanPage');
    await personalLoanPage.setLoanTenureViaSlider(tenure);
    this.setTestData('loanTenure', tenure);
  }
);

When(
  'I set the repayment start month to {string} {string} via the calendar widget',
  async function (this: CustomWorld, month: string, yearStr: string): Promise<void> {
    const personalLoanPage = this.getTestData<PersonalLoanPage>('personalLoanPage');
    const year = parseInt(yearStr, 10);
    await personalLoanPage.setScheduleStartMonthYear(month, year);
    this.setTestData('startMonth', month);
    this.setTestData('startYear', year);
  }
);

When(
  'I change the schedule start month to {string} and year {int} using the calendar widget',
  async function (this: CustomWorld, month: string, year: number): Promise<void> {
    const personalLoanPage = this.getTestData<PersonalLoanPage>('personalLoanPage');
    await personalLoanPage.setScheduleStartMonthYear(month, year);
    this.setTestData('startMonth', month);
    this.setTestData('startYear', year);
  }
);

Then(
  'the displayed personal loan monthly EMI should match the calculated EMI within tolerance',
  async function (this: CustomWorld): Promise<void> {
    const personalLoanPage = this.getTestData<PersonalLoanPage>('personalLoanPage');
    const principal = this.getTestData<number>('loanAmount');
    const rate = this.getTestData<number>('interestRate');
    const tenure = this.getTestData<number>('loanTenure');

    const expected = calculateEmi(principal, rate, tenure);
    this.setTestData('expectedCalculation', expected);

    const displayedEmi = await personalLoanPage.getDisplayedEmi();
    this.setTestData('displayedEmi', displayedEmi);

    const delta = Math.abs(displayedEmi - expected.emi);
    expect(
      delta,
      `Displayed EMI (₹${displayedEmi}) should match calculated EMI (₹${expected.emi}) within ±${EMI_ROUNDING_TOLERANCE}`
    ).toBeLessThanOrEqual(EMI_ROUNDING_TOLERANCE);
  }
);

Then(
  'the slider input fields should display amount {float}, rate {float}, and tenure {float}',
  async function (
    this: CustomWorld,
    expectedAmount: number,
    expectedRate: number,
    expectedTenure: number
  ): Promise<void> {
    const personalLoanPage = this.getTestData<PersonalLoanPage>('personalLoanPage');
    const actualAmount = await personalLoanPage.getLoanAmount();
    const actualRate = await personalLoanPage.getInterestRate();
    const actualTenure = await personalLoanPage.getLoanTenure();

    expect(actualAmount, `Loan amount input must equal ${expectedAmount}`).toBe(expectedAmount);
    expect(actualRate, `Interest rate input must equal ${expectedRate}`).toBe(expectedRate);
    expect(actualTenure, `Loan tenure input must equal ${expectedTenure}`).toBe(expectedTenure);
  }
);

Then(
  'the amortization bar chart should be visible',
  async function (this: CustomWorld): Promise<void> {
    const personalLoanPage = this.getTestData<PersonalLoanPage>('personalLoanPage');
    const isVisible = await personalLoanPage.isBarChartVisible();
    expect(
      isVisible,
      'Highcharts amortization bar chart container (#emibarchart) should be visible in DOM'
    ).toBe(true);
  }
);

Then('the EMI bar chart should be visible', async function (this: CustomWorld): Promise<void> {
  const personalLoanPage = this.getTestData<PersonalLoanPage>('personalLoanPage');
  const isVisible = await personalLoanPage.isBarChartVisible();
  expect(
    isVisible,
    'Highcharts amortization bar chart container (#emibarchart) should be visible in DOM'
  ).toBe(true);
});

Then(
  'the bar chart column count should equal the derived count for {float} years starting in {string}',
  async function (this: CustomWorld, tenure: number, startMonth: string): Promise<void> {
    const personalLoanPage = this.getTestData<PersonalLoanPage>('personalLoanPage');

    // Derivation: January start yields exactly tenure years.
    // Non-January starts (Feb–Dec) produce partial years at start and end, yielding tenure + 1 bars.
    const expectedBarCount = deriveExpectedBarCount(tenure, startMonth);
    this.setTestData('expectedBarCount', expectedBarCount);

    // Resilient polling for Highcharts SVG redraw without arbitrary sleeps
    await expect
      .poll(
        async () => {
          return await personalLoanPage.getBarCount();
        },
        {
          message: `Waiting for Highcharts bar count to update to derived count (${expectedBarCount})`,
          timeout: 10000,
          intervals: [100, 250, 500],
        }
      )
      .toBe(expectedBarCount);

    const actualBarCount = await personalLoanPage.getBarCount();
    expect(actualBarCount, 'Bar count must be greater than zero').toBeGreaterThan(0);
    expect(
      actualBarCount,
      `Bar count for ${tenure} years starting in ${startMonth} must equal derived count (${expectedBarCount})`
    ).toBe(expectedBarCount);
  }
);

Then(
  'the bar chart should display the derived number of year bars for tenure {int} and start month {string}',
  async function (this: CustomWorld, tenureYears: number, startMonth: string): Promise<void> {
    const personalLoanPage = this.getTestData<PersonalLoanPage>('personalLoanPage');
    const expectedBarCount = deriveExpectedBarCount(tenureYears, startMonth);

    await expect
      .poll(
        async () => {
          return await personalLoanPage.getBarCount();
        },
        {
          message: `Waiting for Highcharts bar count to update to derived count (${expectedBarCount})`,
          timeout: 10000,
          intervals: [100, 250, 500],
        }
      )
      .toBe(expectedBarCount);

    const actualBarCount = await personalLoanPage.getBarCount();
    expect(actualBarCount, 'Bar count must be greater than zero').toBeGreaterThan(0);
    expect(
      actualBarCount,
      `Bar count for ${tenureYears} years starting in ${startMonth} must equal derived count (${expectedBarCount})`
    ).toBe(expectedBarCount);
  }
);

Then(
  'the bar tooltip for the first repayment year should match the calculated amortization breakdown',
  async function (this: CustomWorld): Promise<void> {
    const personalLoanPage = this.getTestData<PersonalLoanPage>('personalLoanPage');
    const principal = this.getTestData<number>('loanAmount');
    const rate = this.getTestData<number>('interestRate');
    const tenure = this.getTestData<number>('loanTenure');
    const startMonth = this.getTestData<string>('startMonth');
    const startYear = this.getTestData<number>('startYear');

    const schedule: AmortizationScheduleResult = calculateAmortizationSchedule(
      principal,
      rate,
      tenure,
      startMonth,
      startYear
    );
    this.setTestData('amortizationSchedule', schedule);

    // Hover over the first bar (index 0) and parse tooltip
    const tooltip: BarTooltipData = await personalLoanPage.hoverBarAndGetTooltip('first');
    const expectedFirstYear = schedule.yearly[0]!;

    expect(
      tooltip.year,
      `First bar tooltip year (${tooltip.year}) must match expected year (${expectedFirstYear.year})`
    ).toBe(expectedFirstYear.year);

    // Validate Total Payment within tolerance
    const paymentDelta = Math.abs(tooltip.totalPayment - expectedFirstYear.totalPayment);
    expect(
      paymentDelta,
      `First bar Total Payment (₹${tooltip.totalPayment}) must match expected (₹${expectedFirstYear.totalPayment}) within ±${AMORTIZATION_TOLERANCE}`
    ).toBeLessThanOrEqual(AMORTIZATION_TOLERANCE);

    // Validate component breakdown (Principal and/or Interest)
    if (tooltip.principal !== null) {
      const principalDelta = Math.abs(tooltip.principal - expectedFirstYear.principal);
      expect(
        principalDelta,
        `First bar Principal (₹${tooltip.principal}) must match expected (₹${expectedFirstYear.principal}) within ±${AMORTIZATION_TOLERANCE}`
      ).toBeLessThanOrEqual(AMORTIZATION_TOLERANCE);
    }

    if (tooltip.interest !== null) {
      const interestDelta = Math.abs(tooltip.interest - expectedFirstYear.interest);
      expect(
        interestDelta,
        `First bar Interest (₹${tooltip.interest}) must match expected (₹${expectedFirstYear.interest}) within ±${AMORTIZATION_TOLERANCE}`
      ).toBeLessThanOrEqual(AMORTIZATION_TOLERANCE);
    }

    // Capture visual evidence of hovered bar and tooltip
    const buffer = await personalLoanPage.takeChartScreenshot(`tooltip_first_year_${tooltip.year}`);
    this.attach(buffer, 'image/png');
  }
);

Then(
  'the tooltip for the first year bar should match the amortization calculation within tolerance',
  async function (this: CustomWorld): Promise<void> {
    const personalLoanPage = this.getTestData<PersonalLoanPage>('personalLoanPage');
    const principal = this.getTestData<number>('loanAmount');
    const rate = this.getTestData<number>('interestRate');
    const tenure = this.getTestData<number>('loanTenure');
    const startMonth = this.getTestData<string>('startMonth');
    const startYear = this.getTestData<number>('startYear');

    const schedule: AmortizationScheduleResult = calculateAmortizationSchedule(
      principal,
      rate,
      tenure,
      startMonth,
      startYear
    );
    this.setTestData('amortizationSchedule', schedule);

    const tooltip: BarTooltipData = await personalLoanPage.hoverBarAndGetTooltip('first');
    const expectedFirstYear = schedule.yearly[0]!;

    expect(tooltip.year).toBe(expectedFirstYear.year);

    const paymentDelta = Math.abs(tooltip.totalPayment - expectedFirstYear.totalPayment);
    expect(paymentDelta).toBeLessThanOrEqual(AMORTIZATION_TOLERANCE);

    if (tooltip.principal !== null) {
      expect(Math.abs(tooltip.principal - expectedFirstYear.principal)).toBeLessThanOrEqual(
        AMORTIZATION_TOLERANCE
      );
    }
    if (tooltip.interest !== null) {
      expect(Math.abs(tooltip.interest - expectedFirstYear.interest)).toBeLessThanOrEqual(
        AMORTIZATION_TOLERANCE
      );
    }
  }
);

Then(
  'the bar tooltip for the final repayment year should match the calculated amortization breakdown',
  async function (this: CustomWorld): Promise<void> {
    const personalLoanPage = this.getTestData<PersonalLoanPage>('personalLoanPage');
    let schedule: AmortizationScheduleResult;
    if (this.hasTestData('amortizationSchedule')) {
      schedule = this.getTestData<AmortizationScheduleResult>('amortizationSchedule');
    } else {
      const principal = this.getTestData<number>('loanAmount');
      const rate = this.getTestData<number>('interestRate');
      const tenure = this.getTestData<number>('loanTenure');
      const startMonth = this.getTestData<string>('startMonth');
      const startYear = this.getTestData<number>('startYear');
      schedule = calculateAmortizationSchedule(principal, rate, tenure, startMonth, startYear);
      this.setTestData('amortizationSchedule', schedule);
    }

    const expectedFinalYear = schedule.yearly[schedule.yearly.length - 1]!;

    // Hover over final bar
    const tooltip: BarTooltipData = await personalLoanPage.hoverBarAndGetTooltip('last');

    expect(
      tooltip.year,
      `Final bar tooltip year (${tooltip.year}) must match expected year (${expectedFinalYear.year})`
    ).toBe(expectedFinalYear.year);

    // Validate Total Payment
    const paymentDelta = Math.abs(tooltip.totalPayment - expectedFinalYear.totalPayment);
    expect(
      paymentDelta,
      `Final bar Total Payment (₹${tooltip.totalPayment}) must match expected (₹${expectedFinalYear.totalPayment}) within ±${AMORTIZATION_TOLERANCE}`
    ).toBeLessThanOrEqual(AMORTIZATION_TOLERANCE);

    // Validate component breakdown
    if (tooltip.principal !== null) {
      const principalDelta = Math.abs(tooltip.principal - expectedFinalYear.principal);
      expect(
        principalDelta,
        `Final bar Principal (₹${tooltip.principal}) must match expected (₹${expectedFinalYear.principal}) within ±${AMORTIZATION_TOLERANCE}`
      ).toBeLessThanOrEqual(AMORTIZATION_TOLERANCE);
    }

    if (tooltip.interest !== null) {
      const interestDelta = Math.abs(tooltip.interest - expectedFinalYear.interest);
      expect(
        interestDelta,
        `Final bar Interest (₹${tooltip.interest}) must match expected (₹${expectedFinalYear.interest}) within ±${AMORTIZATION_TOLERANCE}`
      ).toBeLessThanOrEqual(AMORTIZATION_TOLERANCE);
    }

    // Capture visual evidence of hovered final bar and tooltip
    const buffer = await personalLoanPage.takeChartScreenshot(`tooltip_final_year_${tooltip.year}`);
    this.attach(buffer, 'image/png');
  }
);

Then(
  'the tooltip for the last year bar should match the amortization calculation within tolerance',
  async function (this: CustomWorld): Promise<void> {
    const personalLoanPage = this.getTestData<PersonalLoanPage>('personalLoanPage');
    const schedule = this.getTestData<AmortizationScheduleResult>('amortizationSchedule');
    const expectedFinalYear = schedule.yearly[schedule.yearly.length - 1]!;

    const tooltip: BarTooltipData = await personalLoanPage.hoverBarAndGetTooltip('last');
    expect(tooltip.year).toBe(expectedFinalYear.year);

    const paymentDelta = Math.abs(tooltip.totalPayment - expectedFinalYear.totalPayment);
    expect(paymentDelta).toBeLessThanOrEqual(AMORTIZATION_TOLERANCE);

    if (tooltip.principal !== null) {
      expect(Math.abs(tooltip.principal - expectedFinalYear.principal)).toBeLessThanOrEqual(
        AMORTIZATION_TOLERANCE
      );
    }
    if (tooltip.interest !== null) {
      expect(Math.abs(tooltip.interest - expectedFinalYear.interest)).toBeLessThanOrEqual(
        AMORTIZATION_TOLERANCE
      );
    }
  }
);

Then(
  'I capture and attach the bar chart screenshot for {string}',
  async function (this: CustomWorld, scenarioName: string): Promise<void> {
    const personalLoanPage = this.getTestData<PersonalLoanPage>('personalLoanPage');
    const sanitized = scenarioName.replace(/[^a-zA-Z0-9_-]/g, '_');
    const buffer = await personalLoanPage.takeChartScreenshot(`barchart_${sanitized}`);
    this.attach(buffer, 'image/png');
  }
);
