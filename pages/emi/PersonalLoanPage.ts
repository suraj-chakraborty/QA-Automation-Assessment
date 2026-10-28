/**
 * Personal Loan Page Object Model
 * Location: pages/emi/PersonalLoanPage.ts
 *
 * Encapsulates all UI interactions for the Personal Loan tab on emicalculator.net,
 * scoped strictly to the #personal-loan and #emicalculatordashboard containers
 * with resilient locators and zero fixed sleeps.
 */

import fs from 'fs';
import path from 'path';
import { type Page, type Locator, expect } from '@playwright/test';
import { BasePage } from '../BasePage';
import { parseIndianNumber } from '../../utils/parse';
import config from '../../config/env';

export interface BarTooltipData {
  year: number;
  principal: number | null;
  interest: number | null;
  totalPayment: number;
  rawText: string;
}

export class PersonalLoanPage extends BasePage {
  // Scoped root container
  private readonly dashboard: Locator;

  // Navigation tab
  private readonly personalLoanTabItem: Locator;
  private readonly personalLoanTabLink: Locator;

  // Form input locators
  private readonly loanAmountInput: Locator;
  private readonly loanInterestInput: Locator;
  private readonly loanTermInput: Locator;
  private readonly tenureYearsRadio: Locator;

  // Slider handles
  private readonly amountSliderHandle: Locator;
  private readonly interestSliderHandle: Locator;
  private readonly termSliderHandle: Locator;

  // Schedule start calendar widget
  private readonly startMonthYearInput: Locator;
  private readonly datepickerDropdown: Locator;

  // Output displays
  private readonly emiAmountSpan: Locator;
  private readonly totalInterestSpan: Locator;
  private readonly totalPaymentSpan: Locator;

  // Highcharts bar chart
  private readonly barChartContainer: Locator;
  private readonly barChartSeriesGroup: Locator;
  private readonly principalBars: Locator;
  private readonly chartTooltip: Locator;

  constructor(page: Page) {
    super(page);

    this.dashboard = page.locator('#emicalculatordashboard');

    // Tabs
    this.personalLoanTabItem = this.dashboard.locator('li#personal-loan');
    this.personalLoanTabLink = this.dashboard.locator('li#personal-loan a');

    // Inputs
    this.loanAmountInput = this.dashboard.locator('#loanamount');
    this.loanInterestInput = this.dashboard.locator('#loaninterest');
    this.loanTermInput = this.dashboard.locator('#loanterm');
    this.tenureYearsRadio = this.dashboard.locator('#loanyears');

    // Sliders
    this.amountSliderHandle = this.dashboard.locator('#loanamountslider .ui-slider-handle');
    this.interestSliderHandle = this.dashboard.locator('#loaninterestslider .ui-slider-handle');
    this.termSliderHandle = this.dashboard.locator('#loantermslider .ui-slider-handle');

    // Calendar
    this.startMonthYearInput = page.locator('#startmonthyear');
    this.datepickerDropdown = page.locator('.datepicker.datepicker-dropdown');

    // Outputs
    this.emiAmountSpan = this.dashboard.locator('#emiamount p span, #emiamount span').first();
    this.totalInterestSpan = this.dashboard
      .locator('#emitotalinterest p span, #emitotalinterest span')
      .first();
    this.totalPaymentSpan = this.dashboard
      .locator('#emitotalamount p span, #emitotalamount span')
      .first();

    // Highcharts Bar Chart
    this.barChartContainer = page.locator('#emibarchart');
    this.barChartSeriesGroup = page.locator('#emibarchart .highcharts-series-group');
    // Scope strictly to .highcharts-series-group to avoid legend symbol rect!
    this.principalBars = this.barChartSeriesGroup.locator('.highcharts-series-1 rect');
    this.chartTooltip = page
      .locator('#emibarchart .highcharts-tooltip text, .highcharts-tooltip text')
      .first();
  }

  /**
   * Navigate to the base calculator page and dismiss consent banners
   */
  public async open(): Promise<void> {
    await this.navigate('/', { waitUntil: 'domcontentloaded' });
    await this.dismissConsentModal();
    await this.dashboard.waitFor({
      state: 'visible',
      timeout: config.DEFAULT_TIMEOUT_MS,
    });
  }

  /**
   * Select and activate the Personal Loan tab
   */
  public async selectPersonalLoanTab(): Promise<void> {
    await this.personalLoanTabLink.waitFor({ state: 'visible' });
    await this.personalLoanTabLink.click();
    await expect(this.personalLoanTabItem).toHaveClass(/active/, {
      timeout: config.DEFAULT_TIMEOUT_MS,
    });
  }

