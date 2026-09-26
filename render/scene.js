// 3D-Szene: Penthouse bei Nacht im Winter, Figur läuft zur Kamera, bleibt stehen und redet.
// Deterministisch: renderAt(t) zeigt für dieselbe Zeit immer dasselbe Bild.
import * as THREE from 'three';
import { buildCharacter } from './character.js';
import { GESTURES, REST } from './gestures.js';

const W = 360;
const H = 640;

// ---------- Hilfsfunktionen ----------
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const clamp01 = (x) => Math.min(1, Math.max(0, x));
const smooth = (x) => { x = clamp01(x); return x * x * (3 - 2 * x); };
const lerp = (a, b, k) => a + (b - a) * k;

function canvasTexture(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d'), w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.generateMipmaps = false;
  return tex;
}

// ---------- Renderer + PS2-Nachbearbeitung ----------
const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(W, H, false);

const target = new THREE.WebGLRenderTarget(W, H, { magFilter: THREE.NearestFilter, minFilter: THREE.NearestFilter });
const post = new THREE.ShaderMaterial({
  uniforms: { tDiffuse: { value: target.texture } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
  fragmentShader: `
    uniform sampler2D tDiffuse; varying vec2 vUv;
    float bayer(vec2 p){ // 4x4 Bayer-Matrix
      int x = int(mod(p.x, 4.0)); int y = int(mod(p.y, 4.0)); int i = x + y * 4;
      float m[16] = float[16](0.,8.,2.,10.,12.,4.,14.,6.,3.,11.,1.,9.,15.,7.,13.,5.);
      for (int k = 0; k < 16; k++) if (k == i) return m[k] / 16.0 - 0.5;
      return 0.0;
    }
    void main(){
      gl_FragColor = texture2D(tDiffuse, vUv);
      #include <colorspace_fragment>
      // 15-Bit-Farbe mit Dithering wie auf der PS2
      vec3 c = gl_FragColor.rgb + bayer(gl_FragCoord.xy) / 31.0;
      c = floor(c * 31.0 + 0.5) / 31.0;
      // leichte Vignette
      vec2 d = vUv - 0.5; c *= 1.0 - dot(d, d) * 0.55;
      gl_FragColor = vec4(c, 1.0);
    }`,
  depthTest: false,
  depthWrite: false,
});
const postScene = new THREE.Scene();
postScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), post));
const postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

// ---------- Szene ----------
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x070a18);
scene.fog = new THREE.Fog(0x0a0f22, 9, 60);

const camera = new THREE.PerspectiveCamera(38, W / H, 0.1, 200);

scene.add(new THREE.HemisphereLight(0x8a9ad8, 0x2a1e14, 1.4));
const key = new THREE.DirectionalLight(0xffd6a8, 3.2);
key.position.set(-1.2, 2.8, 4.5);
scene.add(key);
const rim = new THREE.DirectionalLight(0x6aa8ff, 2.4);
rim.position.set(2.5, 2.5, -5);
scene.add(rim);
const lampLight = new THREE.PointLight(0xffb070, 3, 6, 1.5);
lampLight.position.set(-1.6, 1.6, -2.2);
scene.add(lampLight);

const lambert = (color, opts = {}) => new THREE.MeshLambertMaterial({ color, flatShading: true, ...opts });

// Boden: dunkles Holz
const floorTex = canvasTexture(64, 64, (g, w, h) => {
  for (let y = 0; y < h; y += 8) {
    g.fillStyle = (y / 8) % 2 ? '#3a2618' : '#432c1c';
    g.fillRect(0, y, w, 8);
    g.fillStyle = '#2a1a10';
    g.fillRect(((y * 7) % 48) + 8, y, 1, 8);
    g.fillRect(0, y + 7, w, 1);
  }
});
floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping;
floorTex.repeat.set(4, 6);
const floor = new THREE.Mesh(new THREE.PlaneGeometry(9, 14), new THREE.MeshLambertMaterial({ map: floorTex }));
floor.rotation.x = -Math.PI / 2;
floor.position.z = -1;
scene.add(floor);

