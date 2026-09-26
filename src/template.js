import { TYPE_LABELS } from './plan.js';

export const WIDTH = 1080;
export const HEIGHT = 1350;

const escapeHtml = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

/** Escaped Text; *Hervorhebungen* werden farbig, Zeilenumbrüche zu Absätzen. */
export function richText(s) {
  return s
    .split('\n')
    .map((line) => `<p>${escapeHtml(line).replace(/\*([^*]+)\*/g, '<mark>$1</mark>')}</p>`)
    .join('');
}

/** HTML für ein Post-Bild. `fontDir` ist eine file://-URL zum Ordner mit den Inter-Schriften. */
export function renderHtml(post, config, fontDir) {
  const c = config.colors;
  const accent = c[post.type];
  const font = (w) =>
    `@font-face{font-family:Inter;font-weight:${w};src:url("${fontDir}/inter-latin-${w}-normal.woff2") format("woff2");}`;
  const bodyPrefix = post.type === 'mythos' ? '<p class="truth">Die Wahrheit:</p>' : '';
  return `<!doctype html><html lang="de"><head><meta charset="utf-8"><style>
${[400, 700, 900].map(font).join('\n')}
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:${WIDTH}px;height:${HEIGHT}px}
body{background:${c.background};color:${c.text};font-family:Inter,sans-serif;display:flex;flex-direction:column;padding:96px 88px 72px;position:relative;overflow:hidden}
body::before{content:"";position:absolute;right:-260px;top:-260px;width:640px;height:640px;border-radius:50%;background:${accent};opacity:.12}
.label{align-self:flex-start;background:${accent};color:${c.background};font-weight:900;font-size:30px;letter-spacing:.12em;text-transform:uppercase;padding:12px 26px;border-radius:999px}
.main{flex:1;display:flex;flex-direction:column;justify-content:center;gap:48px;min-height:0}
.h1{font-weight:900;font-size:84px;line-height:1.08;letter-spacing:-.02em}
.body{font-size:44px;line-height:1.4;color:${c.text}}
.body p+p{margin-top:22px}
.truth{color:${accent};font-weight:700}
mark{background:none;color:${accent};font-weight:700}
.note{font-size:26px;color:${c.muted}}
footer{display:flex;justify-content:space-between;align-items:flex-end;gap:24px;border-top:2px solid ${c.muted}40;padding-top:28px;font-size:28px;color:${c.muted}}
footer strong{color:${c.text};font-size:34px}
</style></head><body>
<div class="label">${escapeHtml(TYPE_LABELS[post.type])}</div>
<div class="main" id="main">
<div class="h1" id="title">${richText(post.title)}</div>
<div class="body" id="body">${bodyPrefix}${richText(post.body)}</div>
${post.note ? `<div class="note">${escapeHtml(post.note)}</div>` : ''}
</div>
<footer><strong>${escapeHtml(config.handle)}</strong><span>${escapeHtml(config.disclaimer)}</span></footer>
<script>
Promise.all(['400 44px Inter', '700 44px Inter', '900 84px Inter'].map((f) => document.fonts.load(f))).then(() => {
  // Schrift verkleinern, bis alles in den Bereich passt.
  const main = document.getElementById('main');
  const title = document.getElementById('title');
  const body = document.getElementById('body');
  let t = 84, b = 44;
  while (main.scrollHeight > main.clientHeight && b > 24) {
    t -= 4; b -= 2;
    title.style.fontSize = t + 'px';
    body.style.fontSize = b + 'px';
  }
  window.__overflow = main.scrollHeight > main.clientHeight;
  window.__ready = true;
});
</script>
</body></html>`;
}
