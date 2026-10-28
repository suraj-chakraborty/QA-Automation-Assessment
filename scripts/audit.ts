import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

interface AuditCheck {
  id: string;
  name: string;
  run: () => { pass: boolean; details: string };
}

const ROOT_DIR = process.cwd();

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

function log(msg: string): void {
  // eslint-disable-next-line no-console
  console.log(msg);
}

const checks: AuditCheck[] = [
  {
    id: 'AUD-01',
    name: 'README.md Documentation & Traceability Audit',
    run: () => {
      const readmePath = path.join(ROOT_DIR, 'README.md');
      if (!fs.existsSync(readmePath)) {
        return { pass: false, details: 'README.md file not found' };
      }
      const content = fs.readFileSync(readmePath, 'utf-8');
      const requiredSections = [
        '## 1. How to Run the Program',
        '## 2. Complete List of Commands',
        '## 3. API Routes & Endpoints',
        '## 4. Screenshots of Project Runs',
        '## 5. AI Assistant Reflection',
        '## 6. AI Self-Healing Locators Architecture',
      ];
      const missing = requiredSections.filter(s => !content.includes(s));
      if (missing.length > 0) {
        return {
          pass: false,
          details: `Missing required sections in README.md: ${missing.join(', ')}`,
        };
      }
      return {
        pass: true,
        details: 'All required sections verified and present in README.md',
      };
    },
  },
  {
    id: 'AUD-02',
    name: 'No Hardcoded URL Literals in Features/Steps/Pages/Clients/API',
    run: () => {
      const targetDirs = [
        path.join(ROOT_DIR, 'features'),
        path.join(ROOT_DIR, 'steps'),
        path.join(ROOT_DIR, 'pages'),
        path.join(ROOT_DIR, 'clients'),
        path.join(ROOT_DIR, 'api', 'src'),
      ];

      const urlPattern = /https?:\/\/[a-zA-Z0-9.-]+(:\d+)?/g;
      const violations: string[] = [];

      function scanDir(dir: string): void {
        if (!fs.existsSync(dir)) return;
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            scanDir(fullPath);
          } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.feature')) {
            const content = fs.readFileSync(fullPath, 'utf-8');
            const lines = content.split('\n');
            lines.forEach((line, idx) => {
              // Ignore comments
              const trimmed = line.trim();
              if (trimmed.startsWith('//') || trimmed.startsWith('#')) return;
              const matches = line.match(urlPattern);
              if (matches) {
                violations.push(
                  `${path.relative(ROOT_DIR, fullPath)}:${idx + 1} -> ${matches.join(', ')}`
                );
              }
            });
          }
        }
      }

      for (const d of targetDirs) {
        scanDir(d);
      }

      if (violations.length > 0) {
        return {
          pass: false,
          details: `Found hardcoded URLs:\n  ${violations.join('\n  ')}`,
        };
      }
      return {
        pass: true,
        details: 'Zero hardcoded URLs found in features, steps, pages, clients, and API code',
      };
    },
  },
  {
    id: 'AUD-03',
    name: 'No waitForTimeout or Brittle Selectors in Working Code',
    run: () => {
      const scanDirs = [
        path.join(ROOT_DIR, 'pages'),
        path.join(ROOT_DIR, 'steps'),
        path.join(ROOT_DIR, 'features'),
        path.join(ROOT_DIR, 'utils'),
        path.join(ROOT_DIR, 'support'),
      ];

      const violations: string[] = [];

      function scanDir(dir: string): void {
        if (!fs.existsSync(dir)) return;
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            scanDir(fullPath);
          } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.feature')) {
            // S11 intentionally broken files are exempt
            const rel = path.relative(ROOT_DIR, fullPath);
            if (rel.includes('SelfHealDemoPage') || rel.includes('self-heal-demo')) {
              continue;
            }

            const content = fs.readFileSync(fullPath, 'utf-8');
            const lines = content.split('\n');
            lines.forEach((line, idx) => {
              const trimmed = line.trim();
              if (trimmed.startsWith('//') || trimmed.startsWith('*')) return;

              if (line.includes('waitForTimeout(')) {
                violations.push(`waitForTimeout at ${rel}:${idx + 1}`);
              }
              if (line.includes(':nth-child')) {
                violations.push(`:nth-child at ${rel}:${idx + 1}`);
              }
              if (line.includes('xpath=/html')) {
                violations.push(`absolute xpath at ${rel}:${idx + 1}`);
              }
            });
          }
        }
      }

      for (const d of scanDirs) {
        scanDir(d);
      }

      if (violations.length > 0) {
        return {
          pass: false,
          details: `Brittle patterns detected in working code:\n  ${violations.join('\n  ')}`,
        };
      }
      return {
        pass: true,
        details: 'No waitForTimeout or brittle selectors found outside S11 self-heal files',
      };
    },
  },
  {
    id: 'AUD-04',
    name: 'Broken Locators Consistency (G4 / S11)',
    run: () => {
      const jsonPath = path.join(ROOT_DIR, 'healing', 'broken-locators.json');
      if (!fs.existsSync(jsonPath)) {
        return { pass: false, details: 'healing/broken-locators.json not found' };
      }
      const raw = fs.readFileSync(jsonPath, 'utf-8');
      const brokenList = JSON.parse(raw);

      if (!Array.isArray(brokenList) || brokenList.length < 3 || brokenList.length > 5) {
        return {
          pass: false,
          details: `broken-locators.json count (${brokenList.length}) is not between 3 and 5`,
        };
      }

      const demoPagePath = path.join(ROOT_DIR, 'pages', 'emi', 'SelfHealDemoPage.ts');
      if (!fs.existsSync(demoPagePath)) {
        return { pass: false, details: 'SelfHealDemoPage.ts not found' };
      }
      const demoContent = fs.readFileSync(demoPagePath, 'utf-8');

      for (const item of brokenList) {
        if (!demoContent.includes(item.id)) {
          return {
            pass: false,
            details: `Locator ID ${item.id} not found in SelfHealDemoPage.ts`,
          };
        }
      }

      return {
        pass: true,
        details: `Exactly ${brokenList.length} broken locators registered and matching in code`,
      };
    },
  },
  {
    id: 'AUD-05',
    name: 'Required Submission Deliverables & Artifacts',
    run: () => {
      const requiredFiles = [
        'README.md',
        '.env.example',
        'config/env.ts',
        'healing/heal.ts',
        'healing/broken-locators.json',
        'sql/schema.sql',
        'sql/queries/01_top_5_run_scorers.sql',
        'sql/queries/02_ipl_streaks.sql',
        'sql/queries/03_economy_under_pressure.sql',
        'sql/queries/04_impact_all_rounders.sql',
        'sql/queries/05_round_trip_transfers.sql',
        'sql/screenshots/01_top_5_run_scorers.png',
        'sql/screenshots/02_ipl_streaks.png',
        'sql/screenshots/03_economy_under_pressure.png',
        'sql/screenshots/04_impact_all_rounders.png',
        'sql/screenshots/05_round_trip_transfers.png',
        'reports/html/index.html',
        'reports/run-summary.txt',
        '.github/workflows/ci.yml',
      ];

      const missing: string[] = [];
      for (const f of requiredFiles) {
        if (!fs.existsSync(path.join(ROOT_DIR, f))) {
          missing.push(f);
        }
      }

      if (missing.length > 0) {
        return {
          pass: false,
          details: `Missing required deliverables:\n  ${missing.join('\n  ')}`,
        };
      }
      return {
        pass: true,
        details: `All ${requiredFiles.length} required deliverables, schemas, and reports exist`,
      };
    },
  },
  {
    id: 'AUD-06',
    name: 'Static Analysis & Quality Gates (Lint & Typecheck)',
    run: () => {
      try {
        execSync('npm run lint', { cwd: ROOT_DIR, stdio: 'pipe' });
      } catch (err: unknown) {
        const error = err as { stdout?: Buffer; stderr?: Buffer };
        return {
          pass: false,
          details: `ESLint failed:\n${error.stdout?.toString() || error.stderr?.toString()}`,
        };
      }

      try {
        execSync('npm run typecheck', { cwd: ROOT_DIR, stdio: 'pipe' });
      } catch (err: unknown) {
        const error = err as { stdout?: Buffer; stderr?: Buffer };
        return {
          pass: false,
          details: `Typecheck failed:\n${error.stdout?.toString() || error.stderr?.toString()}`,
        };
      }

      return {
        pass: true,
        details:
          'ESLint (zero warnings) and TypeScript strict typecheck (zero errors) passed clean',
      };
    },
  },
];