// Teppich
const rugTex = canvasTexture(32, 32, (g, w, h) => {
  g.fillStyle = '#5d1f25'; g.fillRect(0, 0, w, h);
  g.strokeStyle = '#c9a24a'; g.lineWidth = 2; g.strokeRect(3, 3, w - 6, h - 6);
  g.fillStyle = '#7a2a30'; g.fillRect(10, 10, w - 20, h - 20);
});
const rug = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 3.4), new THREE.MeshLambertMaterial({ map: rugTex }));
rug.rotation.x = -Math.PI / 2;
rug.position.set(0, 0.003, -0.6);
scene.add(rug);

// Rückwand mit Panoramafenster
const BACK_Z = -6.5;
const wallMat = lambert(0x2a2f3c);
for (const [x, w] of [[-3.9, 1.2], [3.9, 1.2]]) {
  const p = new THREE.Mesh(new THREE.BoxGeometry(w, 4, 0.2), wallMat);
  p.position.set(x, 2, BACK_Z);
  scene.add(p);
}
const header = new THREE.Mesh(new THREE.BoxGeometry(9, 0.6, 0.2), wallMat);
header.position.set(0, 3.7, BACK_Z);
scene.add(header);
const sill = new THREE.Mesh(new THREE.BoxGeometry(9, 0.25, 0.3), lambert(0x1c2029));
sill.position.set(0, 0.12, BACK_Z);
scene.add(sill);
for (const x of [-1.1, 1.1]) {
  const mullion = new THREE.Mesh(new THREE.BoxGeometry(0.08, 3.4, 0.12), lambert(0x14171e));
  mullion.position.set(x, 1.95, BACK_Z);
  scene.add(mullion);
}
// Seitenwände
for (const s of [-1, 1]) {
  const side = new THREE.Mesh(new THREE.BoxGeometry(0.2, 4, 14), wallMat);
  side.position.set(s * 4.5, 2, -1);
  scene.add(side);
}

// Stadt hinter dem Fenster
const city = new THREE.Group();
scene.add(city);
const windowTex = (seed) => canvasTexture(16, 32, (g, w, h) => {
  const r = rng(seed);
  g.fillStyle = '#0d1226'; g.fillRect(0, 0, w, h);
  for (let y = 1; y < h; y += 3) for (let x = 1; x < w; x += 3) {
    const v = r();
    if (v > 0.55) { g.fillStyle = v > 0.9 ? '#9fd4ff' : '#ffd27a'; g.fillRect(x, y, 2, 2); }
  }
});
{
  const r = rng(7);
  const texes = [1, 2, 3, 4].map(windowTex);
  for (let i = 0; i < 46; i++) {
    const h = 6 + r() * 30;
    const w = 2 + r() * 4;
    const m = new THREE.MeshBasicMaterial({ map: texes[i % 4], fog: true });
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, w), m);
    b.position.set(-40 + r() * 80, h / 2 - 12, BACK_Z - 18 - r() * 40);
    city.add(b);
  }
}
// Himmel + Mond
const sky = new THREE.Mesh(
  new THREE.PlaneGeometry(200, 80),
  new THREE.MeshBasicMaterial({
    map: canvasTexture(4, 64, (g, w, h) => {
      const grad = g.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#05060f'); grad.addColorStop(0.7, '#141c3d'); grad.addColorStop(1, '#2a2350');
      g.fillStyle = grad; g.fillRect(0, 0, w, h);
    }),
    fog: false,
  }),
);
sky.position.set(0, 20, BACK_Z - 70);
scene.add(sky);
const moon = new THREE.Mesh(new THREE.CircleGeometry(2.2, 10), new THREE.MeshBasicMaterial({ color: 0xe9eefc, fog: false }));
moon.position.set(9, 16, BACK_Z - 65);
scene.add(moon);

