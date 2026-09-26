import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { futureValue, doublingYears, realValue, roundNice, generateMathPosts, euro } from '../src/math.js';
import { allPosts, buildSchedule, buildCaption, addDays, validate, plainText } from '../src/plan.js';
import { richText, renderHtml } from '../src/template.js';
import { POSTS } from '../src/posts.js';

const config = JSON.parse(readFileSync(new URL('../config.json', import.meta.url), 'utf8'));
const close = (a, b, eps = 1e-6) => assert.ok(Math.abs(a - b) <= eps, `${a} ≠ ${b}`);

test('Sparplan entspricht der vorschüssigen Rentenformel', () => {
  const s = 100, p = 0.05, years = 20;
  const rm = Math.pow(1 + p, 1 / 12) - 1;
  const N = years * 12;
  close(futureValue({ monthly: s, years, annualReturn: p }), s * (1 + rm) * (Math.pow(1 + rm, N) - 1) / rm);
  close(futureValue({ start: 1000, monthly: 0, years: 10, annualReturn: 0.05 }), 1000 * 1.05 ** 10);
  close(futureValue({ monthly: 50, years: 2, annualReturn: 0 }), 1200);
  assert.throws(() => futureValue({ monthly: -1, years: 1, annualReturn: 0.05 }));
  assert.throws(() => futureValue({ monthly: NaN, years: 1, annualReturn: 0.05 }));
});

test('Verdopplung, Inflation und Runden', () => {
  close(doublingYears(0.06), Math.log(2) / Math.log(1.06));
  close(1.06 ** doublingYears(0.06), 2);
  close(realValue(1000, 0.02, 10), 1000 / 1.02 ** 10);
  assert.equal(roundNice(7749.6), 7750);
  assert.equal(roundNice(219_144), 219_000);
  assert.equal(roundNice(12_345), 12_300);
  assert.equal(roundNice(512.4), 512);
});

test('Jede Zahl in Rechen-Posts ist konsistent', () => {
  for (const post of generateMathPosts()) {
    assert.ok(!/NaN|Infinity|undefined/.test(post.title + post.body), post.id);
  }
  // Differenz im "früher anfangen"-Post passt zu den angezeigten Beträgen.
  const early = generateMathPosts().filter((p) => p.id.startsWith('rechnung-frueh'));
  assert.ok(early.length > 0);
  const toNum = (s) => Number(s.replace(/\./g, '').replace(/[^\d]/g, ''));
  for (const post of [...early, ...generateMathPosts().filter((p) => p.id.startsWith('rechnung-kosten'))]) {
    const amounts = [...post.body.matchAll(/ca\. \*?([\d.]+)\s€/g)].map((m) => toNum(m[1]));
    assert.equal(amounts.length, 3, post.id);
    assert.equal(amounts[0] - amounts[1], amounts[2], post.id);
  }
});

test('Beispiel: 50 € über 10 Jahre bei 5 %', () => {
  const post = generateMathPosts().find((p) => p.id === 'rechnung-sparplan-50-10-0.05');
  const expected = euro(roundNice(futureValue({ monthly: 50, years: 10, annualReturn: 0.05 })));
  assert.ok(post.body.includes(expected));
  assert.ok(post.body.includes(euro(6000)));
});

test('Alle Posts sind gültig und eindeutig', () => {
  const list = allPosts();
  assert.equal(list.length, POSTS.length + generateMathPosts().length);
  assert.equal(new Set(list.map((p) => p.id)).size, list.length);
  assert.throws(() => validate([{ id: 'a', type: 'fakt', title: 'x', body: '*y' }]));
  assert.throws(() => validate([{ id: 'a', type: 'quatsch', title: 'x', body: 'y' }]));
  assert.throws(() => validate([{ id: 'a', type: 'fakt', title: 'x', body: 'y' }, { id: 'a', type: 'fakt', title: 'x', body: 'y' }]));
});

test('Reihenfolge: zwei normale Posts, dann ein Rechen-Post', () => {
  const list = allPosts();
  assert.notEqual(list[0].type, 'rechnung');
  assert.notEqual(list[1].type, 'rechnung');
  assert.equal(list[2].type, 'rechnung');
});

test('Plan ist pro Datum stabil und wiederholt sich nach Durchlauf', () => {
  const list = allPosts();
  const a = buildSchedule({ startDate: '2026-10-01', from: '2026-10-01', days: 10 });
  const b = buildSchedule({ startDate: '2026-10-01', from: '2026-10-05', days: 3 });
  assert.equal(a[4].post.id, b[0].post.id);
  assert.equal(b[0].date, '2026-10-05');
  const c = buildSchedule({ startDate: '2026-10-01', from: addDays('2026-10-01', list.length), days: 1 });
  assert.equal(c[0].post.id, list[0].id);
  assert.throws(() => buildSchedule({ startDate: '2026-10-01', from: '2026-09-30', days: 1 }));
  assert.throws(() => buildSchedule({ startDate: '2026-10-01', from: '2026-02-30', days: 1 }));
  assert.throws(() => buildSchedule({ startDate: '2026-10-01', from: '2026-10-01', days: 0 }));
});

test('Datumsrechnung über Monats- und Jahresgrenzen', () => {
  assert.equal(addDays('2026-12-31', 1), '2027-01-01');
  assert.equal(addDays('2028-02-28', 1), '2028-02-29');
  assert.equal(addDays('2026-03-28', 3), '2026-03-31');
});

test('Caption enthält alles Nötige ohne Sternchen', () => {
  for (const post of allPosts()) {
    const caption = buildCaption(post, config);
    assert.ok(!caption.includes('*'), post.id);
    assert.ok(caption.includes(config.handle));
    assert.ok(caption.includes(config.disclaimer));
    assert.ok(caption.includes('#geldwissen'));
    assert.ok(caption.length <= 2200, `${post.id} zu lang für Instagram`);
  }
  assert.equal(plainText('a *b* c'), 'a b c');
});

test('HTML wird sicher escaped', () => {
  assert.equal(richText('<b>*x*</b>'), '<p>&lt;b&gt;<mark>x</mark>&lt;/b&gt;</p>');
  assert.equal(richText('a\nb'), '<p>a</p><p>b</p>');
  const html = renderHtml({ id: 'x', type: 'mythos', title: '"<script>"', body: 'b' }, config, 'file:///f');
  assert.ok(!html.includes('"<script>"'));
  assert.ok(html.includes('Die Wahrheit:'));
});
