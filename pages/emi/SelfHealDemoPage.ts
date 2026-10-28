import { Locator, Page } from '@playwright/test';
import { BasePage } from '../BasePage';

/**
 * SelfHealDemoPage contains 5 intentionally broken, brittle locators.
 * These are used to demonstrate AI self-healing detection, prompt generation,
 * and automated candidate repair in Milestone S11 and S12.
 *
 * NOTE: These locators are DELIBERATELY BROKEN per assessment requirement G4.
 */
export class SelfHealDemoPage extends BasePage {
  // INTENTIONALLY BROKEN (SH-01): Brittle positional CSS that breaks when parent or sibling structure changes
  private readonly brokenPositionalCss: Locator;

  // INTENTIONALLY BROKEN (SH-02): Stale auto-generated dynamic ID that does not exist in the DOM
  private readonly brokenStaleDynamicId: Locator;

  // INTENTIONALLY BROKEN (SH-03): Fragile absolute indexed XPath that breaks on minor layout refactoring
  private readonly brokenAbsoluteXPath: Locator;

  // INTENTIONALLY BROKEN (SH-04): Accessible name hallucination targeting a non-existent button label
  private readonly brokenAccessibleName: Locator;

  // INTENTIONALLY BROKEN (SH-05): Presumed data-testid on a third-party site that lacks testid attributes
  private readonly brokenMissingTestId: Locator;

  constructor(page: Page) {
    super(page);

    // SH-01: Positional CSS selector targeting loan amount container
    this.brokenPositionalCss = page.locator(
      'div.calculator-container > div:nth-child(5) > input.input-field'
    );

    // SH-02: Stale auto-generated ID for interest rate input
    this.brokenStaleDynamicId = page.locator('#loanamount_dynamic_hash_987654');

    // SH-03: Absolute XPath with position index for loan tenure input
    this.brokenAbsoluteXPath = page.locator(
      'xpath=/html/body/div[4]/div[1]/section/div/form/div[2]/div/input'
    );

    // SH-04: Non-existent button role with fictitious name
    this.brokenAccessibleName = page.getByRole('button', { name: 'Calculate Monthly EMI Now' });

    // SH-05: Missing data-testid attribute for personal loan tab
    this.brokenMissingTestId = page.getByTestId('personal-loan-tab-button');
  }

  public async open(): Promise<void> {
    await this.navigate('/');
  }

  public async triggerBrokenPositionalCss(): Promise<void> {
    await this.brokenPositionalCss.click({ timeout: 2000 });
  }

  public async triggerBrokenStaleDynamicId(): Promise<void> {
    await this.brokenStaleDynamicId.click({ timeout: 2000 });
  }

  public async triggerBrokenAbsoluteXPath(): Promise<void> {
    await this.brokenAbsoluteXPath.click({ timeout: 2000 });
  }

  public async triggerBrokenAccessibleName(): Promise<void> {
    await this.brokenAccessibleName.click({ timeout: 2000 });
  }

  public async triggerBrokenMissingTestId(): Promise<void> {
    await this.brokenMissingTestId.click({ timeout: 2000 });
  }
}