  /**
   * Set Loan Amount via slider handle keyboard navigation and verify input
   */
  public async setLoanAmountViaSlider(targetAmount: number): Promise<void> {
    await this.amountSliderHandle.waitFor({ state: 'visible' });
    await this.amountSliderHandle.focus();

    let curVal = parseIndianNumber(await this.loanAmountInput.inputValue());
    let iterations = 0;
    const maxIterations = 150;

    while (curVal !== targetAmount && iterations < maxIterations) {
      iterations++;
      if (curVal < targetAmount) {
        await this.page.keyboard.press('ArrowRight');
      } else {
        await this.page.keyboard.press('ArrowLeft');
      }
      curVal = parseIndianNumber(await this.loanAmountInput.inputValue());
    }

    if (curVal !== targetAmount) {
      await this.loanAmountInput.fill(targetAmount.toString());
      await this.loanAmountInput.press('Enter');
    }

    await expect
      .poll(async () => parseIndianNumber(await this.loanAmountInput.inputValue()))
      .toBe(targetAmount);
  }

  public async adjustLoanAmountSlider(amount: number): Promise<void> {
    return this.setLoanAmountViaSlider(amount);
  }

  /**
   * Set Interest Rate via slider handle keyboard navigation and verify input
   */
  public async setInterestRateViaSlider(targetRate: number): Promise<void> {
    await this.interestSliderHandle.waitFor({ state: 'visible' });
    await this.interestSliderHandle.focus();

    let curRate = parseFloat(await this.loanInterestInput.inputValue());
    let iterations = 0;
    const maxIterations = 100;

    while (Math.abs(curRate - targetRate) > 0.01 && iterations < maxIterations) {
      iterations++;
      if (curRate < targetRate) {
        await this.page.keyboard.press('ArrowRight');
      } else {
        await this.page.keyboard.press('ArrowLeft');
      }
      curRate = parseFloat(await this.loanInterestInput.inputValue());
    }

    if (Math.abs(curRate - targetRate) > 0.01) {
      await this.loanInterestInput.fill(targetRate.toString());
      await this.loanInterestInput.press('Enter');
    }

    await expect
      .poll(async () => parseFloat(await this.loanInterestInput.inputValue()))
      .toBe(targetRate);
  }

  public async adjustInterestRateSlider(rate: number): Promise<void> {
    return this.setInterestRateViaSlider(rate);
  }

  /**
   * Set Loan Tenure via slider handle keyboard navigation and verify input
   */
  public async setLoanTenureViaSlider(targetYears: number): Promise<void> {
    await this.tenureYearsRadio.waitFor({ state: 'attached' });
    if (!(await this.tenureYearsRadio.isChecked())) {
      await this.tenureYearsRadio.check({ force: true });
    }

    await this.termSliderHandle.waitFor({ state: 'visible' });
    await this.termSliderHandle.focus();

    let curTerm = parseFloat(await this.loanTermInput.inputValue());
    let iterations = 0;
    const maxIterations = 100;

    while (Math.abs(curTerm - targetYears) > 0.01 && iterations < maxIterations) {
      iterations++;
      if (curTerm < targetYears) {
        await this.page.keyboard.press('ArrowRight');
      } else {
        await this.page.keyboard.press('ArrowLeft');
      }
      curTerm = parseFloat(await this.loanTermInput.inputValue());
    }

    if (Math.abs(curTerm - targetYears) > 0.01) {
      await this.loanTermInput.fill(targetYears.toString());
      await this.loanTermInput.press('Enter');
    }

    await expect
      .poll(async () => parseFloat(await this.loanTermInput.inputValue()))
      .toBe(targetYears);
  }

  public async adjustLoanTenureSlider(years: number): Promise<void> {
    return this.setLoanTenureViaSlider(years);
  }

  public async getLoanAmount(): Promise<number> {
    return parseIndianNumber(await this.loanAmountInput.inputValue());
  }

  public async getInterestRate(): Promise<number> {
    return parseFloat(await this.loanInterestInput.inputValue());
  }

  public async getLoanTenure(): Promise<number> {
    return parseFloat(await this.loanTermInput.inputValue());
  }

  /**
   * Set schedule start month and year via Bootstrap Datepicker without fixed sleeps
   */
  public async setScheduleStartMonthYear(monthStr: string, year?: number): Promise<void> {
    await this.startMonthYearInput.waitFor({ state: 'visible' });
    await this.startMonthYearInput.click();

    const monthsView = this.datepickerDropdown.locator('.datepicker-months');
    await monthsView.waitFor({ state: 'visible', timeout: 5000 });

    if (typeof year === 'number') {
      const yearSwitch = monthsView.locator('th.datepicker-switch');
      const nextBtn = monthsView.locator('th.next');
      const prevBtn = monthsView.locator('th.prev');

      let currentYear = parseInt((await yearSwitch.innerText()).trim(), 10);
      let attempts = 0;
      while (currentYear !== year && attempts < 20) {
        attempts++;
        if (currentYear < year) {
          await nextBtn.click();
        } else {
          await prevBtn.click();
        }
        currentYear = parseInt((await yearSwitch.innerText()).trim(), 10);
      }
    }

    const monthAbbr = monthStr.substring(0, 3);
    const monthCell = monthsView.locator(`span.month:has-text("${monthAbbr}")`).first();
    await monthCell.click();

    await this.datepickerDropdown.waitFor({ state: 'hidden', timeout: 5000 });
    await expect(this.startMonthYearInput).toHaveValue(new RegExp(monthAbbr, 'i'));
  }

