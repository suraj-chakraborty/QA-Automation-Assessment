/**
 * Visual Evidence and Artifact Capture Helpers
 * Location: support/evidence.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import type { CustomWorld } from './world';

export interface ScreenshotOptions {
  suite?: string;
  name?: string;
  fullPage?: boolean;
}

export interface SavedScreenshot {
  buffer: Buffer;
  filePath: string;
  fileName: string;
}

/**
 * Capture full-page or element screenshot from Playwright Page,
 * save to disk under reports/<suite>/screenshots/, and attach to Cucumber World.
 */
export async function captureAndAttachScreenshot(
  world: CustomWorld,
  name: string,
  options?: { suite?: string; fullPage?: boolean }
): Promise<SavedScreenshot | undefined> {
  if (!world.page) {
    return undefined;
  }

  const suite = options?.suite || 'ui';
  const fullPage = options?.fullPage ?? true;
  const sanitizedName = name.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
  const timestamp = Date.now();
  const fileName = `${sanitizedName}_${timestamp}.png`;
  const screenshotsDir = path.resolve(process.cwd(), 'reports', suite, 'screenshots');
  const filePath = path.join(screenshotsDir, fileName);

  fs.mkdirSync(screenshotsDir, { recursive: true });
  const buffer = await world.page.screenshot({ fullPage, type: 'png' });
  await fs.promises.writeFile(filePath, buffer);

  // Attach directly to Cucumber World for embedding in HTML report
  world.attach(buffer, 'image/png');

  return { buffer, filePath, fileName };
}

/**
 * Attach JSON payload data to Cucumber World.
 */
export function attachJsonEvidence(world: CustomWorld, _name: string, data: unknown): void {
  if (typeof data === 'string') {
    world.attach(data, 'application/json');
    return;
  }
  if (data === undefined) {
    world.attach('null', 'application/json');
    return;
  }
  const seen = new WeakSet();
  try {
    const formatted = JSON.stringify(
      data,
      (_key, value) => {
        if (typeof value === 'bigint') return value.toString();
        if (typeof value === 'object' && value !== null) {
          if (seen.has(value)) return '[Circular]';
          seen.add(value);
        }
        return value;
      },
      2
    );
    world.attach(formatted ?? 'null', 'application/json');
  } catch {
    world.attach(String(data), 'text/plain');
  }
}

/**
 * Attach plain text log diagnostics to Cucumber World.
 */
export function attachTextEvidence(world: CustomWorld, _name: string, text: string): void {
  world.attach(text, 'text/plain');
}
