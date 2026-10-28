/**
 * Streamhub Playwright BasePage POM
 * Location: pages/BasePage.ts
 */

import fs from 'fs';
import path from 'path';
import type { Page, Locator } from '@playwright/test';
import config from '../config/env';

export interface NavigationOptions {
  waitUntil?: 'load' | 'domcontentloaded' | 'networkidle' | 'commit';
  timeout?: number;
  retries?: number;
}

export interface ActionOptions {
  timeout?: number;
  force?: boolean;
  actionDescription?: string;
}

export interface FillOptions extends ActionOptions {
  noWaitAfter?: boolean;
}

export interface WaitForElementOptions {
  state?: 'attached' | 'detached' | 'visible' | 'hidden';
  timeout?: number;
  actionDescription?: string;
}

export interface ScreenshotOptions {
  fullPage?: boolean;
  path?: string;
}

export interface PageActionErrorContext {
  action: string;
  target: string;
  intent?: string;
  url: string;
  title: string;
  originalError: Error;
}

export class PageActionError extends Error {
  public readonly context: PageActionErrorContext;

  constructor(message: string, context: PageActionErrorContext) {
    super(message);
    this.name = 'PageActionError';
    this.context = context;
    this.cause = context.originalError;
  }
}

export abstract class BasePage {
  protected readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  public getPage(): Page {
    return this.page;
  }

  public get url(): string {
    return this.page.url();
  }

  public async getTitle(): Promise<string> {
    return this.page.title();
  }

  /**
   * Navigate to a path or URL.
   * If a relative path is provided, it is resolved against config.EMI_BASE_URL.
   * Includes one bounded retry for network resilience.
   */
  public async navigate(pathOrUrl = '', options: NavigationOptions = {}): Promise<void> {
    const targetUrl = new URL(pathOrUrl, config.EMI_BASE_URL).toString();
    const retries = options.retries ?? 1;
    const waitUntil = options.waitUntil ?? 'domcontentloaded';
    const timeout = options.timeout ?? config.DEFAULT_TIMEOUT_MS;

    let attempt = 0;
    while (attempt <= retries) {
      try {
        await this.page.goto(targetUrl, { waitUntil, timeout });
        return;
      } catch (err) {
        attempt++;
        if (attempt > retries) {
          throw await this.enrichError('navigate', targetUrl, err, `Navigate to ${targetUrl}`);
        }
      }
    }
  }

  /**
   * Resilient click wrapper with error diagnostic enrichment
   */
  public async click(selectorOrLocator: string | Locator, options?: ActionOptions): Promise<void> {
    const locator = this.resolveLocator(selectorOrLocator);
    await this.executeAction('click', selectorOrLocator, options?.actionDescription, async () => {
      await locator.click({
        timeout: options?.timeout ?? config.DEFAULT_TIMEOUT_MS,
        force: options?.force,
      });
    });
  }

  /**
   * Resilient fill wrapper
   */
  public async fill(
    selectorOrLocator: string | Locator,
    text: string,
    options?: FillOptions
  ): Promise<void> {
    const locator = this.resolveLocator(selectorOrLocator);
    await this.executeAction(
      'fill',
      selectorOrLocator,
      options?.actionDescription ?? `Fill "${text}"`,
      async () => {
        await locator.fill(text, {
          timeout: options?.timeout ?? config.DEFAULT_TIMEOUT_MS,
          force: options?.force,
          noWaitAfter: options?.noWaitAfter,
        });
      }
    );
  }

  /**
   * Clear and fill wrapper - selects all existing input content before typing
   */
  public async clearAndFill(
    selectorOrLocator: string | Locator,
    text: string,
    options?: FillOptions
  ): Promise<void> {
    const locator = this.resolveLocator(selectorOrLocator);
    await this.executeAction(
      'clearAndFill',
      selectorOrLocator,
      options?.actionDescription ?? `Clear & Fill "${text}"`,
      async () => {
        await locator.click({ timeout: options?.timeout ?? config.DEFAULT_TIMEOUT_MS });
        await this.page.keyboard.press('Control+A');
        await locator.fill(text, {
          timeout: options?.timeout ?? config.DEFAULT_TIMEOUT_MS,
          force: options?.force,
        });
      }
    );
  }

