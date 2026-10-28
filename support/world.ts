/**
 * Custom Cucumber World Implementation
 * Location: support/world.ts
 */

import { World, IWorldOptions, setWorldConstructor } from '@cucumber/cucumber';
import type { Browser, BrowserContext, Page, APIRequestContext } from '@playwright/test';
import type { Database } from 'better-sqlite3';
import { ApiClient, ApiResponse } from '../clients/ApiClient';
import config from '../config/env';

/**
 * CustomWorld extends Cucumber's base World to provide strongly typed,
 * scenario-scoped execution context for Playwright browser automation,
 * REST API client testing, in-memory test data persistence, and SQL database access.
 */
export class CustomWorld extends World {
  // Playwright UI automation handles (initialized in Before hook for @ui scenarios)
  public page?: Page;
  public browser?: Browser;
  public context?: BrowserContext;

  // Playwright API request context (optional handle for direct HTTP manipulation)
  public apiRequestContext?: APIRequestContext;

  // Strongly-typed API client wrapper (initialized for every scenario)
  public apiClient: ApiClient;

  // In-memory key-value map for sharing scenario state between steps
  public testData: Map<string, unknown>;

  // Captured HTTP response from last API step definition
  public lastResponse?: ApiResponse<unknown>;

  // Optional SQLite connection handle for SQL verification steps (@sql)
  public db?: Database;

  /**
   * Constructs CustomWorld with Cucumber runtime options.
   * Satisfies strictPropertyInitialization by initializing apiClient and testData.
   */
  constructor(options: IWorldOptions) {
    super(options);
    this.testData = new Map<string, unknown>();
    this.apiClient = new ApiClient({
      baseURL: config.API_BASE_URL,
      timeout: config.DEFAULT_TIMEOUT_MS,
    });
  }

  /**
   * Type-safe setter for scenario test data.
   */
  public setTestData<T>(key: string, value: T): void {
    this.testData.set(key, value);
  }

  /**
   * Type-safe getter for scenario test data.
   * Throws an explicit descriptive error if the key is missing.
   */
  public getTestData<T>(key: string): T {
    if (!this.testData.has(key)) {
      throw new Error(
        `[CustomWorld] Requested testData key "${key}" was not set in current scenario context.`
      );
    }
    return this.testData.get(key) as T;
  }

  /**
   * Check if a key exists in scenario test data.
   */
  public hasTestData(key: string): boolean {
    return this.testData.has(key);
  }

  /**
   * Attach a PNG screenshot buffer to the Cucumber report.
   * Flexible signature supporting (buffer, name?) or (name, buffer).
   */
  public attachScreenshot(bufferOrName: Buffer | string, nameOrBuffer?: string | Buffer): void {
    if (Buffer.isBuffer(bufferOrName)) {
      const buffer = bufferOrName;
      const isMime = typeof nameOrBuffer === 'string' && nameOrBuffer.includes('/');
      const mediaType = isMime ? nameOrBuffer : 'image/png';
      const fileName = isMime
        ? 'screenshot.png'
        : typeof nameOrBuffer === 'string'
          ? nameOrBuffer
          : 'screenshot.png';
      this.attach(buffer, { mediaType, fileName });
    } else {
      const name = bufferOrName;
      const buffer = nameOrBuffer as Buffer;
      this.attach(buffer, { mediaType: 'image/png', fileName: name });
    }
  }

  /**
   * Attach formatted JSON payload or object to the Cucumber report.
   * Flexible signature supporting (obj, name?) or (name, obj).
   */
  public attachJson(dataOrName: unknown, nameOrData?: string | unknown): void {
    if (
      typeof dataOrName === 'string' &&
      nameOrData !== undefined &&
      typeof nameOrData !== 'string'
    ) {
      const name = dataOrName;
      const formatted = JSON.stringify(nameOrData, null, 2);
      this.attach(formatted, { mediaType: 'application/json', fileName: name });
    } else {
      const formatted =
        typeof dataOrName === 'string' ? dataOrName : JSON.stringify(dataOrName, null, 2);
      const name = typeof nameOrData === 'string' ? nameOrData : 'data.json';
      this.attach(formatted, { mediaType: 'application/json', fileName: name });
    }
  }

  /**
   * Attach plain text to the Cucumber report.
   */
  public attachText(text: string, name = 'log.txt'): void {
    this.attach(text, { mediaType: 'text/plain', fileName: name });
  }
}

// Register CustomWorld as the World constructor for all Cucumber scenarios
setWorldConstructor(CustomWorld);
export default CustomWorld;
