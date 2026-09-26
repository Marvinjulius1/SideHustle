// Anbindung an die KI-Dienste (ElevenLabs für die Stimme, fal.ai für Bilder und Videos)
// plus Test-Ersatz ("dry run"), der ohne Internet und ohne Kosten läuft.
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createFalClient } from '@fal-ai/client';
import { estimateAlignment } from './timeline.js';
import { ffmpeg } from './media.js';

const MIME = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.mp3': 'audio/mpeg', '.wav': 'audio/wav' };

function requireEnv(name, hint) {
  const v = process.env[name];
  if (!v) throw new Error(`${name} fehlt. ${hint}`);
  return v;
}

let falClient = null;

/**
 * Lädt eine Datei in den Speicher von fal.ai und gibt den Link zurück.
 * (Die Video-KI akzeptiert keine eingebetteten Dateien, nur Links.)
 */
async function falUpload(file) {
  const type = MIME[path.extname(file).toLowerCase()];
  if (!type) throw new Error(`Unbekannter Dateityp: ${file}`);
  falClient ??= createFalClient({ credentials: requireEnv('FAL_KEY', 'Als GitHub-Secret hinterlegen (siehe README).') });
  try {
    return await falClient.storage.upload(new Blob([await readFile(file)], { type }));
  } catch (e) {
    const status = e?.status ? `HTTP ${e.status} – ` : '';
    throw new Error(`fal.ai Upload (${path.basename(file)}): ${status}${e?.message || e}`);
  }
}

/** Ersetzt {image}/{images}/{audio}/{prompt} in einer beliebig verschachtelten Vorlage ({images} = Liste). */
export function fillTemplate(template, values) {
  if (typeof template === 'string') {
    const m = template.match(/^\{(\w+)\}$/);
    if (m) {
      if (!(m[1] in values)) throw new Error(`Platzhalter {${m[1]}} hat keinen Wert`);
      return values[m[1]];
    }
    return template;
  }
  if (Array.isArray(template)) return template.map((t) => fillTemplate(t, values));
  if (template && typeof template === 'object') {
    return Object.fromEntries(Object.entries(template).map(([k, v]) => [k, fillTemplate(v, values)]));
  }
  return template;
}

/** Liest z. B. "images.0.url" aus einem Objekt. */
export function getPath(obj, dotted) {
  const v = dotted.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
  if (v === undefined) throw new Error(`Feld "${dotted}" fehlt in der Antwort: ${JSON.stringify(obj).slice(0, 500)}`);
  return v;
}

async function fetchJson(url, init, what) {
  const res = await fetch(url, init);
  const text = await res.text();
  if (!res.ok) throw new Error(`${what}: HTTP ${res.status} – ${text.slice(0, 800)}`);
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`${what}: keine gültige JSON-Antwort – ${text.slice(0, 300)}`);
  }
}

async function download(url, file) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download fehlgeschlagen: HTTP ${res.status} (${url})`);
  await writeFile(file, Buffer.from(await res.arrayBuffer()));
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------- ElevenLabs

async function elevenLabsSpeech({ text, voice, audioFile }) {
  const key = requireEnv('ELEVENLABS_API_KEY', 'Als GitHub-Secret hinterlegen (siehe README).');
  if (!voice.voiceId || voice.voiceId.startsWith('HIER_')) throw new Error('voiceId fehlt in content/config.json (ai.voice.voiceId).');
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voice.voiceId)}/with-timestamps?output_format=mp3_44100_128`;
  const json = await fetchJson(url, {
    method: 'POST',
    headers: { 'xi-api-key': key, 'content-type': 'application/json' },
    body: JSON.stringify({ text, model_id: voice.model, voice_settings: voice.settings }),
  }, 'ElevenLabs');
  await writeFile(audioFile, Buffer.from(getPath(json, 'audio_base64'), 'base64'));
  return getPath(json, 'alignment');
}

// ---------------------------------------------------------------- fal.ai (Queue-API)

