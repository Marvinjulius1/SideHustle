// Reine Logik ohne Netzwerk/ffmpeg: Text, Wort-Zeiten, Schnitt-Segmente, Untertitel, Prompts. Wird getestet.

export const HOOK_SECONDS = 2.6;

/** Stabiler Hash (FNV-1a) für Dateinamen im Cache. */
export function hash(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

/** Alle gesprochenen Sätze: Inhalt + immer gleiches Ende (Call-to-Action). */
export function spokenSentences(video, config) {
  return [...video.lines, ...config.cta];
}

export const spokenText = (video, config) => spokenSentences(video, config).join(' ');

/**
 * Wort-Zeiten aus der Zeichen-Ausrichtung (Format von ElevenLabs "with-timestamps":
 * characters[], character_start_times_seconds[], character_end_times_seconds[]).
 */
export function wordsFromAlignment(alignment) {
  const { characters: ch, character_start_times_seconds: st, character_end_times_seconds: en } = alignment || {};
  if (!ch?.length || ch.length !== st?.length || ch.length !== en?.length) throw new Error('Ungültige Zeitangaben der Stimme');
  const words = [];
  let cur = null;
  for (let i = 0; i < ch.length; i++) {
    if (/\s/.test(ch[i])) {
      if (cur) words.push(cur);
      cur = null;
    } else if (!cur) {
      cur = { text: ch[i], start: st[i], end: en[i] };
    } else {
      cur.text += ch[i];
      cur.end = en[i];
    }
  }
  if (cur) words.push(cur);
  return words;
}

/** Ersatz-Zeiten, wenn keine echten vorliegen (Testmodus): ca. 15 Zeichen pro Sekunde. */
export function estimateAlignment(text, charsPerSecond = 15) {
  const characters = [...text];
  const step = 1 / charsPerSecond;
  return {
    characters,
    character_start_times_seconds: characters.map((_, i) => +(i * step).toFixed(4)),
    character_end_times_seconds: characters.map((_, i) => +((i + 1) * step).toFixed(4)),
  };
}

/**
 * Teilt das Video an Satzenden in Abschnitte von höchstens `maxSeconds`
 * (Video-KIs erzeugen nur kurze Clips). Ein einzelner zu langer Satz bleibt ganz.
 * Die Abschnitte schließen lückenlos aneinander an (Schnitt in der Mitte der Satzpause).
 */
export function splitSegments(words, maxSeconds) {
  if (!words.length) throw new Error('Kein Text');
  const sentenceEnds = words.map((w, i) => (/[.!?]["')\]]?$/.test(w.text) ? i : -1)).filter((i) => i >= 0);
  if (sentenceEnds.at(-1) !== words.length - 1) sentenceEnds.push(words.length - 1);
  const raw = [];
  let first = 0;
  let lastEnd = -1;
  for (const endIdx of sentenceEnds) {
    const segStart = first === 0 ? 0 : words[first].start;
    if (words[endIdx].end - segStart > maxSeconds && lastEnd >= first) {
      raw.push({ first, last: lastEnd });
      first = lastEnd + 1;
    }
    lastEnd = endIdx;
  }
  raw.push({ first, last: words.length - 1 });
  return raw.map((s, i) => {
    const start = i === 0 ? 0 : (words[raw[i - 1].last].end + words[s.first].start) / 2;
    const end = i === raw.length - 1 ? words[s.last].end + 0.35 : (words[s.last].end + words[raw[i + 1].first].start) / 2;
    return { ...s, start, end, text: words.slice(s.first, s.last + 1).map((w) => w.text).join(' ') };
  });
}

/** Untertitel-Häppchen: max. 3 Wörter / 16 Zeichen, neues Häppchen nach Satzzeichen. */
export function captionChunks(words) {
  const chunks = [];
  let group = [];
  const flush = () => {
    if (!group.length) return;
    chunks.push({ start: group[0].start, end: group.at(-1).end, text: group.map((w) => w.text).join(' ') });
    group = [];
  };
  for (const w of words) {
    const text = [...group, w].map((x) => x.text).join(' ');
    if (group.length && (group.length >= 3 || text.length > 16)) flush();
    group.push(w);
    if (/[.!?,:;]$/.test(w.text)) flush();
  }
  flush();
  // Kurze Pausen überbrücken, damit die Untertitel nicht flackern.
  for (let i = 0; i < chunks.length - 1; i++) {
    if (chunks[i + 1].start - chunks[i].end < 0.6) chunks[i].end = chunks[i + 1].start;
  }
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

/** Untertiteldatei (ASS) für 1080x1920: Serien-Label, Hook oben, Untertitel unten-mittig. */
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
  const lines = [
    `Dialogue: 0,${assTime(0)},${assTime(total)},Label,,0,0,0,,${assEscape(`${config.seriesLabel} · DAY ${video.day}`)}`,
    `Dialogue: 0,${assTime(0)},${assTime(HOOK_SECONDS)},Hook,,0,0,0,,{\\fad(0,200)}${assEscape(video.hook.toUpperCase())}`,
    `Dialogue: 0,${assTime(0)},${assTime(HOOK_SECONDS)},Small,,0,0,0,,{\\fad(0,200)}${assEscape(config.disclaimerShort)}`,
  ];
  for (const c of chunks) {
    lines.push(
      `Dialogue: 1,${assTime(c.start)},${assTime(c.end)},Caption,,0,0,0,,{\\pos(540,1240)\\fscx85\\fscy85\\t(0,90,\\fscx100\\fscy100)}${assEscape(c.text.toUpperCase())}`,
    );
  }
  return header + lines.join('\n') + '\n';
}

/** Beschreibungstext für TikTok/Instagram. */
export function buildCaption(video, config) {
  return [video.caption, config.captionFooter, config.hashtags.join(' ')].join('\n\n');
}

const STYLE =
  'Same character as in the reference image, same face, hair and outfit (plain dark navy crewneck sweatshirt with no text or logo, thin gold chain, gold wristwatch, black cargo pants, white chunky sneakers). Early 2000s PlayStation 2 pre-rendered CGI cutscene style, stylized slightly plastic 3D look, not photorealistic, not anime.';

const POSE_IMAGE = {
  walk: 'He walks toward the camera mid-stride, talking to the viewer, one hand gesturing confidently. Framed from the knees up.',
  sit: 'He sits relaxed and confident, leaning slightly forward, talking to the viewer, one hand gesturing. Framed from the waist up.',
};

/** Prompt für das Startbild einer Umgebung/Haltung. */
export function imagePrompt(scene, pose, config) {
  if (!POSE_IMAGE[pose]) throw new Error(`Unbekannte Haltung: ${pose}`);
  return `${STYLE} ${POSE_IMAGE[pose]} Location: ${scene.setting}. ${config.ai.prompts.background} Vertical 9:16 composition.`;
}

/** Prompt für einen Clip. Beim Laufen: erster Clip läuft auf die Kamera zu, danach steht er. */
export function videoPrompt(pose, segmentIndex, config) {
  const p = config.ai.prompts;
  if (pose === 'sit') return p.sit;
  return segmentIndex === 0 ? p.walk : p.stand;
}
