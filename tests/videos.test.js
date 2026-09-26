import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { VIDEOS } from '../content/videos.js';
import { GESTURES, TALK_GESTURES } from '../render/gestures.js';
import {
  SPEECH_START, buildAss, buildCaption, captionChunks, planGestures, spokenSentences, toSpeech, assEscape,
} from '../scripts/lib/timeline.js';

const config = JSON.parse(readFileSync(new URL('../content/config.json', import.meta.url), 'utf8'));
const words = (s) => s.trim().split(/\s+/).length;

test('55 Videos, Tage 1–55 lückenlos, IDs eindeutig', () => {
  assert.equal(VIDEOS.length, 55);
  assert.deepEqual(VIDEOS.map((v) => v.day), Array.from({ length: 55 }, (_, i) => i + 1));
  assert.equal(new Set(VIDEOS.map((v) => v.id)).size, 55);
});

test('Skripte haben eine sinnvolle Länge', () => {
  for (const v of VIDEOS) {
    const total = v.lines.reduce((n, l) => n + words(l), 0);
    assert.ok(total >= 30 && total <= 100, `Tag ${v.day}: ${total} Wörter`);
    for (const l of v.lines) assert.ok(words(l) <= 30, `Tag ${v.day}: Satz zu lang: ${l}`);
    assert.ok(v.hook.length <= 42, `Tag ${v.day}: Hook zu lang`);
    assert.ok(v.caption.length > 0);
  }
});

test('Keine Gewinnversprechen, keine problematischen Zeichen', () => {
  const banned = [/guaranteed (profit|return|gain)/i, /get rich/i, /can'?t lose/i, /easy money/i, /\$/, /financial advice/i];
  for (const v of VIDEOS) {
    const text = [v.hook, v.caption, ...v.lines].join(' ');
    for (const re of banned) assert.ok(!re.test(text), `Tag ${v.day}: verbotene Formulierung ${re}`);
    for (const l of v.lines) assert.ok(!/[{}\\]/.test(l), `Tag ${v.day}: Sonderzeichen`);
  }
});

test('Keine verkürzten Verneinungen (n\'t) in gesprochenen Sätzen – die Stimme verschluckt sie', () => {
  for (const v of VIDEOS) {
    for (const l of spokenSentences(v, config)) assert.ok(!/n['’]t\b/i.test(l), `Tag ${v.day}: ${l}`);
  }
});

test('Call-to-Action ist in jedem Video gleich und am Ende', () => {
  const cta = config.cta.map((c) => c.text);
  for (const v of VIDEOS) assert.deepEqual(spokenSentences(v, config).slice(-cta.length), cta);
  for (const c of config.cta) assert.ok(GESTURES[c.gesture], c.gesture);
  assert.match(cta.join(' '), /bio/);
  assert.match(cta.join(' '), /afford to lose/);
});

test('Werbehinweis und Risikohinweis in jeder Beschreibung', () => {
  for (const v of VIDEOS) {
    const caption = buildCaption(v, config);
    assert.match(caption, /#ad/);
    assert.match(caption, /Not financial advice/);
    assert.ok(caption.length <= 2200, `Tag ${v.day}: Beschreibung zu lang`);
  }
});

test('Aussprache-Korrekturen', () => {
  assert.equal(toSpeech('Memecoins and a memecoin'), 'meme coins and a meme coin');
  assert.equal(toSpeech('Check the FDV and KYC'), 'Check the F D V and K Y C');
  assert.equal(toSpeech('FOMO is real'), 'FOMO is real');
  assert.equal(toSpeech('up 100x with 10x leverage'), 'up 100 x with 10 x leverage');
  assert.equal(toSpeech('AI coins'), 'eh eye coins');
  assert.equal(toSpeech('trades 24/7'), 'trades twenty four seven');
  assert.equal(toSpeech('a degen'), 'a dee jen');
  assert.equal(toSpeech('I think'), 'I think');
});

const fakeTimings = (n, len = 2) => Array.from({ length: n }, (_, i) => ({ start: i * (len + 0.3), end: i * (len + 0.3) + len }));

test('Gesten: gültige Namen, erster Satz zeigt in die Kamera, CTA fest, keine Wiederholung', () => {
  for (const v of VIDEOS) {
    const n = spokenSentences(v, config).length;
    const g = planGestures(v, config, fakeTimings(n));
    assert.equal(g.length, n);
    assert.equal(g[0].name, 'point');
    g.forEach((x) => assert.ok(GESTURES[x.name], x.name));
    for (let i = 1; i < v.lines.length; i++) {
      assert.ok(TALK_GESTURES.includes(g[i].name));
      assert.notEqual(g[i].name, g[i - 1].name);
    }
    assert.deepEqual(g.slice(-config.cta.length).map((x) => x.name), config.cta.map((c) => c.gesture));
    assert.ok(g.every((x) => x.start >= SPEECH_START && x.end > x.start));
  }
  // Sehr kurze Sätze bekommen keine Geste
  assert.equal(planGestures(VIDEOS[0], config, fakeTimings(9, 0.5)).length, 0);
});

test('Untertitel: vollständiger Text, kurze Häppchen, zeitlich lückenlos', () => {
  const sentences = ['This is a simple test sentence with several words.', 'Short one.'];
  const timings = [{ start: 0, end: 3 }, { start: 3.3, end: 4 }];
  const chunks = captionChunks(sentences, timings);
  assert.equal(chunks.map((c) => c.text).join(' '), sentences.join(' '));
  for (const c of chunks) {
    assert.ok(c.text.split(' ').length <= 3);
    assert.ok(c.end > c.start);
  }
  assert.equal(chunks[0].start, SPEECH_START);
  assert.ok(Math.abs(chunks.at(-1).end - (SPEECH_START + 4)) < 1e-9);
  for (let i = 1; i < chunks.length; i++) assert.ok(chunks[i].start >= chunks[i - 1].end - 1e-9);
});

test('ASS-Datei: Kopf, Label, Hook, Escaping', () => {
  const v = VIDEOS[6];
  const ass = buildAss({ video: v, chunks: [{ start: 3, end: 4, text: 'hi {x}' }], total: 30, config });
  assert.match(ass, /PlayResX: 1080/);
  assert.match(ass, /WINTER ARC · DAY 7/);
  assert.ok(ass.includes(v.hook.toUpperCase()));
  assert.ok(ass.includes('HI X'));
  assert.equal(assEscape('a\\b{c}'), 'a\\\\bc');
});
