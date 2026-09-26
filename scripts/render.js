// Rendert die Videos: Stimme (Piper) → 3D-Bilder (Chromium/three.js) → MP4 mit Untertiteln (ffmpeg).
// Aufruf: npm run render                  (alle 55)
//         npm run render -- --only 1,2,3  (bestimmte Tage)
import { spawn } from 'node:child_process';
import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { chromium } from 'playwright';
import { VIDEOS } from '../content/videos.js';
import { startServer } from './lib/server.js';
import {
  FPS, SPEECH_START, TAIL, WALK_DURATION,
  buildAss, buildCaption, captionChunks, hash, planGestures, spokenSentences, toSpeech,
} from './lib/timeline.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const config = JSON.parse(await readFile(path.join(root, 'content/config.json'), 'utf8'));
const { values } = parseArgs({
  options: {
    only: { type: 'string' },
    out: { type: 'string', default: 'output' },
  },
});

const days = values.only ? new Set(values.only.split(',').map(Number)) : null;
const videos = VIDEOS.filter((v) => !days || days.has(v.day));
if (!videos.length) throw new Error('Keine passenden Videos gefunden');
const outDir = path.resolve(root, values.out);
await mkdir(outDir, { recursive: true });

const voiceModel = path.join(root, 'node_modules/vowel-lab-voices-float/float.onnx');
const fontDir = await mkdtemp(path.join(tmpdir(), 'fonts-'));
for (const f of ['900Black/Montserrat_900Black.ttf', '800ExtraBold/Montserrat_800ExtraBold.ttf']) {
  await copyFile(path.join(root, 'node_modules/@expo-google-fonts/montserrat', f), path.join(fontDir, path.basename(f)));
}

function run(cmd, args, input) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: ['pipe', 'pipe', 'pipe'] });
    let out = '';
    let err = '';
    p.stdout.on('data', (d) => (out += d));
    p.stderr.on('data', (d) => (err += d));
    p.on('error', reject);
    p.on('close', (code) => (code === 0 ? resolve(out) : reject(new Error(`${cmd} fehlgeschlagen (${code}):\n${err.slice(-2000)}`))));
    p.stdin.end(input);
  });
}

async function renderVideo(page, video) {
  const slug = `day-${String(video.day).padStart(2, '0')}`;
  const work = await mkdtemp(path.join(tmpdir(), `${slug}-`));
  try {
    const sentences = spokenSentences(video, config);
    const wav = path.join(work, 'voice.wav');
    const tts = JSON.parse(await run(process.env.PYTHON || 'python3', [path.join(root, 'scripts/tts.py')],
      JSON.stringify({ model: voiceModel, sentences: sentences.map(toSpeech), out: wav, fps: FPS })));

    const total = SPEECH_START + tts.duration + TAIL;
    const gestures = planGestures(video, config, tts.sentences);
    const chunks = captionChunks(sentences, tts.sentences);
    const assFile = path.join(work, 'subs.ass');
    await writeFile(assFile, buildAss({ video, chunks, total, config }));

    await page.evaluate((c) => window.setupScene(c), {
      seed: hash(video.id), fps: FPS, walkDur: WALK_DURATION, speechStart: SPEECH_START,
      envelope: tts.envelope, gestures,
    });

    const mp4 = path.join(outDir, `${slug}.mp4`);
    const delay = Math.round(SPEECH_START * 1000);
    const ff = spawn('ffmpeg', [
      '-v', 'error', '-y',
      '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-',
      '-i', wav,
      '-filter_complex',
      `[0:v]scale=1080:1920:flags=neighbor,ass=${assFile}:fontsdir=${fontDir}[v];[1:a]adelay=${delay}|${delay},apad,loudnorm=I=-14:TP=-1.5[a]`,
      '-map', '[v]', '-map', '[a]', '-t', total.toFixed(3),
      '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p', '-r', String(FPS),
      '-c:a', 'aac', '-b:a', '160k', '-ar', '44100', '-movflags', '+faststart', mp4,
    ], { stdio: ['pipe', 'inherit', 'pipe'] });
    let ffErr = '';
    ff.stderr.on('data', (d) => (ffErr += d));
    const done = new Promise((resolve, reject) => {
      ff.on('error', reject);
      ff.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`ffmpeg (${code}): ${ffErr}`))));
    });

    const frames = Math.ceil(total * FPS);
    for (let i = 0; i < frames; i++) {
      const dataUrl = await page.evaluate((t) => window.renderAt(t), i / FPS);
      const png = Buffer.from(dataUrl.slice(dataUrl.indexOf(',') + 1), 'base64');
      if (!ff.stdin.write(png)) await new Promise((r) => ff.stdin.once('drain', r));
    }
    ff.stdin.end();
    await done;

    await writeFile(path.join(outDir, `${slug}.txt`), buildCaption(video, config) + '\n');
    return { slug, seconds: total };
  } finally {
    await rm(work, { recursive: true, force: true });
  }
}

const server = await startServer(root);
const browser = await chromium.launch({
  ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}),
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
try {
  const page = await browser.newPage({ viewport: { width: 360, height: 640 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`http://127.0.0.1:${server.address().port}/render/index.html`);
  await page.waitForFunction(() => window.sceneReady === true, null, { timeout: 30000 });
  if (errors.length) throw new Error(`Fehler in der 3D-Szene: ${errors.join('; ')}`);

  for (const video of videos) {
    const t0 = Date.now();
    const { slug, seconds } = await renderVideo(page, video);
    console.log(`✓ ${slug}  ${seconds.toFixed(1)} s Video  (${((Date.now() - t0) / 1000).toFixed(0)} s Renderzeit)  ${video.hook}`);
    if (errors.length) throw new Error(`Fehler in der 3D-Szene: ${errors.join('; ')}`);
  }
} finally {
  await browser.close();
  server.close();
  await rm(fontDir, { recursive: true, force: true });
}