  /**
   * Resilient getText wrapper
   */
  public async getText(
    selectorOrLocator: string | Locator,
    options?: { timeout?: number; actionDescription?: string }
  ): Promise<string> {
    const locator = this.resolveLocator(selectorOrLocator);
    return await this.executeAction(
      'getText',
      selectorOrLocator,
      options?.actionDescription,
      async () => {
        await locator.waitFor({
          state: 'visible',
          timeout: options?.timeout ?? config.DEFAULT_TIMEOUT_MS,
        });
        return (await locator.innerText()).trim();
      }
    );
  }

  /**
   * Resilient getInputValue wrapper
   */
  public async getInputValue(
    selectorOrLocator: string | Locator,
    options?: { timeout?: number; actionDescription?: string }
  ): Promise<string> {
    const locator = this.resolveLocator(selectorOrLocator);
    return await this.executeAction(
      'getInputValue',
      selectorOrLocator,
      options?.actionDescription,
      async () => {
        return (
          await locator.inputValue({ timeout: options?.timeout ?? config.DEFAULT_TIMEOUT_MS })
        ).trim();
      }
    );
  }

  /**
   * Check if element is visible without throwing on timeout
   */
  public async isVisible(
    selectorOrLocator: string | Locator,
    options?: { timeout?: number }
  ): Promise<boolean> {
    const locator = this.resolveLocator(selectorOrLocator);
    try {
      return await locator.isVisible({ timeout: options?.timeout ?? 3000 });
    } catch {
      return false;
    }
  }

  /**
   * Explicit wait for element state (visible, attached, hidden, detached).
   * Overloaded to accept both (selector, state?, timeoutMs?) and (selector, options?: WaitForElementOptions).
   * Strictly avoids page.waitForTimeout!
   */
  public async waitForElement(
    selectorOrLocator: string | Locator,
    stateOrOptions?: 'attached' | 'detached' | 'visible' | 'hidden' | WaitForElementOptions,
    timeoutMs?: number
  ): Promise<Locator> {
    let state: 'attached' | 'detached' | 'visible' | 'hidden' = 'visible';
    let timeout = timeoutMs ?? config.DEFAULT_TIMEOUT_MS;
    let actionDescription: string | undefined = undefined;

    if (typeof stateOrOptions === 'string') {
      state = stateOrOptions;
    } else if (stateOrOptions && typeof stateOrOptions === 'object') {
      if (stateOrOptions.state) state = stateOrOptions.state;
      if (stateOrOptions.timeout !== undefined) timeout = stateOrOptions.timeout;
      if (stateOrOptions.actionDescription) actionDescription = stateOrOptions.actionDescription;
    }

    const locator = this.resolveLocator(selectorOrLocator);
    return await this.executeAction(
      'waitForElement',
      selectorOrLocator,
      actionDescription,
      async () => {
        await locator.waitFor({
          state,
          timeout,
        });
        return locator;
      }
    );
  }

  /**
   * Explicit wait for page load state
   */
  public async waitForLoadState(
    state: 'load' | 'domcontentloaded' | 'networkidle' = 'domcontentloaded',
    options?: { timeout?: number }
  ): Promise<void> {
    await this.page.waitForLoadState(state, {
      timeout: options?.timeout ?? config.DEFAULT_TIMEOUT_MS,
    });
  }

  /**
   * Hover over element
   */
  public async hover(selectorOrLocator: string | Locator, options?: ActionOptions): Promise<void> {
    const locator = this.resolveLocator(selectorOrLocator);
    await this.executeAction('hover', selectorOrLocator, options?.actionDescription, async () => {
      await locator.hover({
        timeout: options?.timeout ?? config.DEFAULT_TIMEOUT_MS,
        force: options?.force,
      });
    });
  }