// Schnee draußen
const SNOW = 500;
const snowGeo = new THREE.BufferGeometry();
const snowPos = new Float32Array(SNOW * 3);
const snowSeed = [];
{
  const r = rng(11);
  for (let i = 0; i < SNOW; i++) snowSeed.push([r() * 16 - 8, r() * 9, BACK_Z - 0.5 - r() * 12, 0.4 + r() * 0.6, r() * 6.28]);
}
snowGeo.setAttribute('position', new THREE.BufferAttribute(snowPos, 3));
const snow = new THREE.Points(snowGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 2, sizeAttenuation: false, fog: false }));
scene.add(snow);

// Schreibtisch mit Trading-Monitoren
const chartTex = (seed) => canvasTexture(48, 30, (g, w, h) => {
  const r = rng(seed);
  g.fillStyle = '#0a0f14'; g.fillRect(0, 0, w, h);
  let y = h * 0.6;
  for (let x = 2; x < w - 2; x += 3) {
    const d = (r() - 0.42) * 6;
    const up = d < 0;
    g.fillStyle = up ? '#2bd46b' : '#f0444f';
    const top = Math.min(y, y + d);
    g.fillRect(x, top - r() * 2, 1, Math.abs(d) + 3);
    g.fillRect(x - 1 + 1, top, 2, Math.max(1, Math.abs(d)));
    y = Math.min(h - 3, Math.max(3, y + d));
  }
});
const desk = new THREE.Group();
desk.position.set(2.5, 0, -3.6);
desk.rotation.y = -0.5;
scene.add(desk);
const top = new THREE.Mesh(new THREE.BoxGeometry(2, 0.06, 0.8), lambert(0x15161a));
top.position.y = 0.76;
desk.add(top);
for (const x of [-0.9, 0.9]) {
  const leg = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.76, 0.7), lambert(0x101114));
  leg.position.set(x, 0.38, 0);
  desk.add(leg);
}
[-0.62, 0, 0.62].forEach((x, i) => {
  const mon = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.36, 0.03), lambert(0x0c0c0e));
  mon.position.set(x, 1.1, -0.2);
  mon.rotation.y = -x * 0.5;
  desk.add(mon);
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.54, 0.32), new THREE.MeshBasicMaterial({ map: chartTex(20 + i) }));
  screen.position.set(0, 0, 0.017);
  mon.add(screen);
  const stand = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.2, 0.04), lambert(0x0c0c0e));
  stand.position.set(x, 0.88, -0.2);
  desk.add(stand);
});
const screenGlow = new THREE.PointLight(0x3cff9a, 1.2, 3, 2);
screenGlow.position.set(2.3, 1.2, -3.2);
scene.add(screenGlow);

// Stehlampe
const lamp = new THREE.Group();
lamp.position.set(-1.9, 0, -2.6);
scene.add(lamp);
const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.6, 5), lambert(0x222222));
pole.position.y = 0.8;
lamp.add(pole);
const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.26, 0.3, 8, 1, true), new THREE.MeshBasicMaterial({ color: 0xffd9a0, side: THREE.DoubleSide }));
shade.position.y = 1.65;
lamp.add(shade);

// Sofa links
const sofa = new THREE.Group();
sofa.position.set(-2.9, 0, -4.2);
sofa.rotation.y = 0.6;
scene.add(sofa);
const sofaMat = lambert(0xcfc6b8);
const seat = new THREE.Mesh(new THREE.BoxGeometry(2, 0.4, 0.9), sofaMat);
seat.position.y = 0.3;
sofa.add(seat);
const back = new THREE.Mesh(new THREE.BoxGeometry(2, 0.6, 0.25), sofaMat);
back.position.set(0, 0.7, -0.35);
sofa.add(back);
const pillow = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.35, 0.12), lambert(0x1d2a4a));
pillow.position.set(0.55, 0.65, -0.18);
pillow.rotation.z = 0.2;
sofa.add(pillow);

