// Reine Logik ohne Netzwerk/ffmpeg: Text, Wort-Zeiten, Schnitt-Segmente, Prompts. Wird getestet.

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

/** Beschreibungstext für TikTok/Instagram. */
export function buildCaption(video, config) {
  return [video.caption, config.captionFooter, config.hashtags.join(' ')].join('\n\n');
}

const STYLE =
  'Same character as in the reference images (face from the first, full outfit from the second), same face, hair and outfit (plain dark navy crewneck sweatshirt with no text or logo, thin gold chain, gold wristwatch, black cargo pants, white chunky sneakers). Early 2000s PlayStation 2 pre-rendered CGI cutscene style, stylized slightly plastic 3D look, not photorealistic, not anime.';

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