async function falRun(model, input) {
  const key = requireEnv('FAL_KEY', 'Als GitHub-Secret hinterlegen (siehe README).');
  const headers = { authorization: `Key ${key}`, 'content-type': 'application/json' };
  const job = await fetchJson(`https://queue.fal.run/${model}`, { method: 'POST', headers, body: JSON.stringify(input) }, `fal.ai (${model})`);
  const statusUrl = getPath(job, 'status_url');
  const responseUrl = getPath(job, 'response_url');
  const deadline = Date.now() + 30 * 60 * 1000;
  for (;;) {
    const st = await fetchJson(statusUrl, { headers }, `fal.ai Status (${model})`);
    if (st.status === 'COMPLETED') break;
    if (!['IN_QUEUE', 'IN_PROGRESS'].includes(st.status)) throw new Error(`fal.ai (${model}): Status ${st.status} – ${JSON.stringify(st).slice(0, 500)}`);
    if (Date.now() > deadline) throw new Error(`fal.ai (${model}): Zeitüberschreitung nach 30 Minuten`);
    await sleep(5000);
  }
  return fetchJson(responseUrl, { headers }, `fal.ai Ergebnis (${model})`);
}

async function falImage({ prompt, referenceFiles, outFile, cfg }) {
  const images = await Promise.all(referenceFiles.map(falUpload));
  const input = fillTemplate(cfg.input, { prompt, images, image: images[0] });
  const out = await falRun(cfg.model, input);
  await download(getPath(out, cfg.outputPath), outFile);
}

async function falVideo({ prompt, imageFile, audioFile, outFile, cfg }) {
  const input = fillTemplate(cfg.input, { prompt, image: await falUpload(imageFile), audio: await falUpload(audioFile) });
  const out = await falRun(cfg.model, input);
  await download(getPath(out, cfg.outputPath), outFile);
}

// ---------------------------------------------------------------- Test-Ersatz (ohne Internet)

async function fakeSpeech({ text, audioFile }) {
  const alignment = estimateAlignment(text);
  const dur = alignment.character_end_times_seconds.at(-1);
  await ffmpeg(['-f', 'lavfi', '-i', `sine=frequency=220:duration=${dur}`, '-af', 'volume=0.05', '-c:a', 'libmp3lame', '-b:a', '128k', audioFile]);
  return alignment;
}

async function fakeImage({ outFile }) {
  await ffmpeg(['-f', 'lavfi', '-i', 'gradients=s=1080x1920:c0=0x1d2a4a:c1=0x0b1020:duration=1', '-frames:v', '1', outFile]);
}

async function fakeVideo({ imageFile, audioFile, outFile }) {
  await ffmpeg(['-loop', '1', '-i', imageFile, '-i', audioFile,
    '-vf', "scale=720:1280,zoompan=z='min(zoom+0.0008,1.2)':d=1:s=720x1280:fps=25",
    '-shortest', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-c:a', 'aac', outFile]);
}

/** Vorschau ohne Video-KI: Standbild mit langsamer Kamerafahrt auf die Figur zu. */
async function stillVideo({ imageFile, audioFile, outFile }) {
  await ffmpeg(['-loop', '1', '-i', imageFile, '-i', audioFile,
    '-vf', "scale=2160:3840:force_original_aspect_ratio=increase,crop=2160:3840,zoompan=z='min(1+0.00035*on,1.4)':x='iw/2-(iw/zoom/2)':y='ih*0.28-(ih/zoom*0.28)':d=1:s=1080x1920:fps=30",
    '-shortest', '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-c:a', 'aac', outFile]);
}

export function makeProviders({ dryRun, preview, config }) {
  if (preview) {
    return {
      speech: (a) => elevenLabsSpeech({ ...a, voice: config.ai.voice }),
      image: () => {
        throw new Error('Vorschau-Modus: für diese Umgebung gibt es kein festes Startbild (nur Tage mit festem Bild möglich).');
      },
      video: (a) => stillVideo(a),
    };
  }
  if (dryRun) {
    return {
      speech: (a) => fakeSpeech(a),
      image: (a) => fakeImage(a),
      video: (a) => fakeVideo(a),
    };
  }
  return {
    speech: (a) => elevenLabsSpeech({ ...a, voice: config.ai.voice }),
    image: (a) => falImage({ ...a, cfg: config.ai.image }),
    video: (a) => falVideo({ ...a, cfg: config.ai.video }),
  };
}