// Pflanze
const plant = new THREE.Group();
plant.position.set(3.4, 0, -1.2);
scene.add(plant);
const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.16, 0.4, 7), lambert(0xe8e4dc));
pot.position.y = 0.2;
plant.add(pot);
{
  const r = rng(5);
  for (let i = 0; i < 9; i++) {
    const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.8, 3), lambert(0x2f6b3a));
    leaf.position.set((r() - 0.5) * 0.2, 0.75, (r() - 0.5) * 0.2);
    leaf.rotation.set((r() - 0.5) * 0.9, r() * 6, (r() - 0.5) * 0.9);
    plant.add(leaf);
  }
}

// ---------- Figur ----------
const ch = buildCharacter();
scene.add(ch.root);

// ---------- Animation ----------
let cfg = null;

export function setup(config) {
  cfg = { walkDur: 2.8, walkFrom: -4.2, walkTo: 0, fps: 30, envelope: [], gestures: [], speechStart: 3, ...config };
  const r = rng(cfg.seed || 1);
  cfg.blinkOffset = r() * 3;
  cfg.swayPhase = r() * 6.28;
}

function envelopeAt(t) {
  const i = Math.floor((t - cfg.speechStart) * cfg.fps);
  if (i < 0 || i >= cfg.envelope.length) return 0;
  // leicht glätten
  const a = cfg.envelope[i] || 0;
  const b = cfg.envelope[i + 1] ?? a;
  return (a + b) / 2;
}

/** Laufweg: konstante Geschwindigkeit, im letzten Drittel sanft abbremsen. */
function walkState(t) {
  const u = clamp01(t / cfg.walkDur);
  const c = 0.62;
  const raw = u < c ? u : c + (u - c) - (u - c) ** 2 / (2 * (1 - c));
  const total = c + (1 - c) / 2;
  const speed = u < c ? 1 : 1 - (u - c) / (1 - c);
  return { progress: raw / total, weight: t < cfg.walkDur ? speed : 0 };
}

function applyArm(arm, p, side) {
  // p ist für den rechten Arm definiert; für links gespiegelt.
  arm.shoulder.rotation.set(p.sx, side === 1 ? -p.sy : p.sy, side === 1 ? -p.sz : p.sz);
  arm.elbow.rotation.set(p.ex, 0, 0);
  arm.wrist.rotation.set(p.wx || 0, 0, 0);
  arm.index.visible = !!p.point && p.k > 0.5;
}

function mixPose(a, b, k) {
  return {
    sx: lerp(a.sx, b.sx, k), sy: lerp(a.sy, b.sy, k), sz: lerp(a.sz, b.sz, k),
    ex: lerp(a.ex, b.ex, k), wx: lerp(a.wx || 0, b.wx || 0, k), point: b.point, k,
  };
}

function activeGesture(t) {
  for (const g of cfg.gestures) {
    if (t >= g.start - 0.35 && t <= g.end + 0.35) {
      const k = smooth((t - (g.start - 0.35)) / 0.35) * (1 - smooth((t - g.end) / 0.35));
      return { def: GESTURES[g.name], k };
    }
  }
  return null;
}