  /**
   * Press key on element
   */
  public async pressKey(
    selectorOrLocator: string | Locator,
    key: string,
    options?: ActionOptions
  ): Promise<void> {
    const locator = this.resolveLocator(selectorOrLocator);
    await this.executeAction(
      'pressKey',
      selectorOrLocator,
      options?.actionDescription ?? `Press "${key}"`,
      async () => {
        await locator.press(key, {
          timeout: options?.timeout ?? config.DEFAULT_TIMEOUT_MS,
        });
      }
    );
  }

  /**
   * Capture screenshot to Buffer and optional file
   */
  public async takeScreenshot(name: string, options?: ScreenshotOptions): Promise<Buffer> {
    const sanitizedName = name.replace(/[^a-zA-Z0-9_-]/g, '_');
    const screenshotPath =
      options?.path ??
      path.resolve(process.cwd(), 'reports', 'screenshots', `${sanitizedName}.png`);

    const dir = path.dirname(screenshotPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const buffer = await this.page.screenshot({
      fullPage: options?.fullPage ?? true,
      path: screenshotPath,
    });

    return buffer;
  }

  /**
   * Dismiss live site consent overlays (Google CMP, cookie banners)
   */
  public async dismissConsentModal(): Promise<boolean> {
    const consentSelectors = [
      'button:has-text("Consent")',
      'button:has-text("Accept All")',
      'button:has-text("I Agree")',
      'button.fc-cta-consent',
      '#cmpbox button.cmpboxbtn',
      'button[aria-label="Consent"]',
      '.fc-dialog-overlay button.fc-cta-consent',
    ];

    for (const sel of consentSelectors) {
      try {
        const btn = this.page.locator(sel).first();
        if (await btn.isVisible({ timeout: 1500 })) {
          await btn.click({ timeout: 2000 });
          await btn.waitFor({ state: 'detached', timeout: 3000 }).catch(() => {});
          return true;
        }
      } catch {
        // continue search across alternatives
      }
    }
    return false;
  }

  public async dismissConsentOverlay(): Promise<boolean> {
    return this.dismissConsentModal();
  }

  protected resolveLocator(selectorOrLocator: string | Locator): Locator {
    return typeof selectorOrLocator === 'string'
      ? this.page.locator(selectorOrLocator)
      : selectorOrLocator;
  }

  protected getLocatorDescription(selectorOrLocator: string | Locator): string {
    return typeof selectorOrLocator === 'string' ? selectorOrLocator : selectorOrLocator.toString();
  }

  protected async executeAction<T>(
    actionName: string,
    target: string | Locator,
    intent: string | undefined,
    action: () => Promise<T>
  ): Promise<T> {
    try {
      return await action();
    } catch (err) {
      throw await this.enrichError(actionName, target, err, intent);
    }
  }

  protected async enrichError(
    actionName: string,
    target: string | Locator,
    err: unknown,
    intent?: string
  ): Promise<PageActionError> {
    const targetStr = this.getLocatorDescription(target);
    const currentUrl = this.page.url();
    let currentTitle = 'unknown';
    try {
      currentTitle = await this.page.title();
    } catch {
      // ignore secondary title retrieval error
    }

    const originalError = err instanceof Error ? err : new Error(String(err));
    const message = [
      `[BasePage.${actionName}] Action failed on target: ${targetStr}`,
      intent ? `Intent: ${intent}` : null,
      `URL: ${currentUrl}`,
      `Title: ${currentTitle}`,
      `Original error: ${originalError.message}`,
    ]
      .filter(Boolean)
      .join(' | ');

    return new PageActionError(message, {
      action: actionName,
      target: targetStr,
      intent,
      url: currentUrl,
      title: currentTitle,
      originalError,
    });
  }
}

export default BasePage;
