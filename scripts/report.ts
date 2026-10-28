/**
 * Consolidated HTML Report Generator
 * Tool: multiple-cucumber-html-reporter
 * Location: scripts/report.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import report from 'multiple-cucumber-html-reporter';
import config from '../config/env';

interface CucumberStepResult {
  status: string;
  duration?: number;
  error_message?: string;
}

interface CucumberStep {
  keyword: string;
  name?: string;
  hidden?: boolean;
  result?: CucumberStepResult;
  embeddings?: Array<{ data: string; mime_type: string }>;
}

interface CucumberScenario {
  id: string;
  name: string;
  keyword: string;
  type: string;
  steps: CucumberStep[];
  tags?: Array<{ name: string; line: number }>;
}

interface CucumberFeature {
  id: string;
  name: string;
  keyword: string;
  uri: string;
  elements: CucumberScenario[];
  tags?: Array<{ name: string; line: number }>;
  metadata?: Record<string, unknown>;
}

interface SuiteStatistics {
  totalFeatures: number;
  totalScenarios: number;
  passedScenarios: number;
  failedScenarios: number;
  skippedScenarios: number;
  totalSteps: number;
  passedSteps: number;
  failedSteps: number;
  skippedSteps: number;
  durationMs: number;
}

/**
 * Sanitize base URLs to ensure credentials/tokens are never exposed in reports.
 */
function sanitizeUrl(urlString: string): string {
  try {
    const parsed = new URL(urlString);
    parsed.username = '';
    parsed.password = '';
    parsed.search = '';
    return parsed.toString();
  } catch {
    return urlString;
  }
}

/**
 * Discover and parse all valid Cucumber JSON files in reports/.
 */
function discoverCucumberJsonFiles(
  reportsDir: string
): { filePath: string; features: CucumberFeature[] }[] {
  if (!fs.existsSync(reportsDir)) {
    return [];
  }

  const entries = fs.readdirSync(reportsDir);
  const discovered: { filePath: string; features: CucumberFeature[] }[] = [];

  for (const entry of entries) {
    const fullPath = path.join(reportsDir, entry);
    const stat = fs.statSync(fullPath);

    if (stat.isFile() && entry.endsWith('.json')) {
      // Exclude internal reporter dumps
      if (entry === 'merged-output.json' || entry === 'enriched-output.json') {
        continue;
      }

      try {
        const rawContent = fs.readFileSync(fullPath, 'utf8').trim();
        if (!rawContent || rawContent === '[]') {
          continue;
        }

        const parsed = JSON.parse(rawContent) as unknown;
        if (Array.isArray(parsed) && parsed.length > 0) {
          const isCucumberArray = parsed.some(
            (item: Record<string, unknown>) =>
              typeof item === 'object' &&
              item !== null &&
              ('elements' in item || item['keyword'] === 'Feature')
          );
          if (isCucumberArray) {
            discovered.push({ filePath: fullPath, features: parsed as CucumberFeature[] });
          }
        }
      } catch (err) {
        console.warn(`[Report] Skipped invalid JSON file ${entry}:`, (err as Error).message);
      }
    }
  }

  // Also inspect reports/cucumber-json/ if present
  const subJsonDir = path.join(reportsDir, 'cucumber-json');
  if (fs.existsSync(subJsonDir)) {
    const subEntries = fs.readdirSync(subJsonDir);
    for (const entry of subEntries) {
      if (entry.endsWith('.json')) {
        const fullPath = path.join(subJsonDir, entry);
        try {
          const raw = fs.readFileSync(fullPath, 'utf8').trim();
          if (!raw || raw === '[]') {
            continue;
          }
          const parsed = JSON.parse(raw) as unknown;
          if (Array.isArray(parsed) && parsed.length > 0) {
            const isCucumberArray = parsed.some(
              (item: Record<string, unknown>) =>
                typeof item === 'object' &&
                item !== null &&
                ('elements' in item || item['keyword'] === 'Feature')
            );
            if (isCucumberArray) {
              discovered.push({ filePath: fullPath, features: parsed as CucumberFeature[] });
            }
          }
        } catch {
          // ignore
        }
      }
    }
  }

  return discovered;
}

/**
 * Deduplicate features by unique URI across separate JSON files.
 * If both cucumber-report.json and a specific suite JSON contain the same feature,
 * the specific suite file takes precedence.
 */
