// Reine Logik (ohne Browser/ffmpeg): Sätze, Gesten, Untertitel. Wird getestet.
import { TALK_GESTURES } from '../../render/gestures.js';

export const FPS = 30;
export const WALK_DURATION = 2.8;
export const SPEECH_START = WALK_DURATION + 0.15;
export const TAIL = 0.7;

/** Stabiler Hash (FNV-1a) für reproduzierbare "Zufalls"-Entscheidungen. */
export function hash(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Alle gesprochenen Sätze eines Videos: Inhalt + immer gleiches Ende (Call-to-Action). */
export function spokenSentences(video, config) {
  return [...video.lines, ...config.cta.map((c) => c.text)];
}

/**
 * Gesten pro Satz. Erster Satz: in die Kamera zeigen. CTA-Sätze: feste Gesten aus der Config.
 * Sonst reproduzierbar aus TALK_GESTURES gewählt, nie zweimal dieselbe hintereinander.
 */
export function planGestures(video, config, timings) {
  const ctaStart = video.lines.length;
  const gestures = [];
  let prev = null;
  timings.forEach((t, i) => {
    let name;
    if (i >= ctaStart) name = config.cta[i - ctaStart].gesture;
    else if (i === 0) name = 'point';
    else {
      const options = TALK_GESTURES.filter((g) => g !== prev);
      name = options[hash(`${video.id}:${i}`) % options.length];
    }
    const start = SPEECH_START + t.start + 0.15;
    const end = SPEECH_START + t.end - 0.1;
    if (end - start >= 0.6) {
      gestures.push({ start, end, name });
      prev = name;
    }
  });
  return gestures;
}

/** Untertitel in kurzen Häppchen (max. 3 Wörter / 16 Zeichen), Zeit proportional zur Wortlänge. */
export function captionChunks(sentences, timings) {
  const chunks = [];
  sentences.forEach((sentence, i) => {
    const words = sentence.trim().split(/\s+/);
    const weights = words.map((w) => w.length + 2);
    const total = weights.reduce((a, b) => a + b, 0);
    const { start, end } = timings[i];
    const dur = end - start;
    let t = start;
    let group = [];
    let groupStart = start;
    words.forEach((word, k) => {
      const wEnd = t + (dur * weights[k]) / total;
      const text = [...group, word].join(' ');
      if (group.length && (group.length >= 3 || text.length > 16)) {
        chunks.push({ start: SPEECH_START + groupStart, end: SPEECH_START + t, text: group.join(' ') });
        group = [];
        groupStart = t;
      }
      group.push(word);
      t = wEnd;
    });
    if (group.length) chunks.push({ start: SPEECH_START + groupStart, end: SPEECH_START + end, text: group.join(' ') });
  });
  return chunks;
}

function assTime(s) {
  const cs = Math.max(0, Math.round(s * 100));
  const h = Math.floor(cs / 360000);
  const m = Math.floor((cs % 360000) / 6000);
  const sec = Math.floor((cs % 6000) / 100);
  return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}.${String(cs % 100).padStart(2, '0')}`;
}

export const assEscape = (s) => String(s).replace(/\\/g, '\\\\').replace(/[{}]/g, '').replace(/\n/g, '\\N');

/** Untertiteldatei (ASS) für 1080x1920: Serien-Label, Hook oben, Untertitel in der Mitte. */
export function buildAss({ video, chunks, total, config }) {
  const header = `[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 0
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Caption,Montserrat Black,96,&H00FFFFFF,&H00FFFFFF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,7,0,5,80,80,0,1
Style: Hook,Montserrat Black,72,&H0000E1FF,&H0000E1FF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,7,0,8,90,90,300,1
Style: Label,Montserrat ExtraBold,40,&H00FFD08A,&H00FFD08A,&H00000000,&H00000000,0,0,0,0,100,100,2,0,1,4,0,8,90,90,190,1
Style: Small,Montserrat ExtraBold,38,&H00DDDDDD,&H00DDDDDD,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,4,0,8,90,90,1420,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;
  const lines = [];
  lines.push(`Dialogue: 0,${assTime(0)},${assTime(total)},Label,,0,0,0,,${assEscape(`${config.seriesLabel} · DAY ${video.day}`)}`);
  lines.push(`Dialogue: 0,${assTime(0)},${assTime(SPEECH_START + 0.4)},Hook,,0,0,0,,{\\fad(120,200)}${assEscape(video.hook.toUpperCase())}`);
  lines.push(`Dialogue: 0,${assTime(0.3)},${assTime(SPEECH_START + 0.4)},Small,,0,0,0,,{\\fad(120,200)}${assEscape(config.disclaimerShort)}`);
  for (const c of chunks) {
    lines.push(
      `Dialogue: 1,${assTime(c.start)},${assTime(c.end)},Caption,,0,0,0,,{\\pos(540,1240)\\fscx85\\fscy85\\t(0,90,\\fscx100\\fscy100)}${assEscape(c.text.toUpperCase())}`,
    );
  }
  return header + lines.join('\n') + '\n';
}

/** Beschreibungstext für TikTok/Instagram. */
export function buildCaption(video, config) {
  return [video.caption, config.captionFooter, [...config.hashtags, ...(video.hashtags || [])].join(' ')].join('\n\n');
}

// Wörter, die die Stimme als Wort (nicht buchstabiert) sprechen soll.
const SPOKEN_AS_WORD = new Set(['FOMO', 'FUD', 'HODL', 'ETH', 'OK']);
const PRONUNCIATION = [
  [/\bmemecoins\b/gi, 'meme coins'],
  [/\bmemecoin\b/gi, 'meme coin'],
  [/\bstablecoins\b/gi, 'stable coins'],
  [/\bstablecoin\b/gi, 'stable coin'],
  [/\bdegens\b/gi, 'dee jens'],
  [/\bdegen\b/gi, 'dee jen'],
  [/\bATH\b/g, 'all time high'],
  [/\b24\/7\b/g, 'twenty four seven'],
  [/\b(\d+)x\b/g, '$1 x'],
  [/\bNFT\b/g, 'N F T'],
  [/\bAI\b/g, 'eh eye'],
];

/** Text für die Sprachausgabe: Aussprache-Korrekturen, Abkürzungen buchstabieren. */
export function toSpeech(text) {
  let s = text;
  for (const [re, rep] of PRONUNCIATION) s = s.replace(re, rep);
  return s.replace(/\b[A-Z]{2,5}\b/g, (w) => (SPOKEN_AS_WORD.has(w) ? w : w.split('').join(' ')));
}
