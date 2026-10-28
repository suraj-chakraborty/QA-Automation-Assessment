import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load environment variables from .env file into process.env if present
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

/**
 * Standard list of ad and analytics network host substrings to abort
 * during browser navigation (polite automation for live site).
 */
export const DEFAULT_BLOCKED_HOSTS: readonly string[] = [
  'doubleclick.net',
  'googlesyndication.com',
  'google-analytics.com',
  'googletagmanager.com',
  'adnxs.com',
  'amazon-adsystem.com',
  'smartadserver.com',
  'scorecardresearch.com',
] as const;

/**
 * Helper to parse boolean strings ('true'/'false', '1'/'0')
 */
const booleanSchema = (defaultValue = true) =>
  z
    .string()
    .optional()
    .transform(val => {
      if (val === undefined || val.trim() === '') return defaultValue;
      const lower = val.trim().toLowerCase();
      return lower === 'true' || lower === '1';
    });

/**
 * Helper to parse integer strings with boundaries
 */
const integerSchema = (defaultValue: number, min?: number, max?: number) =>
  z
    .string()
    .optional()
    .transform((val, ctx) => {
      if (val === undefined || val.trim() === '') return defaultValue;
      const trimmed = val.trim();
      const num = Number(trimmed);
      if (!/^-?\d+$/.test(trimmed) || !Number.isSafeInteger(num)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Must be a valid integer',
        });
        return z.NEVER;
      }
      if (min !== undefined && num < min) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Must be an integer >= ${min}`,
        });
        return z.NEVER;
      }
      if (max !== undefined && num > max) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Must be an integer <= ${max}`,
        });
        return z.NEVER;
      }
      return num;
    });

/**
 * Helper to parse port strings (1-65535) with alias fallback
 */
const portSchema = (fallbackEnvKey?: 'PORT' | 'API_PORT') =>
  z
    .string()
    .optional()
    .transform((val, ctx) => {
      const portStr =
        val !== undefined && val.trim() !== ''
          ? val.trim()
          : fallbackEnvKey &&
              process.env[fallbackEnvKey] !== undefined &&
              process.env[fallbackEnvKey]!.trim() !== ''
            ? process.env[fallbackEnvKey]!.trim()
            : '3100';

      const num = Number(portStr);
      if (!/^\d+$/.test(portStr) || !Number.isSafeInteger(num) || num < 1 || num > 65535) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Port must be an integer between 1 and 65535',
        });
        return z.NEVER;
      }
      return num;
    });

/**
 * Helper to parse comma-separated string lists
 */
const commaSeparatedListSchema = (defaultList: readonly string[] = DEFAULT_BLOCKED_HOSTS) =>
  z
    .string()
    .optional()
    .transform(val => {
      if (!val || val.trim() === '') return [...defaultList];
      return val
        .split(',')
        .map(item => item.trim())
        .filter(item => item.length > 0);
    });

/**
 * Helper for URL validation with guaranteed trailing slash
 */
const urlSchema = (defaultUrl: string) =>
  z
    .string()
    .url()
    .optional()
    .default(defaultUrl)
    .transform(url => (url.endsWith('/') ? url : `${url}/`));

/**
 * Raw environment schema mapping process.env strings
 */
const rawEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  // API Host & Port (with dual alias synchronization)
  API_HOST: z.string().default('127.0.0.1'),
  API_PORT: portSchema('PORT'),
  PORT: portSchema('API_PORT'),

  // Base URLs
  API_BASE_URL: z.string().url().default('http://127.0.0.1:3100'),
  EMI_BASE_URL: urlSchema('https://emicalculator.net/'),

  // Playwright & Browser Config
  HEADLESS: booleanSchema(true),
  SLOW_MO: integerSchema(0, 0),
  DEFAULT_TIMEOUT_MS: integerSchema(15000, 1000),

  // Concurrency Limits
  UI_PARALLEL: integerSchema(2, 1, 10),
  API_PARALLEL: integerSchema(4, 1, 20),

  // Network Route Abort Hosts
  BLOCKED_HOSTS: commaSeparatedListSchema(DEFAULT_BLOCKED_HOSTS),

  // Database Path (SQLite) with dual aliases (canonical default: data/streamhub.db)
  SQLITE_PATH: z
    .string()
    .optional()
    .default('data/streamhub.db')
    .transform(val => (val && val.trim().length > 0 ? val.trim() : 'data/streamhub.db')),
  DB_PATH: z
    .string()
    .optional()
    .default('data/streamhub.db')
    .transform(val => (val && val.trim().length > 0 ? val.trim() : 'data/streamhub.db')),

  // AI Self-Healing Engine
  HEAL_PROVIDER: z.enum(['mock', 'gemini', 'anthropic']).default('mock'),
  HEAL_API_KEY: z.string().optional().default(''),
});

export type EnvConfig = z.infer<typeof rawEnvSchema>;

function parseConfig(): EnvConfig {
  const result = rawEnvSchema.safeParse(process.env);

  if (!result.success) {
    const errorDetails = result.error.issues
      .map(issue => `  - [${issue.path.join('.')}] ${issue.message}`)
      .join('\n');

    console.error('\n❌ Fatal: Invalid Environment Configuration:');
    console.error(errorDetails);
    console.error('\nPlease verify your .env file against .env.example.\n');
    process.exit(1);
  }

  const data = result.data;
  const canonicalPort = data.API_PORT || data.PORT || 3100;
  data.API_PORT = canonicalPort;
  data.PORT = canonicalPort;

  // Harmonize SQLite database path aliases to a single canonical path
  const rawDbPath = process.env['DB_PATH']?.trim();
  const rawSqlitePath = process.env['SQLITE_PATH']?.trim();
  const canonicalDbPath = rawDbPath || rawSqlitePath || data.DB_PATH || 'data/streamhub.db';
  data.DB_PATH = canonicalDbPath;
  data.SQLITE_PATH = canonicalDbPath;

  if (!process.env['API_BASE_URL']) {
    data.API_BASE_URL = `http://${data.API_HOST}:${canonicalPort}`;
  }

  return data;
}

export const config: EnvConfig = parseConfig();
export const env = config;
export default config;
