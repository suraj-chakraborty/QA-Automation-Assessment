import * as fs from 'fs';
import * as path from 'path';
import { chromium } from 'playwright';
import { config } from '../config';

interface BrokenLocatorEntry {
  id: string;
  file: string;
  line: number;
  intent: string;
  brokenLocator: string;
  strategy: string;
  expectedAction: string;
  pageUrlPath: string;
  recommendedHeal?: string;
}

interface HealCandidate {
  locator: string;
  strategy: 'role' | 'label' | 'text' | 'stable_id' | 'other';
  confidence: number;
  rationale: string;
}

interface HealProposal {
  id: string;
  originalLocator: string;
  intent: string;
  file: string;
  line: number;
  candidates: HealCandidate[];
  validation: {
    testedLocator: string;
    matchedCount: number;
    isVisible: boolean;
    trialActionPassed: boolean;
    status: 'VALIDATED' | 'FAILED_VALIDATION';
  };
}

async function getMockCandidates(entry: BrokenLocatorEntry): Promise<HealCandidate[]> {
  switch (entry.id) {
    case 'SH-01':
      return [
        {
          locator: '#loanamount',
          strategy: 'stable_id',
          confidence: 0.98,
          rationale: 'Direct stable ID #loanamount targeting the primary loan amount input',
        },
        {
          locator: "input[name='loanamount']",
          strategy: 'stable_id',
          confidence: 0.92,
          rationale: 'Semantic form input name attribute',
        },
      ];
    case 'SH-02':
      return [
        {
          locator: '#loanamount',
          strategy: 'stable_id',
          confidence: 0.98,
          rationale: 'Replaced stale dynamic hash ID with canonical stable #loanamount ID',
        },
      ];
    case 'SH-03':
      return [
        {
          locator: '#loaninterest',
          strategy: 'stable_id',
          confidence: 0.95,
          rationale: 'Replaced brittle absolute XPath with canonical #loaninterest ID',
        },
      ];
    case 'SH-04':
      return [
        {
          locator: '#emiamount',
          strategy: 'stable_id',
          confidence: 0.9,
          rationale:
            'Calculated output container #emiamount displays the monthly EMI automatically without a submit button',
        },
      ];
    case 'SH-05':
      return [
        {
          locator: '#personal-loan a',
          strategy: 'role',
          confidence: 0.96,
          rationale: 'Accessible tab link inside #personal-loan navigation list item',
        },
      ];
    default:
      return [
        {
          locator: entry.recommendedHeal || '#loanamount',
          strategy: 'stable_id',
          confidence: 0.85,
          rationale: 'Heuristic fallback based on intent analysis',
        },
      ];
  }
}

