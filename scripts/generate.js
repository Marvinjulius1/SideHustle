// Erzeugt Post-Bilder (PNG) und Captions für die nächsten Tage.
// Aufruf: npm run generate -- [--from 2026-10-01] [--days 30] [--out output]
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import { chromium } from 'playwright';
import { buildCaption, buildSchedule } from '../src/plan.js';
import { renderHtml, WIDTH, HEIGHT } from '../src/template.js';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const config = JSON.parse(await readFile(path.join(root, 'config.json'), 'utf8'));

const { values } = parseArgs({
  options: {
    from: { type: 'string' },
    days: { type: 'string', default: '30' },
    out: { type: 'string', default: 'output' },
  },
});

const today = new Date().toISOString().slice(0, 10);
const from = values.from ?? (today > config.startDate ? today : config.startDate);
const days = Number(values.days);
const outDir = path.resolve(root, values.out);
const schedule = buildSchedule({ startDate: config.startDate, from, days });

const require = createRequire(import.meta.url);
const fontDir = pathToFileURL(path.join(path.dirname(require.resolve('@fontsource/inter/package.json')), 'files')).href;

const csvCell = (s) => `"${String(s).replace(/"/g, '""')}"`;

await rm(outDir, { recursive: true, force: true });
await mkdir(outDir, { recursive: true });

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const page = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT } });
const csv = [['datum', 'uhrzeit', 'bild', 'caption'].map(csvCell).join(',')];
const problems = [];

try {
  for (const { date, post } of schedule) {
    const dir = path.join(outDir, date);
    await mkdir(dir, { recursive: true });
    const htmlFile = path.join(dir, 'post.html');
    await writeFile(htmlFile, renderHtml(post, config, fontDir));
    await page.goto(pathToFileURL(htmlFile).href);
    await page.waitForFunction(() => window.__ready === true, null, { timeout: 15000 });
    if (await page.evaluate(() => window.__overflow)) problems.push(`${date} (${post.id}): Text passt nicht ins Bild`);
    await page.screenshot({ path: path.join(dir, 'post.png'), type: 'png' });
    await rm(htmlFile);
    const caption = buildCaption(post, config);
    await writeFile(path.join(dir, 'caption.txt'), caption + '\n');
    csv.push([date, config.postTime, `${date}/post.png`, caption].map(csvCell).join(','));
    console.log(`✓ ${date}  ${post.id}`);
  }
} finally {
  await browser.close();
}

await writeFile(path.join(outDir, 'plan.csv'), '﻿' + csv.join('\r\n') + '\r\n');
console.log(`\n${schedule.length} Posts erstellt in ${path.relative(root, outDir)}/`);

if (problems.length) {
  console.error('\nProbleme:\n' + problems.join('\n'));
  process.exit(1);
}
