/**
 * SQL Execution & Evidence Capture Runner: sql/run.ts
 * Executable via: npm run sql:run
 */

import Database from 'better-sqlite3';
import * as fs from 'fs';
import * as path from 'path';
import { chromium } from '@playwright/test';
import config from '../config/env';
import { seedDatabase } from '../scripts/seed-db';

interface QueryPlanRow {
  id: number;
  parent: number;
  notused: number;
  detail: string;
}

async function main(): Promise<void> {
  const dbPath = path.resolve(process.cwd(), config.SQLITE_PATH);
  if (!fs.existsSync(dbPath)) {
    console.log('[Runner] Database not found. Running seed pipeline first...');
    seedDatabase(dbPath);
  }

  const db = new Database(dbPath);
  const queriesDir = path.resolve(process.cwd(), 'sql', 'queries');
  const outputDir = path.resolve(process.cwd(), 'sql', 'output');
  const screenshotDir = path.resolve(process.cwd(), 'sql', 'screenshots');

  fs.mkdirSync(outputDir, { recursive: true });
  fs.mkdirSync(screenshotDir, { recursive: true });

  const queryFiles = fs
    .readdirSync(queriesDir)
    .filter(f => f.endsWith('.sql'))
    .sort();
  console.log(`[Runner] Executing ${queryFiles.length} analytical SQL queries...\n`);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });

  for (const file of queryFiles) {
    const queryName = path.basename(file, '.sql');
    const sqlText = fs.readFileSync(path.join(queriesDir, file), 'utf-8');

    // Strip comments to obtain raw executable query
    const cleanSql = sqlText.replace(/--.*$/gm, '').trim();

    // 1. Explain Query Plan
    const planRows = db.prepare(`EXPLAIN QUERY PLAN ${cleanSql}`).all() as QueryPlanRow[];
    const planText = planRows.map(r => `  |-- ${r.detail}`).join('\n');

    // 2. Measure & Execute Query
    const t0 = performance.now();
    const rows = db.prepare(cleanSql).all() as Record<string, unknown>[];
    const execTimeMs = (performance.now() - t0).toFixed(2);

    // 3. Format Console / Text Output
    let textOutput = `QUERY: ${file}\n`;
    textOutput += `EXECUTION TIME: ${execTimeMs} ms | ROWS RETURNED: ${rows.length}\n\n`;
    textOutput += `EXPLAIN QUERY PLAN:\n${planText}\n\n`;
    textOutput += `RESULTS:\n`;
    textOutput += JSON.stringify(rows, null, 2);

    fs.writeFileSync(path.join(outputDir, `${queryName}.txt`), textOutput, 'utf-8');
    console.log(
      `\n================================================================================`
    );
    console.log(`[PASS] ${file} => ${rows.length} rows returned in ${execTimeMs}ms`);
    console.log(`================================================================================`);
    console.table(rows);

    // 4. Render HTML Report & Screenshot to PNG
    const firstRow = rows[0];
    const columns = firstRow ? Object.keys(firstRow) : [];
    const tableHeaderHtml = columns.map(c => `<th>${c}</th>`).join('');
    const tableRowsHtml = rows
      .map(
        r =>
          `<tr>${columns.map(c => `<td>${r[c] !== null && r[c] !== undefined ? String(r[c]) : 'NULL'}</td>`).join('')}</tr>`
      )
      .join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${queryName}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace; background: #0f172a; color: #f8fafc; padding: 32px; margin: 0; }
          .card { background: #1e293b; border-radius: 12px; padding: 24px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); border: 1px solid #334155; }
          h1 { margin-top: 0; font-size: 20px; color: #38bdf8; display: flex; justify-content: space-between; border-bottom: 1px solid #334155; padding-bottom: 12px; }
          .badge { font-size: 13px; background: #0369a1; padding: 4px 10px; border-radius: 9999px; color: #fff; }
          pre { background: #090d16; padding: 16px; border-radius: 8px; overflow-x: auto; font-size: 13px; color: #a5f3fc; border: 1px solid #1e293b; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 14px; }
          th { background: #334155; color: #e2e8f0; text-align: left; padding: 10px 14px; font-weight: 600; }
          td { padding: 10px 14px; border-bottom: 1px solid #334155; color: #cbd5e1; }
          tr:nth-child(even) { background: #1e293b; }
          tr:nth-child(odd) { background: #162032; }
          .meta { font-size: 13px; color: #94a3b8; margin-top: 12px; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>
            <span>SQL Engineering Evidence: ${queryName}</span>
            <span class="badge">${rows.length} rows (${execTimeMs} ms)</span>
          </h1>
          <div class="meta">Engine: SQLite 3.53.4 (better-sqlite3) | Verified: ${new Date().toISOString()}</div>
          <h3>Executed Query</h3>
          <pre>${sqlText.trim()}</pre>
          <h3>Query Results</h3>
          <table>
            <thead><tr>${tableHeaderHtml}</tr></thead>
            <tbody>${tableRowsHtml}</tbody>
          </table>
          <h3>Execution Plan (EXPLAIN QUERY PLAN)</h3>
          <pre>${planText}</pre>
        </div>
      </body>
      </html>
    `;

    await page.setContent(htmlContent, { waitUntil: 'load' });
    await page.screenshot({
      path: path.join(screenshotDir, `${queryName}.png`),
      fullPage: true,
    });
  }

  await browser.close();
  db.close();
  console.log('\n[Runner] All text outputs and screenshots generated successfully.');
}

main().catch(err => {
  console.error('[Runner Fatal Error]', err);
  process.exit(1);
});
