import { POSTS } from './posts.js';
import { generateMathPosts } from './math.js';

export const TYPE_LABELS = { fakt: 'Fakt', tipp: 'Tipp', mythos: 'Mythos', rechnung: 'Rechnung' };

/** Alle Posts in fester Reihenfolge: zwei normale Posts, dann ein Rechen-Post. */
export function allPosts(posts = POSTS, mathPosts = generateMathPosts()) {
  const list = [];
  let p = 0;
  let m = 0;
  while (p < posts.length || m < mathPosts.length) {
    for (let k = 0; k < 2 && p < posts.length; k++) list.push(posts[p++]);
    if (m < mathPosts.length) list.push(mathPosts[m++]);
  }
  validate(list);
  return list;
}

export function validate(list) {
  const ids = new Set();
  for (const post of list) {
    if (!post.id || ids.has(post.id)) throw new Error(`Doppelte oder fehlende ID: ${post.id}`);
    ids.add(post.id);
    if (!TYPE_LABELS[post.type]) throw new Error(`Unbekannter Typ bei ${post.id}: ${post.type}`);
    if (!post.title?.trim() || !post.body?.trim()) throw new Error(`Titel oder Text fehlt bei ${post.id}`);
    if ((post.body.match(/\*/g) || []).length % 2 !== 0) throw new Error(`Ungerade Anzahl * bei ${post.id}`);
  }
  return list;
}

function parseDate(s) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) throw new Error(`Datum muss JJJJ-MM-TT sein: ${s}`);
  const d = new Date(`${s}T00:00:00Z`);
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== s) throw new Error(`Ungültiges Datum: ${s}`);
  return d;
}

export function addDays(dateStr, n) {
  const d = parseDate(dateStr);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/**
 * Plan für `days` Tage ab `from`. Jeder Kalendertag bekommt immer denselben Post
 * (bezogen auf `startDate`), egal wann der Generator läuft. Ist die Liste durch,
 * beginnt sie von vorn.
 */
export function buildSchedule({ startDate, from, days, list = allPosts() }) {
  if (!Number.isInteger(days) || days < 1 || days > 366) throw new Error('Tage muss zwischen 1 und 366 liegen');
  const start = parseDate(startDate);
  const first = parseDate(from);
  const offset = Math.round((first - start) / 86400000);
  if (offset < 0) throw new Error(`Startdatum ${from} liegt vor dem Projektstart ${startDate}`);
  return Array.from({ length: days }, (_, i) => ({
    date: addDays(from, i),
    post: list[(offset + i) % list.length],
  }));
}

export const plainText = (s) => s.replace(/\*/g, '');

export function buildCaption(post, config) {
  const parts = [plainText(post.title), plainText(post.body)];
  if (post.note) parts.push(post.note);
  parts.push(config.callToAction.replace('{handle}', config.handle));
  parts.push(config.disclaimer);
  parts.push(config.hashtags.join(' '));
  return parts.join('\n\n');
}
