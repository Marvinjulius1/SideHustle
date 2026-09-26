import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { VIDEOS } from '../content/videos.js';
import { SCENES } from '../content/scenes.js';
import { assignScenes } from '../scripts/lib/plan.js';
import { fillTemplate, getPath } from '../scripts/lib/providers.js';
import {
  assEscape, buildAss, buildCaption, captionChunks, estimateAlignment, imagePrompt, splitSegments,
  spokenSentences, spokenText, videoPrompt, wordsFromAlignment,
} from '../scripts/lib/timeline.js';

const config = JSON.parse(readFileSync(new URL('../content/config.json', import.meta.url), 'utf8'));
const words = (s) => s.trim().split(/\s+/).length;

// ---------------------------------------------------------------- Inhalte

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

test('Keine verkürzten Verneinungen (n\'t) in gesprochenen Sätzen – werden leicht überhört', () => {
  for (const v of VIDEOS) {
    for (const l of spokenSentences(v, config)) assert.ok(!/n['’]t\b/i.test(l), `Tag ${v.day}: ${l}`);
  }
});

test('Call-to-Action ist in jedem Video gleich und am Ende', () => {
  for (const v of VIDEOS) assert.deepEqual(spokenSentences(v, config).slice(-config.cta.length), config.cta);
  assert.match(config.cta.join(' '), /bio/);
  assert.match(config.cta.join(' '), /afford to lose/);
});

test('Werbehinweis und Risikohinweis in jeder Beschreibung', () => {
  for (const v of VIDEOS) {
    const caption = buildCaption(v, config);
    assert.match(caption, /#ad/);
    assert.match(caption, /Not financial advice/);
    assert.ok(caption.length <= 2200, `Tag ${v.day}: Beschreibung zu lang`);
  }
});

// ---------------------------------------------------------------- Umgebungen

test('Umgebungen: gültig und eindeutig', () => {
  assert.equal(new Set(SCENES.map((s) => s.id)).size, SCENES.length);
  for (const s of SCENES) {
    assert.ok(s.poses.length > 0 && s.poses.every((p) => ['walk', 'sit'].includes(p)), s.id);
    assert.ok(s.setting.length > 20, s.id);
  }
  assert.ok(SCENES.filter((s) => s.recurring).length >= 1);
});

test('Szenenplan: nie zweimal gleich hintereinander, Zuhause kehrt wieder, gemischte Haltungen', () => {
  const plan = assignScenes(VIDEOS);
  assert.equal(plan.length, 55);
  for (let i = 1; i < plan.length; i++) assert.notEqual(plan[i].scene.id, plan[i - 1].scene.id, `Tag ${plan[i].day}`);
  for (const p of plan) assert.ok(p.scene.poses.includes(p.pose), `Tag ${p.day}`);
  const recurringVisits = plan.filter((p) => p.scene.recurring).length;
  assert.ok(recurringVisits >= 8, `Zuhause nur ${recurringVisits}x`);
  const sitting = plan.filter((p) => p.pose === 'sit').length;
  assert.ok(sitting >= 12 && sitting <= 25, `${sitting}x sitzen`);
  const distinct = new Set(plan.map((p) => p.scene.id)).size;
  assert.ok(distinct >= 20, `nur ${distinct} Umgebungen`);
  // An wiederkehrenden Orten wird mal gelaufen, mal gesessen
  const homePoses = new Set(plan.filter((p) => p.scene.recurring).map((p) => p.pose));
  assert.deepEqual([...homePoses].sort(), ['sit', 'walk']);
});

test('Szenenplan: feste Vorgaben pro Video werden geprüft', () => {
  const v = [{ day: 1, scene: 'supercar', pose: 'walk' }];
  assert.throws(() => assignScenes(v), /passt nicht/);
  assert.throws(() => assignScenes([{ day: 1, scene: 'mond' }]), /unbekannte/);
  assert.equal(assignScenes([{ day: 1, scene: 'supercar' }])[0].pose, 'sit');
});

test('Prompts enthalten Stil, Haltung und Ort', () => {
  const scene = SCENES.find((s) => s.id === 'gym');
  const p = imagePrompt(scene, 'walk', config);
  assert.match(p, /PlayStation 2/);
  assert.match(p, /no text or logo/);
  assert.match(p, /walks toward the camera/);
  assert.ok(p.includes(scene.setting));
  assert.match(p, /blurred/);
  assert.throws(() => imagePrompt(scene, 'fly', config));
  assert.equal(videoPrompt('walk', 0, config), config.ai.prompts.walk);
  assert.equal(videoPrompt('walk', 1, config), config.ai.prompts.stand);
  assert.equal(videoPrompt('sit', 0, config), config.ai.prompts.sit);
  assert.match(config.ai.prompts.walk, /talking/);
});

// ---------------------------------------------------------------- Zeiten, Schnitt, Untertitel

const sample = 'Hello there, trader. This is sentence two. And here comes the third one!';

test('Wörter aus Zeichen-Zeiten', () => {
  const w = wordsFromAlignment(estimateAlignment(sample));
  assert.equal(w.map((x) => x.text).join(' '), sample);
  assert.ok(w.every((x, i) => x.end > x.start && (i === 0 || x.start >= w[i - 1].end)));
  assert.throws(() => wordsFromAlignment({ characters: ['a'], character_start_times_seconds: [], character_end_times_seconds: [] }));
});

test('Segmente: an Satzgrenzen, lückenlos, max. Länge', () => {
  const w = wordsFromAlignment(estimateAlignment(sample, 15));
  const segs = splitSegments(w, 3);
  assert.equal(segs[0].start, 0);
  for (let i = 1; i < segs.length; i++) assert.equal(segs[i].start, segs[i - 1].end);
  assert.equal(segs.map((s) => s.text).join(' '), sample);
  for (const s of segs) assert.match(s.text, /[.!?]$/);
  assert.equal(splitSegments(w, 100).length, 1);
  // Echte Videos: jeder Abschnitt ≤ maxSegmentSeconds (außer ein einzelner Satz ist länger)
  const max = config.ai.video.maxSegmentSeconds;
  for (const v of VIDEOS) {
    const vw = wordsFromAlignment(estimateAlignment(spokenText(v, config)));
    for (const s of splitSegments(vw, max)) {
      const singleSentence = (s.text.match(/[.!?]/g) || []).length <= 1;
      assert.ok(s.end - s.start <= max + 0.5 || singleSentence, `Tag ${v.day}: ${(s.end - s.start).toFixed(1)} s`);
    }
  }
});

test('Untertitel: vollständiger Text, max. 3 Wörter, zeitlich geordnet', () => {
  const w = wordsFromAlignment(estimateAlignment(sample));
  const chunks = captionChunks(w);
  assert.equal(chunks.map((c) => c.text).join(' '), sample);
  for (const c of chunks) {
    assert.ok(c.text.split(' ').length <= 3);
    assert.ok(c.end > c.start);
  }
  for (let i = 1; i < chunks.length; i++) assert.ok(chunks[i].start >= chunks[i - 1].end - 1e-9);
  assert.equal(chunks[0].text, 'Hello there,');
});

test('ASS-Datei: Label, Hook, Escaping', () => {
  const v = VIDEOS[6];
  const ass = buildAss({ video: v, chunks: [{ start: 3, end: 4, text: 'hi {x}' }], total: 30, config });
  assert.match(ass, /PlayResX: 1080/);
  assert.match(ass, /WINTER ARC · DAY 7/);
  assert.ok(ass.includes(v.hook.toUpperCase()));
  assert.ok(ass.includes('HI X'));
  assert.equal(assEscape('a\\b{c}'), 'a\\\\bc');
});

// ---------------------------------------------------------------- KI-Anbindung (ohne Netzwerk)

test('Vorlagen für KI-Anfragen werden korrekt befüllt', () => {
  const filled = fillTemplate(config.ai.video.input, { image: 'I', audio: 'A', prompt: 'P' });
  assert.deepEqual(Object.values(filled).sort(), ['A', 'I', 'P']);
  const img = fillTemplate(config.ai.image.input, { image: 'I', prompt: 'P' });
  assert.ok(!/\{(image|prompt|audio)\}/.test(JSON.stringify(img)), 'Platzhalter nicht ersetzt');
  assert.throws(() => fillTemplate({ a: '{missing}' }, {}), /Platzhalter/);
  assert.equal(fillTemplate('text {image} bleibt', { image: 'x' }), 'text {image} bleibt');
});

test('Ergebnisfelder werden gefunden oder klar gemeldet', () => {
  assert.equal(getPath({ images: [{ url: 'u' }] }, 'images.0.url'), 'u');
  assert.equal(getPath({ video: { url: 'v' } }, 'video.url'), 'v');
  assert.throws(() => getPath({}, 'video.url'), /fehlt/);
});
