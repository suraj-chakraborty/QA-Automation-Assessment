/**
 * Home Loan Page Object Model
 * Location: pages/emi/HomeLoanPage.ts
 *
 * Encapsulates all UI interactions for the Home Loan tab on emicalculator.net,
 * scoped strictly to the #emicalculatordashboard container with resilient locators.
 */

import fs from 'fs';
import path from 'path';
import { type Page, type Locator, expect } from '@playwright/test';
import { BasePage } from '../BasePage';
import { parseIndianNumber } from '../../utils/parse';
import config from '../../config/env';

export interface PieChartSlices {
  principal: number;
  interest: number;
}

export class HomeLoanPage extends BasePage {
  // Scoped root container
  private readonly dashboard: Locator;

  // Navigation tab
  private readonly homeLoanTabItem: Locator;
  private readonly homeLoanTabLink: Locator;

  // Form input locators
  private readonly loanAmountInput: Locator;
  private readonly loanInterestInput: Locator;
  private readonly loanTermInput: Locator;
  private readonly tenureYearsRadio: Locator;

  // Output display locators
  private readonly emiAmountSpan: Locator;
  private readonly totalInterestSpan: Locator;
  private readonly totalPaymentSpan: Locator;

  // Highcharts pie chart
  private readonly pieChartContainer: Locator;

  constructor(page: Page) {
    super(page);

    // Root container
    this.dashboard = page.locator('#emicalculatordashboard');

    // Tabs
    this.homeLoanTabItem = this.dashboard.locator('li#home-loan');
    this.homeLoanTabLink = this.dashboard.locator('li#home-loan a');

    // Inputs
    this.loanAmountInput = this.dashboard.locator('#loanamount');
    this.loanInterestInput = this.dashboard.locator('#loaninterest');
    this.loanTermInput = this.dashboard.locator('#loanterm');
    this.tenureYearsRadio = this.dashboard.locator('#loanyears');

    // Outputs
    this.emiAmountSpan = this.dashboard.locator('#emiamount p span, #emiamount span').first();
    this.totalInterestSpan = this.dashboard
      .locator('#emitotalinterest p span, #emitotalinterest span')
      .first();
    this.totalPaymentSpan = this.dashboard
      .locator('#emitotalamount p span, #emitotalamount span')
      .first();

    // Pie chart
    this.pieChartContainer = this.dashboard.locator('#emipiechart');
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
   * Select and activate the Home Loan tab
   */
  public async selectHomeLoanTab(): Promise<void> {
    await this.homeLoanTabLink.waitFor({ state: 'visible' });
    await this.homeLoanTabLink.click();
    await expect(this.homeLoanTabItem).toHaveClass(/active/, {
      timeout: config.DEFAULT_TIMEOUT_MS,
    });
  }

  /**
   * Set the principal loan amount and trigger calculation update
   */
  public async setLoanAmount(amount: number): Promise<void> {
    await this.loanAmountInput.waitFor({ state: 'visible' });
    await this.loanAmountInput.click();
    await this.loanAmountInput.fill(amount.toString());
    await this.loanAmountInput.press('Enter');
  }

  /**
   * Set annual interest rate and trigger calculation update
   */
  public async setInterestRate(rate: number): Promise<void> {
    await this.loanInterestInput.waitFor({ state: 'visible' });
    await this.loanInterestInput.click();
    await this.loanInterestInput.fill(rate.toString());
    await this.loanInterestInput.press('Enter');
  }

  /**
   * Set loan tenure in years and ensure the "Yr" unit radio is selected
   */
  public async setLoanTenureYears(years: number): Promise<void> {
    await this.tenureYearsRadio.waitFor({ state: 'attached' });
    const isYearsSelected = await this.tenureYearsRadio.isChecked();
    if (!isYearsSelected) {
      await this.tenureYearsRadio.check({ force: true });
    }
    await this.loanTermInput.waitFor({ state: 'visible' });
    await this.loanTermInput.click();
    await this.loanTermInput.fill(years.toString());
    await this.loanTermInput.press('Enter');
  }

  /**
   * Retrieve and parse the displayed monthly EMI value
   */
  public async getDisplayedEmi(): Promise<number> {
    await this.emiAmountSpan.waitFor({ state: 'visible' });
    const text = await this.emiAmountSpan.innerText();
    return parseIndianNumber(text);
  }

  /**
   * Retrieve and parse the displayed total interest payable
   */
  public async getDisplayedTotalInterest(): Promise<number> {
    await this.totalInterestSpan.waitFor({ state: 'visible' });
    const text = await this.totalInterestSpan.innerText();
    return parseIndianNumber(text);
  }

  /**
   * Retrieve and parse the displayed total payment (principal + interest)
   */
  public async getDisplayedTotalPayment(): Promise<number> {
    await this.totalPaymentSpan.waitFor({ state: 'visible' });
    const text = await this.totalPaymentSpan.innerText();
    return parseIndianNumber(text);
  }

  /**
   * Check whether the Highcharts pie chart container is visible
   */
  public async isPieChartVisible(): Promise<boolean> {
    try {
      await this.pieChartContainer.waitFor({ state: 'visible', timeout: 5000 });
      return await this.pieChartContainer.isVisible();
    } catch {
      return false;
    }
  }

  /**
   * Extract principal and interest slice values from the rendered Highcharts pie chart.
   * Uses web-first expect.poll to wait for Highcharts SVG data points to be fully populated.
   */
  public async getPieChartSlices(): Promise<PieChartSlices> {
    let slices: PieChartSlices | null = null;

    await expect
      .poll(
        async () => {
          slices = await this.page.evaluate(() => {
            const anyWin = window as unknown as {
              Highcharts?: {
                charts?: Array<{
                  renderTo?: HTMLElement;
                  series?: Array<{
                    data?: Array<{ y?: number; name?: string }>;
                  }>;
                }>;
              };
            };

            const chart = anyWin.Highcharts?.charts?.find(
              c => c && (c.renderTo?.id === 'emipiechart' || c.renderTo?.closest?.('#emipiechart'))
            );

            if (chart?.series?.[0]?.data && chart.series[0].data.length >= 2) {
              const data = chart.series[0].data;
              const principal = data[0]?.y;
              const interest = data[1]?.y;
              if (typeof principal === 'number' && typeof interest === 'number') {
                return { principal, interest };
              }
            }
            return null;
          });
          return slices;
        },
        {
          message: 'Waiting for Highcharts pie chart slices data to populate',
          timeout: 10000,
          intervals: [100, 250, 500],
        }
      )
      .not.toBeNull();

    if (!slices) {
      throw new Error('Failed to retrieve pie chart slice values from Highcharts instance');
    }

    return slices;
  }

  /**
   * Capture screenshot of the pie chart and persist to reports/screenshots/${name}.png
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
    if (await this.pieChartContainer.isVisible()) {
      buffer = await this.pieChartContainer.screenshot({ path: filePath });
    } else {
      buffer = await this.page.screenshot({ path: filePath, fullPage: true });
    }

    return buffer;
  }
}

export default HomeLoanPage;
