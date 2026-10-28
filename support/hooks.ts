/**
 * Cucumber Lifecycle Hooks
 * Location: support/hooks.ts
 */

import {
  Before,
  After,
  BeforeAll,
  AfterAll,
  Status,
  setDefaultTimeout,
  ITestCaseHookParameter,
} from '@cucumber/cucumber';
import { chromium } from '@playwright/test';
import type { Server } from 'http';
import { CustomWorld } from './world';
import { captureAndAttachScreenshot } from './evidence';
import { ApiClient } from '../clients/ApiClient';
import { createApp } from '../api/src/app';
import { getRepositories } from '../api/src/repositories';
import config from '../config/env';

// Set default timeout for all Cucumber steps and hooks
setDefaultTimeout(config.DEFAULT_TIMEOUT_MS);

// Module-level references for test-run wide resources
let localApiServer: Server | null = null;
let serverStartedByHooks = false;

/**
 * Health probe checking if an external API server is already responding.
 */
async function isApiServerReachable(baseUrl: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 600);
    const healthUrl = new URL('health', baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`).toString();
    const response = await fetch(healthUrl, { signal: controller.signal });
    clearTimeout(timeoutId);
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Suite-level setup: Ensure Express API server is active on config.API_PORT.
 */
BeforeAll(async function () {
  const isReachable = await isApiServerReachable(config.API_BASE_URL);
  if (isReachable) {
    console.log(`[Hooks:BeforeAll] External API server detected at ${config.API_BASE_URL}.`);
    return;
  }

  console.log(
    `[Hooks:BeforeAll] Booting in-process Express server on ${config.API_HOST}:${config.API_PORT}...`
  );
  const app = createApp(getRepositories());

  await new Promise<void>((resolve, reject) => {
    const server = app.listen(config.API_PORT, config.API_HOST, () => {
      localApiServer = server;
      serverStartedByHooks = true;
      console.log(
        `[Hooks:BeforeAll] Express API server listening on ${config.API_HOST}:${config.API_PORT}`
      );
      resolve();
    });

    server.on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        console.warn(`[Hooks:BeforeAll] Port ${config.API_PORT} in use; reusing existing process.`);
        resolve();
      } else {
        reject(err);
      }
    });
  });
});

/**
 * Suite-level teardown: Gracefully close local Express server if started by BeforeAll.
 */
AfterAll(async function () {
  if (serverStartedByHooks && localApiServer) {
    console.log('[Hooks:AfterAll] Shutting down local Express API server...');
    await new Promise<void>((resolve, reject) => {
      localApiServer!.close(err => {
        if (err) {
          console.error('[Hooks:AfterAll] Error shutting down server:', err);
          reject(err);
        } else {
          console.log('[Hooks:AfterAll] Express API server stopped cleanly.');
          resolve();
        }
      });
    });
    localApiServer = null;
    serverStartedByHooks = false;
  }
});

/**
 * Scenario-level setup: Initialize scenario state and Playwright browser if tagged @ui.
 */
Before(async function (this: CustomWorld, scenario: ITestCaseHookParameter) {
  // 1. Reset scenario data containers
  this.testData = new Map<string, unknown>();
  this.lastResponse = undefined;

  // 2. Refresh ApiClient with fresh base configuration
  this.apiClient = new ApiClient({
    baseURL: config.API_BASE_URL,
    timeout: config.DEFAULT_TIMEOUT_MS,
  });

  // 3. Inspect tags on pickle
  const tags = scenario.pickle.tags.map(t => t.name);
  const isUi = tags.includes('@ui');

  // 4. If @ui scenario, launch Playwright browser, context, and page
  if (isUi) {
    this.browser = await chromium.launch({
      headless: config.HEADLESS,
      slowMo: config.SLOW_MO,
    });

    this.context = await this.browser.newContext({
      viewport: { width: 1280, height: 720 },
      ignoreHTTPSErrors: true,
      baseURL: config.EMI_BASE_URL,
    });

    // Polite automation: abort ad and analytics domains
    if (config.BLOCKED_HOSTS && config.BLOCKED_HOSTS.length > 0) {
      const blockedList = config.BLOCKED_HOSTS.map(h => h.trim().toLowerCase()).filter(Boolean);
      if (blockedList.length > 0) {
        await this.context.route(
          (url: URL) => blockedList.some(blocked => url.hostname.toLowerCase().includes(blocked)),
          route => route.abort()
        );
      }
    }

    this.page = await this.context.newPage();
    this.page.setDefaultTimeout(config.DEFAULT_TIMEOUT_MS);
  }
});

/**
 * Scenario-level teardown: Capture screenshot on failure, then clean up handles.
 */
After(async function (this: CustomWorld, scenario: ITestCaseHookParameter) {
  try {
    // Failure screenshot attachment for UI scenarios
    if (this.page) {
      if (scenario.result?.status === Status.FAILED) {
        try {
          const isUi = scenario.pickle.tags.some(t => t.name === '@ui');
          const suite = isUi ? 'ui' : 'smoke';
          const scenarioName = scenario.pickle.name.replace(/[^a-zA-Z0-9_-]/g, '_');
          await captureAndAttachScreenshot(this, `failure_${scenarioName}`, { suite });
        } catch (err) {
          console.error('[Hooks:After] Failed to capture failure screenshot:', err);
        }
      }
    }
  } finally {
    // Teardown UI automation handles in reverse dependency order
    if (this.page) {
      await this.page.close().catch(() => {});
      this.page = undefined;
    }
    if (this.context) {
      await this.context.close().catch(() => {});
      this.context = undefined;
    }
    if (this.browser) {
      await this.browser.close().catch(() => {});
      this.browser = undefined;
    }

    // Dispose API client context if applicable
    if (this.apiClient) {
      await this.apiClient.dispose().catch(() => {});
    }
  }
});