async function runAudit(): Promise<void> {
  log(`\n${colors.bold}${colors.cyan}=======================================================`);
  log('       STREAMHUB SECTION B AUTOMATION AUDIT           ');
  log(`=======================================================${colors.reset}\n`);

  let allPassed = true;

  for (const check of checks) {
    const result = check.run();
    if (result.pass) {
      log(
        `${colors.green}✔ [PASS]${colors.reset} ${colors.bold}${check.id}${colors.reset}: ${check.name}`
      );
      log(`   ${colors.cyan}↳ ${result.details}${colors.reset}\n`);
    } else {
      log(
        `${colors.red}✖ [FAIL]${colors.reset} ${colors.bold}${check.id}${colors.reset}: ${check.name}`
      );
      log(`   ${colors.yellow}↳ ${result.details}${colors.reset}\n`);
      allPassed = false;
    }
  }

  log(`${colors.cyan}-------------------------------------------------------${colors.reset}`);
  if (allPassed) {
    log(
      `${colors.bold}${colors.green}ALL AUDIT CHECKS PASSED SUCCESSFULLY (READY FOR RELEASE)!${colors.reset}\n`
    );
    process.exit(0);
  } else {
    log(
      `${colors.bold}${colors.red}AUDIT FAILED: Resolve the issues above before release.${colors.reset}\n`
    );
    process.exit(1);
  }
}

void runAudit();