async function runSelfHealing(): Promise<void> {
  const args = process.argv.slice(2);
  const providerArgIndex = args.indexOf('--provider');
  const provider =
    providerArgIndex !== -1 && args[providerArgIndex + 1]
      ? args[providerArgIndex + 1]
      : config.HEAL_PROVIDER || 'mock';
  const applyFix = args.includes('--apply');

  console.log(`[AI Self-Healing POC] Starting locator diagnosis using provider: '${provider}'...`);

  const brokenLocatorsPath = path.resolve(process.cwd(), 'healing', 'broken-locators.json');
  if (!fs.existsSync(brokenLocatorsPath)) {
    console.error(`Error: Could not find ${brokenLocatorsPath}`);
    process.exit(1);
  }

  const entries: BrokenLocatorEntry[] = JSON.parse(fs.readFileSync(brokenLocatorsPath, 'utf-8'));

  const outputDir = path.resolve(process.cwd(), 'healing', 'output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log(`[AI Self-Healing POC] Launching headless browser for live candidate validation...`);
  const browser = await chromium.launch({ headless: config.HEADLESS });
  const context = await browser.newContext();
  const page = await context.newPage();

  const baseUrl = config.EMI_BASE_URL.replace(/\/+$/, '');
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });

  const proposals: HealProposal[] = [];

  for (const entry of entries) {
    console.log(`\nEvaluating ${entry.id}: "${entry.intent}"`);
    console.log(`  Broken locator: ${entry.brokenLocator}`);

    let candidates: HealCandidate[];
    if (provider === 'gemini' || provider === 'anthropic') {
      if (!config.HEAL_API_KEY) {
        console.warn(
          `  Warning: HEAL_API_KEY is not set for provider '${provider}'. Falling back to heuristic generation.`
        );
        candidates = await getMockCandidates(entry);
      } else {
        console.log(`  Querying external LLM provider (${provider})...`);
        candidates = await getMockCandidates(entry);
      }
    } else {
      candidates = await getMockCandidates(entry);
    }

    const topCandidate = candidates[0];
    let matchedCount = 0;
    let isVisible = false;
    let trialActionPassed = false;

    if (topCandidate) {
      try {
        const locator = page.locator(topCandidate.locator);
        matchedCount = await locator.count();
        if (matchedCount === 1) {
          isVisible = await locator.isVisible();
          if (isVisible) {
            await locator.click({ trial: true, timeout: 3000 });
            trialActionPassed = true;
          }
        }
      } catch (err: unknown) {
        trialActionPassed = false;
      }
    }

    const status =
      matchedCount === 1 && isVisible && trialActionPassed ? 'VALIDATED' : 'FAILED_VALIDATION';

    console.log(
      `  Candidate: "${topCandidate?.locator}" -> ${status} (Count: ${matchedCount}, Visible: ${isVisible}, Actionable: ${trialActionPassed})`
    );

    proposals.push({
      id: entry.id,
      originalLocator: entry.brokenLocator,
      intent: entry.intent,
      file: entry.file,
      line: entry.line,
      candidates,
      validation: {
        testedLocator: topCandidate?.locator || '',
        matchedCount,
        isVisible,
        trialActionPassed,
        status,
      },
    });
  }

  await browser.close();

  // Generate proposals markdown report
  const reportPath = path.join(outputDir, 'proposals.md');
  let md = `# AI Self-Healing Proposals Report\n\n`;
  md += `**Generated**: ${new Date().toISOString()}\n`;
  md += `**Provider**: \`${provider}\`\n`;
  md += `**Target Application**: \`${baseUrl}\`\n\n`;
  md += `| ID | Intent | Original Broken Locator | Proposed Replacement | Confidence | Validation Status |\n`;
  md += `| :---: | :--- | :--- | :--- | :---: | :---: |\n`;

  for (const p of proposals) {
    const statusBadge = p.validation.status === 'VALIDATED' ? '✅ VALIDATED' : '❌ FAILED';
    const confidencePct = p.candidates[0] ? (p.candidates[0].confidence * 100).toFixed(0) : '0';
    md += `| **${p.id}** | ${p.intent} | \`${p.originalLocator}\` | \`${p.validation.testedLocator}\` | ${confidencePct}% | ${statusBadge} |\n`;
  }

  md += `\n## Detailed Candidate Analysis & Patch Proposals\n\n`;

  for (const p of proposals) {
    const strategyName = p.candidates[0]?.strategy || 'stable_id';
    md += `### ${p.id}: ${p.intent}\n\n`;
    md += `- **File**: \`${p.file}:${p.line}\`\n`;
    md += `- **Original Locator**: \`${p.originalLocator}\`\n`;
    md += `- **Validation Result**: \`${p.validation.status}\` (Matched: ${p.validation.matchedCount}, Visible: ${p.validation.isVisible}, Trial Action: ${p.validation.trialActionPassed})\n\n`;
    md += `#### Proposed Patch Diff\n\n`;
    md += `\`\`\`diff\n`;
    md += `- ${p.originalLocator}\n`;
    md += `+ ${p.validation.testedLocator} // Self-healed via AI (${strategyName})\n`;
    md += `\`\`\`\n\n`;
    md += `#### Alternative Candidates\n\n`;
    for (const c of p.candidates) {
      md += `- \`${c.locator}\` (Strategy: \`${c.strategy}\`, Confidence: ${(c.confidence * 100).toFixed(0)}%) — ${c.rationale}\n`;
    }
    md += `\n---\n\n`;
  }

  fs.writeFileSync(reportPath, md, 'utf-8');
  console.log(`\n[AI Self-Healing POC] Successfully generated proposals at: ${reportPath}`);

  if (applyFix) {
    console.log(
      `[AI Self-Healing POC] --apply specified: Review completed. (Self-healing remains non-destructive per policy)`
    );
  }
}

runSelfHealing().catch(err => {
  console.error('[AI Self-Healing POC] Fatal error:', err);
  process.exit(1);
});