function deduplicateFeatures(
  discoveredFiles: { filePath: string; features: CucumberFeature[] }[]
): CucumberFeature[] {
  const featureMap = new Map<string, CucumberFeature>();

  // Sort files so specific suite files (e.g. cucumber-smoke.json) override cucumber-report.json
  const sorted = [...discoveredFiles].sort((a, b) => {
    const aIsGeneric = a.filePath.includes('cucumber-report.json');
    const bIsGeneric = b.filePath.includes('cucumber-report.json');
    if (aIsGeneric && !bIsGeneric) return -1;
    if (!aIsGeneric && bIsGeneric) return 1;
    return 0;
  });

  for (const item of sorted) {
    for (const feat of item.features) {
      const normalizedUri = feat.uri.replace(/\\/g, '/');
      const key = `${normalizedUri}::${feat.id}`;
      featureMap.set(key, feat);
    }
  }

  return Array.from(featureMap.values());
}

/**
 * Compute aggregate execution statistics across all features and scenarios.
 */
export function calculateStatistics(features: CucumberFeature[]): SuiteStatistics {
  const stats: SuiteStatistics = {
    totalFeatures: features.length,
    totalScenarios: 0,
    passedScenarios: 0,
    failedScenarios: 0,
    skippedScenarios: 0,
    totalSteps: 0,
    passedSteps: 0,
    failedSteps: 0,
    skippedSteps: 0,
    durationMs: 0,
  };

  for (const feature of features) {
    for (const scenario of feature.elements || []) {
      stats.totalScenarios++;
      let scenarioFailed = false;
      let scenarioSkipped = false;

      for (const step of scenario.steps || []) {
        const status = step.result?.status?.toLowerCase();
        if (status === 'failed') {
          scenarioFailed = true;
        }

        if (step.hidden || step.keyword === 'Before' || step.keyword === 'After') {
          continue;
        }

        stats.totalSteps++;
        const durationNs = step.result?.duration || 0;
        stats.durationMs += Math.round(durationNs / 1000000);

        if (status === 'passed') {
          stats.passedSteps++;
        } else if (status === 'failed') {
          stats.failedSteps++;
        } else if (status === 'skipped' || status === 'pending') {
          stats.skippedSteps++;
          scenarioSkipped = true;
        } else {
          stats.skippedSteps++;
          scenarioSkipped = true;
        }
      }

      if (scenarioFailed) {
        stats.failedScenarios++;
      } else if (scenarioSkipped) {
        stats.skippedScenarios++;
      } else {
        stats.passedScenarios++;
      }
    }
  }

  return stats;
}

/**
 * Generate formatted reports/run-summary.txt execution log.
 */
function writeRunSummaryTxt(
  reportsDir: string,
  stats: SuiteStatistics,
  executionTime: string
): void {
  const summaryPath = path.join(reportsDir, 'run-summary.txt');
  const platform = `${os.type()} ${os.release()} (${os.arch()})`;
  const statusString = stats.failedScenarios === 0 ? 'ALL PASSED' : 'SOME FAILED';

  const content = [
    '================================================================================',
    '                 STREAMHUB QA AUTOMATION — TEST RUN SUMMARY                     ',
    '================================================================================',
    `Timestamp:         ${executionTime}`,
    `Node Version:      ${process.version}`,
    `Platform:          ${platform}`,
    `Browser Engine:    Chromium (Playwright)`,
    `Environment:       ${process.env.CI ? 'CI (GitHub Actions)' : 'Local Development'}`,
    `Execution Status:  ${statusString}`,
    '--------------------------------------------------------------------------------',
    'EXECUTION METRICS:',
    `  Total Features:   ${stats.totalFeatures}`,
    `  Total Scenarios:  ${stats.totalScenarios}`,
    `    - Passed:       ${stats.passedScenarios}`,
    `    - Failed:       ${stats.failedScenarios}`,
    `    - Skipped:      ${stats.skippedScenarios}`,
    `  Total Steps:      ${stats.totalSteps}`,
    `    - Passed:       ${stats.passedSteps}`,
    `    - Failed:       ${stats.failedSteps}`,
    `    - Skipped:      ${stats.skippedSteps}`,
    `  Total Duration:   ${(stats.durationMs / 1000).toFixed(2)}s`,
    '--------------------------------------------------------------------------------',
    'REPORTS GENERATED:',
    `  Consolidated HTML: ${path.resolve(reportsDir, 'html', 'index.html')}`,
    '================================================================================',
    '',
  ].join('\n');

  fs.writeFileSync(summaryPath, content, 'utf8');
  console.log(`[Report] Run summary saved to ${summaryPath}`);
}

