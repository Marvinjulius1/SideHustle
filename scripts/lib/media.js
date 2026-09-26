// ffmpeg-Hilfen: Clips vereinheitlichen und zusammensetzen.
import { spawn } from 'node:child_process';

export function ffmpeg(args) {
  return new Promise((resolve, reject) => {
    const p = spawn('ffmpeg', ['-v', 'error', '-y', ...args], { stdio: ['ignore', 'ignore', 'pipe'] });
    let err = '';
    p.stderr.on('data', (d) => (err += d));
    p.on('error', (e) => reject(new Error(`ffmpeg nicht gefunden (${e.message}). Bitte ffmpeg installieren.`)));
    p.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`ffmpeg fehlgeschlagen:\n${err.slice(-1500)}`))));
  });
}

export function probeDuration(file) {
  return new Promise((resolve, reject) => {
    const p = spawn('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file]);
    let out = '';
    p.stdout.on('data', (d) => (out += d));
    p.on('error', reject);
    p.on('close', (code) => {
      const d = parseFloat(out);
      code === 0 && Number.isFinite(d) ? resolve(d) : reject(new Error(`Dauer von ${file} nicht lesbar`));
    });
  });
}

/** Audio-Ausschnitt [start, end) als MP3. */
export function cutAudio(src, start, end, out) {
  return ffmpeg(['-ss', start.toFixed(3), '-to', end.toFixed(3), '-i', src, '-c:a', 'libmp3lame', '-b:a', '160k', out]);
}

/**
 * Bringt einen KI-Clip auf 1080x1920 / 30 fps / exakt `duration` Sekunden (ohne Ton).
 * Ist der Clip kürzer, wird das letzte Bild gehalten. `zoom` > 1 = engerer Ausschnitt (Jump-Cut-Effekt).
 */
export function normalizeClip(src, duration, zoom, out) {
  const w = Math.round(1080 * zoom);
  const h = Math.round(1920 * zoom);
  const vf = [
    `scale=${w}:${h}:force_original_aspect_ratio=increase`,
    `crop=1080:1920`,
    'setsar=1',
    'fps=30',
    `tpad=stop_mode=clone:stop_duration=${Math.ceil(duration) + 1}`,
    `trim=duration=${duration.toFixed(3)}`,
    'setpts=PTS-STARTPTS',
  ].join(',');
  return ffmpeg(['-i', src, '-an', '-vf', vf, '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', out]);
}

/** Clips aneinanderhängen und die Stimme drunterlegen (ohne Schrift im Bild). */
export function assemble({ clips, audio, total, out }) {
  const inputs = clips.flatMap((c) => ['-i', c]);
  const concat = clips.map((_, i) => `[${i}:v]`).join('') + `concat=n=${clips.length}:v=1:a=0[cat]`;
  const a = clips.length;
  return ffmpeg([
    ...inputs, '-i', audio,
    '-filter_complex', `${concat};[${a}:a]apad,loudnorm=I=-14:TP=-1.5[a]`,
    '-map', '[cat]', '-map', '[a]', '-t', total.toFixed(3),
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p', '-r', '30',
    '-c:a', 'aac', '-b:a', '160k', '-ar', '44100', '-movflags', '+faststart', out,
  ]);
}