export function renderAt(t) {
  const { progress, weight: walkW } = walkState(t);
  const z = lerp(cfg.walkFrom, cfg.walkTo, progress);
  ch.root.position.set(0, 0, z);

  const stride = 1.5;
  const phase = ((z - cfg.walkFrom) / stride) * Math.PI * 2;
  const s = Math.sin(phase);
  const c = Math.cos(phase);
  const idle = 1 - walkW;
  const env = envelopeAt(t);
  const talking = t >= cfg.speechStart ? 1 : 0;

  // Beine
  const hipL = -s * 0.5 * walkW;
  const hipR = s * 0.5 * walkW;
  const kneeL = (0.1 + 0.8 * Math.max(0, c)) * walkW + 0.05 * idle;
  const kneeR = (0.1 + 0.8 * Math.max(0, -c)) * walkW + 0.05 * idle;
  const shift = Math.sin(t * 0.9 + cfg.swayPhase) * idle; // Gewicht verlagern im Stand
  ch.legL.hip.rotation.set(hipL - 0.02 * idle, 0, 0.04 * idle + 0.03 * shift);
  ch.legR.hip.rotation.set(hipR - 0.02 * idle, 0, -0.04 * idle + 0.03 * shift);
  ch.legL.knee.rotation.x = kneeL + Math.max(0, -shift) * 0.08;
  ch.legR.knee.rotation.x = kneeR + Math.max(0, shift) * 0.08;
  ch.legL.ankle.rotation.x = -(hipL + kneeL) * 0.75;
  ch.legR.ankle.rotation.x = -(hipR + kneeR) * 0.75;

  // Hüfte und Oberkörper
  ch.hips.position.y = 0.97 - 0.045 * Math.abs(s) * walkW - 0.012 * idle;
  ch.hips.position.x = 0.025 * shift;
  ch.hips.rotation.set(0, s * 0.12 * walkW, -0.03 * shift);
  const breath = Math.sin(t * 2.2) * 0.012;
  ch.spine.rotation.set(0.06 * walkW - 0.02 * idle + breath, -s * 0.2 * walkW, 0.03 * shift);
  ch.chest.scale.set(1, 1 + breath * 0.8, 1);

  // Kopf: beim Reden nicken, zur Kamera schauen
  const nod = talking * (env * 0.07 * Math.sin(t * 7.3) + env * 0.04);
  ch.neck.rotation.set(0.1 * idle + nod, s * 0.05 * walkW + 0.04 * Math.sin(t * 0.7) * idle, 0.03 * Math.sin(t * 0.5) * idle);

  // Arme: Laufen + Geste + Sprechrhythmus
  const walkArmR = { sx: -s * 0.45, sy: 0, sz: -0.12, ex: -0.35, wx: 0 };
  const walkArmL = { sx: s * 0.45, sy: 0, sz: -0.12, ex: -0.35, wx: 0 };
  let poseR = mixPose(REST, walkArmR, walkW);
  let poseL = mixPose(REST, walkArmL, walkW);
  const g = activeGesture(t);
  if (g) {
    poseR = mixPose(poseR, g.def.right, g.k);
    poseL = mixPose(poseL, g.def.left || REST, g.k);
  }
  const beat = talking * env * 0.12 * Math.sin(t * 6.1);
  poseR.sx += beat * (g ? 1 : 0.3);
  poseR.ex += beat * 0.8;
  poseL.sx -= beat * 0.2;
  applyArm(ch.armR, poseR, -1);
  applyArm(ch.armL, poseL, 1);

  // Gesicht
  ch.mouth.scale.y = 1 + env * 3.5;
  const blinkT = (t + cfg.blinkOffset) % 3.4;
  const blink = blinkT < 0.12 ? 0.15 : 1;
  for (const e of ch.eyes) e.scale.y = blink;

  // Schnee
  for (let i = 0; i < SNOW; i++) {
    const [x, y0, zz, speed, ph] = snowSeed[i];
    snowPos[i * 3] = x + Math.sin(t * 0.8 + ph) * 0.3;
    snowPos[i * 3 + 1] = ((y0 - t * speed) % 9 + 9) % 9;
    snowPos[i * 3 + 2] = zz;
  }
  snowGeo.attributes.position.needsUpdate = true;

  // Kamera: fester Standpunkt, beim Reden langsam heranfahren, leichtes Handkamera-Wackeln
  const talkT = Math.max(0, t - cfg.walkDur);
  const push = smooth(talkT / 10);
  const camZ = lerp(3.6, 2.6, push);
  const camY = lerp(1.35, 1.5, push);
  camera.position.set(Math.sin(t * 0.37) * 0.03, camY + Math.sin(t * 0.53) * 0.015, camZ);
  camera.lookAt(0, lerp(1.2, 1.5, push), lerp(-1.4, 0, smooth(t / cfg.walkDur)));

  renderer.setRenderTarget(target);
  renderer.render(scene, camera);
  renderer.setRenderTarget(null);
  renderer.render(postScene, postCam);
  return canvas.toDataURL('image/png');
}

window.setupScene = setup;
window.renderAt = renderAt;
window.sceneReady = true;