/**
 * Main execution entry point.
 */
export async function generateReport(): Promise<void> {
  const reportsDir = path.resolve(process.cwd(), 'reports');
  const htmlOutputDir = path.resolve(reportsDir, 'html');
  const stagingDir = path.resolve(reportsDir, '.cucumber-staging');

  console.log('[Report] Scanning for Cucumber JSON reports in:', reportsDir);
  const discoveredFiles = discoverCucumberJsonFiles(reportsDir);

  if (discoveredFiles.length === 0) {
    console.error(
      '\x1b[31m[Report:Error] No valid Cucumber JSON reports found in reports/.\x1b[0m\n' +
        'Please run a test suite first (e.g. "npm run test:smoke" or "npm run test:all") ' +
        'to generate execution JSON before running "npm run report".'
    );
    process.exit(1);
  }

  const features = deduplicateFeatures(discoveredFiles);
  console.log(
    `[Report] Discovered ${discoveredFiles.length} file(s), consolidated into ${features.length} unique feature(s).`
  );

  // Stage clean JSON array in dedicated directory for multiple-cucumber-html-reporter
  if (fs.existsSync(stagingDir)) {
    fs.rmSync(stagingDir, { recursive: true, force: true });
  }
  fs.mkdirSync(stagingDir, { recursive: true });
  const stagedJsonPath = path.join(stagingDir, 'consolidated-cucumber-report.json');
  fs.writeFileSync(stagedJsonPath, JSON.stringify(features, null, 2), 'utf8');

  // Map OS to reporter supported platform names: windows | osx | linux | ubuntu | android | ios
  const platformName =
    os.platform() === 'win32' ? 'windows' : os.platform() === 'darwin' ? 'osx' : 'linux';

  const executionTime = new Date().toISOString();

  try {
    report.generate({
      jsonDir: stagingDir,
      reportPath: htmlOutputDir,
      pageTitle: 'Streamhub QA Automation Assessment — Test Execution Report',
      reportName: 'Streamhub QA Automation Report (Section B)',
      pageFooter:
        '<div style="text-align: center; padding: 12px; color: #73879C; font-size: 13px;">' +
        'Streamhub Fullstack + QA Automation Assessment &bull; Section B SDET Execution &bull; Generated via multiple-cucumber-html-reporter' +
        '</div>',
      displayDuration: true,
      durationInMS: false,
      displayReportTime: true,
      openReportInBrowser: false,
      saveCollectedJSON: false,
      disableLog: false,
      metadata: {
        browser: {
          name: 'chrome',
          version: '128.0 (Chromium)',
        },
        device: process.env.CI ? 'CI Worker (GitHub Actions)' : 'Local Developer Workstation',
        platform: {
          name: platformName,
          version: os.release(),
        },
      },
      customData: {
        title: 'Run Information & Environment',
        data: [
          { label: 'Project', value: 'Streamhub QA Automation Assessment' },
          { label: 'Module', value: 'Section B (BDD Playwright Framework)' },
          { label: 'Environment', value: process.env.CI ? 'CI (GitHub Actions)' : 'Local' },
          { label: 'Node Version', value: process.version },
          { label: 'Platform / OS', value: `${os.type()} ${os.release()} (${os.arch()})` },
          { label: 'API Base URL', value: sanitizeUrl(config.API_BASE_URL) },
          { label: 'EMI Base URL', value: sanitizeUrl(config.EMI_BASE_URL) },
          { label: 'Headless Mode', value: String(config.HEADLESS) },
          { label: 'Execution Time', value: executionTime },
        ],
      },
    });

    const stats = calculateStatistics(features);
    writeRunSummaryTxt(reportsDir, stats, executionTime);

    console.log(
      '\x1b[32m[Report:Success] Consolidated HTML report generated at:\x1b[0m\n' +
        `  ${path.join(htmlOutputDir, 'index.html')}\n`
    );
  } finally {
    // Clean up temporary staging directory
    if (fs.existsSync(stagingDir)) {
      fs.rmSync(stagingDir, { recursive: true, force: true });
    }
  }
}

// Execute when invoked directly
if (
  process.argv[1]?.includes('report') ||
  process.argv[1]?.endsWith('report.ts') ||
  process.argv[1]?.endsWith('report.js')
) {
  generateReport().catch(err => {
    console.error('[Report:FatalError]', err);
    process.exit(1);
  });
}