  public async setScheduleStartMonth(month: string, year?: number): Promise<void> {
    return this.setScheduleStartMonthYear(month, year);
  }

  public async getScheduleStartMonthYear(): Promise<string> {
    return (await this.startMonthYearInput.inputValue()).trim();
  }

  public async getDisplayedEmi(): Promise<number> {
    await this.emiAmountSpan.waitFor({ state: 'visible' });
    const text = await this.emiAmountSpan.innerText();
    return parseIndianNumber(text);
  }

  public async getDisplayedTotalInterest(): Promise<number> {
    await this.totalInterestSpan.waitFor({ state: 'visible' });
    const text = await this.totalInterestSpan.innerText();
    return parseIndianNumber(text);
  }

  public async getDisplayedTotalPayment(): Promise<number> {
    await this.totalPaymentSpan.waitFor({ state: 'visible' });
    const text = await this.totalPaymentSpan.innerText();
    return parseIndianNumber(text);
  }

  public async isBarChartVisible(): Promise<boolean> {
    try {
      await this.barChartContainer.waitFor({ state: 'visible', timeout: 5000 });
      return await this.barChartContainer.isVisible();
    } catch {
      return false;
    }
  }

  /**
   * Get the number of year bars rendered in the Highcharts stacked column chart.
   * Scoped strictly to .highcharts-series-group to exclude the 12x12 legend symbol rect.
   */
  public async getBarCount(): Promise<number> {
    await this.principalBars.first().waitFor({ state: 'visible', timeout: 10000 });
    return await this.principalBars.count();
  }

  /**
   * Hover over the bar at specified index or position and parse tooltip data.
   * Uses textContent() because tooltip <text> is an SVGElement (not HTMLElement).
   */
  public async hoverBarAndGetTooltip(
    barIndexOrPosition: number | 'first' | 'last'
  ): Promise<BarTooltipData> {
    const totalBars = await this.getBarCount();
    let index = 0;
    if (barIndexOrPosition === 'first' || barIndexOrPosition === 0) {
      index = 0;
    } else if (barIndexOrPosition === 'last' || barIndexOrPosition === -1) {
      index = totalBars - 1;
    } else if (typeof barIndexOrPosition === 'number') {
      index = barIndexOrPosition < 0 ? totalBars + barIndexOrPosition : barIndexOrPosition;
    }

    const bar = this.principalBars.nth(index);
    await bar.waitFor({ state: 'visible' });
    await bar.hover({ force: true });

    await this.chartTooltip.waitFor({ state: 'visible', timeout: 5000 });
    const rawText = (await this.chartTooltip.textContent()) || '';

    const yearMatch = rawText.match(/Year\s*:\s*(\d{4})/i);
    const principalMatch = rawText.match(/Principal\s*:\s*[₹\u20B9]?\s*([\d,]+)/i);
    const interestMatch = rawText.match(/Interest\s*:\s*[₹\u20B9]?\s*([\d,]+)/i);
    const totalMatch = rawText.match(/Total\s*Payment\s*:\s*[₹\u20B9]?\s*([\d,]+)/i);

    if (!yearMatch || !totalMatch) {
      throw new Error(`Failed to parse required tooltip fields from text: "${rawText}"`);
    }

    const year = parseInt(yearMatch[1]!, 10);
    const totalPayment = parseIndianNumber(totalMatch[1]!);
    let principal = principalMatch ? parseIndianNumber(principalMatch[1]!) : null;
    let interest = interestMatch ? parseIndianNumber(interestMatch[1]!) : null;

    if (principal !== null && interest === null) {
      interest = totalPayment - principal;
    } else if (interest !== null && principal === null) {
      principal = totalPayment - interest;
    }

    return {
      year,
      principal,
      interest,
      totalPayment,
      rawText,
    };
  }

  public async getBarTooltip(
    barIndexOrPosition: number | 'first' | 'last'
  ): Promise<BarTooltipData> {
    return this.hoverBarAndGetTooltip(barIndexOrPosition);
  }

  /**
   * Capture screenshot of the bar chart and persist to reports/screenshots/${name}.png
   *
   * @param name Descriptive scenario name for the screenshot artifact
   * @returns Buffer containing PNG image bytes
   */
  public async takeChartScreenshot(name: string): Promise<Buffer> {
    const sanitizedName = name.replace(/[^a-zA-Z0-9_-]/g, '_');
    const screenshotsDir = path.resolve(process.cwd(), 'reports', 'screenshots');
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }
    const filePath = path.join(screenshotsDir, `${sanitizedName}.png`);

    let buffer: Buffer;
    if (await this.barChartContainer.isVisible()) {
      buffer = await this.barChartContainer.screenshot({ path: filePath });
    } else {
      buffer = await this.page.screenshot({ path: filePath, fullPage: true });
    }

    return buffer;
  }
}

export default PersonalLoanPage;
