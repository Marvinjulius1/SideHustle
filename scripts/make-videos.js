// Erzeugt die Videos: Stimme → Startbild je Umgebung → KI-Clips → Schnitt + Untertitel.
//
//   npm run videos -- --only 1,2 --images-only   nur Startbilder (günstig, zum Prüfen des Looks)
//   npm run videos -- --only 1                   ein komplettes Video
//   npm run videos                               alle 55
//   npm run videos -- --dry-run                  Testlauf ohne Internet und ohne Kosten
//
// Bereits erzeugte (bezahlte) Teile liegen in cache/ und werden wiederverwendet.
import { copyFile, mkdir, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { VIDEOS } from '../content/videos.js';
import { assignScenes } from './lib/plan.js';
import { makeProviders } from './lib/providers.js';
import { assemble, cutAudio, normalizeClip } from './lib/media.js';
import {
  buildAss, buildCaption, captionChunks, hash, imagePrompt, splitSegments, spokenText, videoPrompt, wordsFromAlignment,
} from './lib/timeline.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const config = JSON.parse(await readFile(path.join(root, 'content/config.json'), 'utf8'));
const { values: args } = parseArgs({
  options: {
    only: { type: 'string' },
    'dry-run': { type: 'boolean', default: false },
    'images-only': { type: 'boolean', default: false },
    out: { type: 'string', default: 'output' },
    cache: { type: 'string', default: 'cache' },
  },
});

const dryRun = args['dry-run'];
const days = args.only ? new Set(args.only.split(',').map((s) => Number(s.trim()))) : null;
const plan = assignScenes(VIDEOS);
const jobs = VIDEOS.map((v, i) => ({ video: v, ...plan[i] })).filter((j) => !days || days.has(j.day));
if (!jobs.length) throw new Error('Keine passenden Tage gefunden (--only)');

const outDir = path.resolve(root, args.out);
const cacheDir = path.resolve(root, args.cache, dryRun ? 'dry-run' : 'live');
await mkdir(outDir, { recursive: true });
await mkdir(cacheDir, { recursive: true });

// Schriften für die Untertitel in einen Ordner legen
const fontsDir = await mkdtemp(path.join(tmpdir(), 'fonts-'));
const fontPkg = path.join(root, 'node_modules/@expo-google-fonts/montserrat');
for (const f of ['900Black/Montserrat_900Black.ttf', '800ExtraBold/Montserrat_800ExtraBold.ttf']) {
  await copyFile(path.join(fontPkg, f), path.join(fontsDir, path.basename(f)));
}
const fontFile = path.join(fontsDir, 'Montserrat_900Black.ttf');
const providers = makeProviders({ dryRun, config, fontFile });

const exists = (f) => stat(f).then(() => true, () => false);
const fileHash = async (f) => hash((await readFile(f)).toString('base64'));

const referenceFile = path.join(root, config.ai.images.reference);
if (!dryRun && !(await exists(referenceFile))) {
  throw new Error(`Charakterbild fehlt: ${config.ai.images.reference}. Bitte das Porträt aus Canva dort ablegen.`);
}
const refHash = (await exists(referenceFile)) ? await fileHash(referenceFile) : 'none';

/** Startbild pro Umgebung + Haltung (einmal erzeugen, dann wiederverwenden). */
async function sceneImage(scene, pose) {
  const prompt = imagePrompt(scene, pose, config);
  const file = path.join(cacheDir, `scene-${scene.id}-${pose}-${hash(prompt + config.ai.image.model + refHash)}.jpg`);
  if (!(await exists(file))) {
    console.log(`  Startbild: ${scene.id} (${pose}) …`);
    await providers.image({ prompt, referenceFile, outFile: file, label: `${scene.id} / ${pose}` });
  }
  await mkdir(path.join(outDir, 'scenes'), { recursive: true });
  await copyFile(file, path.join(outDir, 'scenes', `${scene.id}-${pose}.jpg`));
  return file;
}

/** Stimme für das ganze Video (einmal pro Text). */
async function speech(text) {
  const key = hash(text + JSON.stringify(config.ai.voice));
  const audioFile = path.join(cacheDir, `voice-${key}.mp3`);
  const alignFile = path.join(cacheDir, `voice-${key}.json`);
  if (!(await exists(audioFile)) || !(await exists(alignFile))) {
    console.log('  Stimme …');
    const alignment = await providers.speech({ text, audioFile });
    await writeFile(alignFile, JSON.stringify(alignment));
  }
  return { audioFile, alignment: JSON.parse(await readFile(alignFile, 'utf8')) };
}

async function clip({ imageFile, audioFile, prompt, label }) {
  const key = hash(prompt + config.ai.video.model + JSON.stringify(config.ai.video.input) + (await fileHash(imageFile)) + (await fileHash(audioFile)));
  const file = path.join(cacheDir, `clip-${key}.mp4`);
  if (!(await exists(file))) {
    console.log(`  Clip: ${label} …`);
    await providers.video({ imageFile, audioFile, prompt, outFile: file, label });
  }
  return file;
}

async function makeVideo({ video, scene, pose }) {
  const slug = `day-${String(video.day).padStart(2, '0')}`;
  console.log(`${slug}: ${scene.id} (${pose}) – ${video.hook}`);
  const imageFile = await sceneImage(scene, pose);
  if (args['images-only']) return;

  const text = spokenText(video, config);
  const { audioFile, alignment } = await speech(text);
  const words = wordsFromAlignment(alignment);
  const joined = words.map((w) => w.text).join(' ');
  if (joined !== text.split(/\s+/).join(' ')) throw new Error(`${slug}: Zeitangaben passen nicht zum Text`);
  const segments = splitSegments(words, config.ai.video.maxSegmentSeconds);
  const total = segments.at(-1).end;

  const work = await mkdtemp(path.join(tmpdir(), `${slug}-`));
  try {
    const clips = [];
    for (const [i, seg] of segments.entries()) {
      const segAudio = path.join(work, `seg-${i}.mp3`);
      await cutAudio(audioFile, seg.start, seg.end, segAudio);
      const raw = await clip({ imageFile, audioFile: segAudio, prompt: videoPrompt(pose, i, config), label: `${slug} Teil ${i + 1}/${segments.length}` });
      const norm = path.join(work, `clip-${i}.mp4`);
      // Abwechselnd leicht heranzoomen: wirkt wie ein Schnitt zwischen zwei Kameras
      await normalizeClip(raw, seg.end - seg.start, i % 2 ? 1.12 : 1, norm);
      clips.push(norm);
    }
    const assFile = path.join(work, 'subs.ass');
    await writeFile(assFile, buildAss({ video, chunks: captionChunks(words), total, config }));
    await assemble({ clips, audio: audioFile, assFile, fontsDir, total, out: path.join(outDir, `${slug}.mp4`) });
    await writeFile(path.join(outDir, `${slug}.txt`), buildCaption(video, config) + '\n');
    console.log(`  ✓ ${slug}.mp4 (${total.toFixed(1)} s, ${segments.length} Clips)`);
  } finally {
    await rm(work, { recursive: true, force: true });
  }
}

const failed = [];
try {
  for (const job of jobs) {
    try {
      await makeVideo(job);
    } catch (e) {
      console.error(`✗ Tag ${job.day}: ${e.message}`);
      failed.push(job.day);
      // Fehlende Schlüssel/Einstellungen betreffen alle Videos → sofort abbrechen
      if (/fehlt/.test(e.message)) break;
    }
  }
} finally {
  await rm(fontsDir, { recursive: true, force: true });
}
if (failed.length) {
  console.error(`\nFehlgeschlagen: Tag ${failed.join(', ')}`);
  process.exit(1);
}
