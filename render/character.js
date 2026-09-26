// Low-Poly-Figur im PS2-Stil, komplett aus einfachen Formen gebaut (keine fremden Assets).
// Look: silberweiße Spike-Haare, orange Goggles auf der Stirn, navy Crewneck ohne Schrift,
// Goldkette, Uhr, schwarze Cargo-Hose, weiße Chunky-Sneaker.
import * as THREE from 'three';

const COLORS = {
  skin: 0xe2ad8c,
  skinShade: 0xc98f6f,
  hair: 0xf1f3f7,
  hairShade: 0xcdd3dd,
  brow: 0x9aa1ad,
  sweater: 0x2b3d6b,
  sweaterRib: 0x1f2c50,
  pants: 0x2a2a31,
  pocket: 0x26262b,
  shoe: 0xf2f2f2,
  sole: 0xcfcfcf,
  shoeAccent: 0xd4542c,
  gold: 0xe0b23c,
  goggleFrame: 0x2a2a2a,
  lens: 0xff7a1a,
  eyeWhite: 0xf4f1ea,
  iris: 0x3a2a22,
  mouth: 0x5a2a28,
};

const mats = new Map();
function mat(color, opts = {}) {
  const key = color + JSON.stringify(opts);
  if (!mats.has(key)) mats.set(key, new THREE.MeshLambertMaterial({ color, flatShading: true, ...opts }));
  return mats.get(key);
}

function box(w, h, d, color, opts) {
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color, opts));
}

function cyl(rTop, rBottom, h, color, segs = 7) {
  return new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBottom, h, segs), mat(color));
}

/** Gruppe, deren Ursprung am Gelenk liegt; das Mesh hängt nach unten. */
function limb(mesh, length) {
  const joint = new THREE.Group();
  mesh.position.y = -length / 2;
  joint.add(mesh);
  return joint;
}

function buildHead() {
  const head = new THREE.Group();

  const cranium = box(0.2, 0.2, 0.23, COLORS.skin);
  cranium.position.set(0, 0.12, 0);
  head.add(cranium);
  const jaw = box(0.165, 0.09, 0.19, COLORS.skin);
  jaw.position.set(0, 0.0, 0.015);
  head.add(jaw);
  const chin = box(0.1, 0.04, 0.12, COLORS.skinShade);
  chin.position.set(0, -0.045, 0.05);
  head.add(chin);
  for (const s of [-1, 1]) {
    const ear = box(0.025, 0.06, 0.04, COLORS.skinShade);
    ear.position.set(s * 0.108, 0.1, -0.01);
    head.add(ear);
  }

  // Gesicht
  const face = new THREE.Group();
  face.position.set(0, 0, 0.116);
  head.add(face);
  const eyes = [];
  for (const s of [-1, 1]) {
    const white = box(0.042, 0.018, 0.01, COLORS.eyeWhite);
    white.position.set(s * 0.045, 0.11, 0);
    face.add(white);
    const iris = box(0.018, 0.018, 0.012, COLORS.iris);
    iris.position.set(s * 0.043, 0.11, 0.002);
    face.add(iris);
    eyes.push(white, iris);
    const brow = box(0.055, 0.012, 0.014, COLORS.brow);
    brow.position.set(s * 0.047, 0.137, 0.002);
    brow.rotation.z = s * -0.18; // leicht zusammengezogen = selbstbewusster Blick
    face.add(brow);
  }
  const nose = box(0.026, 0.05, 0.03, COLORS.skinShade);
  nose.position.set(0, 0.075, 0.008);
  face.add(nose);
  const mouth = box(0.06, 0.01, 0.012, COLORS.mouth);
  mouth.position.set(0, 0.02, -0.01);
  face.add(mouth);

  // Haare: Kappe + viele Spikes nach hinten/oben + Strähnen über der Stirn
  const hair = new THREE.Group();
  head.add(hair);
  const cap = new THREE.Mesh(new THREE.IcosahedronGeometry(0.135, 1), mat(COLORS.hair));
  cap.scale.set(0.95, 0.8, 1.05);
  cap.position.set(0, 0.2, -0.03);
  hair.add(cap);
  const spike = (len, r, pos, rot, color = COLORS.hair) => {
    const m = new THREE.Mesh(new THREE.ConeGeometry(r, len, 4), mat(color));
    const g = new THREE.Group();
    m.position.y = len / 2;
    g.add(m);
    g.position.set(...pos);
    g.rotation.set(...rot);
    hair.add(g);
  };
  // Spikes nach hinten
  for (let i = 0; i < 9; i++) {
    const a = (i / 8 - 0.5) * 2.2;
    spike(0.16, 0.045, [Math.sin(a) * 0.09, 0.2 + Math.cos(a) * 0.02, -0.08], [-2.0 + Math.abs(a) * 0.15, 0, -a * 0.7], i % 2 ? COLORS.hair : COLORS.hairShade);
  }
  // Spikes nach oben/seitlich
  for (let i = 0; i < 7; i++) {
    const a = (i / 6 - 0.5) * 2.6;
    spike(0.12, 0.04, [Math.sin(a) * 0.1, 0.27, 0.0], [-0.9, 0, -a * 0.8], i % 2 ? COLORS.hairShade : COLORS.hair);
  }
  // Strähnen über der Stirn (hängen nach vorne unten)
  for (let i = 0; i < 5; i++) {
    const x = (i - 2) * 0.042;
    spike(0.1 + (i % 2) * 0.03, 0.028, [x, 0.25, 0.1], [2.6 + (i % 2) * 0.15, 0, x * 3.5], i % 2 ? COLORS.hair : COLORS.hairShade);
  }
  // Seiten
  for (const s of [-1, 1]) {
    spike(0.11, 0.035, [s * 0.105, 0.17, 0.02], [2.9, 0, s * -0.35], COLORS.hairShade);
  }

  // Goggles auf der Stirn
  const goggles = new THREE.Group();
  goggles.position.set(0, 0.215, 0.02);
  goggles.rotation.x = -0.35;
  head.add(goggles);
  const strap = new THREE.Mesh(new THREE.TorusGeometry(0.128, 0.012, 4, 12), mat(COLORS.goggleFrame));
  strap.rotation.x = Math.PI / 2;
  strap.scale.set(1, 1.12, 1);
  goggles.add(strap);
  for (const s of [-1, 1]) {
    const frame = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.036, 0.03, 8), mat(COLORS.goggleFrame));
    frame.rotation.x = Math.PI / 2;
    frame.position.set(s * 0.045, 0, 0.125);
    goggles.add(frame);
    const lens = new THREE.Mesh(
      new THREE.CylinderGeometry(0.029, 0.029, 0.034, 8),
      mat(COLORS.lens, { emissive: 0x7a2a00 }),
    );
    lens.rotation.x = Math.PI / 2;
    lens.position.set(s * 0.045, 0, 0.128);
    goggles.add(lens);
  }

  return { head, mouth, eyes };
}

function buildArm(side) {
  const shoulder = new THREE.Group();
  const upper = limb(cyl(0.058, 0.05, 0.3, COLORS.sweater), 0.3);
  shoulder.add(upper);
  const elbow = new THREE.Group();
  elbow.position.y = -0.3;
  upper.add(elbow);
  const fore = limb(cyl(0.05, 0.045, 0.24, COLORS.sweater), 0.24);
  elbow.add(fore);
  const cuff = cyl(0.047, 0.047, 0.04, COLORS.sweaterRib);
  cuff.position.y = -0.235;
  fore.add(cuff);

  const wrist = new THREE.Group();
  wrist.position.y = -0.26;
  fore.add(wrist);
  const hand = new THREE.Group();
  wrist.add(hand);
  const palm = box(0.075, 0.085, 0.035, COLORS.skin);
  palm.position.y = -0.045;
  hand.add(palm);
  const fingers = box(0.07, 0.04, 0.04, COLORS.skinShade);
  fingers.position.set(0, -0.095, 0.006);
  hand.add(fingers);
  const thumb = box(0.022, 0.05, 0.025, COLORS.skin);
  thumb.position.set(side * -0.045, -0.04, 0.02);
  thumb.rotation.z = side * 0.4;
  hand.add(thumb);
  const index = box(0.02, 0.075, 0.022, COLORS.skin);
  index.position.set(side * -0.02, -0.14, 0.01);
  index.visible = false; // nur beim Zeigen sichtbar
  hand.add(index);

  if (side === 1) {
    // Uhr am linken Handgelenk
    const watch = cyl(0.052, 0.052, 0.035, COLORS.gold, 8);
    watch.position.y = -0.215;
    fore.add(watch);
  }
  return { shoulder, elbow, wrist, fingers, index };
}

function buildLeg() {
  const hip = new THREE.Group();
  const thigh = limb(cyl(0.085, 0.07, 0.44, COLORS.pants), 0.44);
  hip.add(thigh);
  const pocket = box(0.05, 0.1, 0.1, COLORS.pocket);
  pocket.position.set(0, -0.25, 0);
  pocket.position.x = 0.07;
  thigh.add(pocket);
  const knee = new THREE.Group();
  knee.position.y = -0.44;
  thigh.add(knee);
  const shin = limb(cyl(0.068, 0.062, 0.42, COLORS.pants), 0.42);
  knee.add(shin);
  const ankle = new THREE.Group();
  ankle.position.y = -0.42;
  shin.add(ankle);
  const shoe = box(0.11, 0.075, 0.25, COLORS.shoe);
  shoe.position.set(0, -0.04, 0.05);
  ankle.add(shoe);
  const sole = box(0.12, 0.035, 0.265, COLORS.sole);
  sole.position.set(0, -0.09, 0.05);
  ankle.add(sole);
  const accent = box(0.115, 0.02, 0.08, COLORS.shoeAccent);
  accent.position.set(0, -0.03, -0.03);
  ankle.add(accent);
  return { hip, knee, ankle, pocket };
}

export function buildCharacter() {
  const root = new THREE.Group();
  const hips = new THREE.Group();
  hips.position.y = 0.97;
  root.add(hips);

  const pelvis = box(0.3, 0.14, 0.18, COLORS.pants);
  hips.add(pelvis);

  const spine = new THREE.Group();
  spine.position.y = 0.05;
  hips.add(spine);
  const chest = new THREE.Group();
  spine.add(chest);
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.175, 0.52, 8), mat(COLORS.sweater));
  torso.scale.z = 0.62;
  torso.position.y = 0.28;
  chest.add(torso);
  const hem = new THREE.Mesh(new THREE.CylinderGeometry(0.178, 0.178, 0.06, 8), mat(COLORS.sweaterRib));
  hem.scale.z = 0.64;
  hem.position.y = 0.03;
  chest.add(hem);
  const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.09, 0.04, 8), mat(COLORS.sweaterRib));
  collar.position.y = 0.55;
  chest.add(collar);
  const chain = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.009, 4, 14), mat(COLORS.gold, { emissive: 0x3a2800 }));
  chain.rotation.x = Math.PI / 2 - 0.35;
  chain.position.set(0, 0.5, 0.04);
  chain.scale.set(1, 1.25, 1);
  chest.add(chain);

  const neck = new THREE.Group();
  neck.position.y = 0.55;
  chest.add(neck);
  const neckMesh = cyl(0.05, 0.055, 0.09, COLORS.skinShade, 6);
  neckMesh.position.y = 0.04;
  neck.add(neckMesh);
  const { head, mouth, eyes } = buildHead();
  head.position.y = 0.1;
  head.scale.setScalar(1.18); // leicht vergrößert, wirkt stilisierter und im Hochformat besser lesbar
  neck.add(head);

  const armL = buildArm(1);
  armL.shoulder.position.set(0.225, 0.5, 0);
  chest.add(armL.shoulder);
  const armR = buildArm(-1);
  armR.shoulder.position.set(-0.225, 0.5, 0);
  chest.add(armR.shoulder);

  const legL = buildLeg();
  legL.hip.position.set(0.1, -0.02, 0);
  hips.add(legL.hip);
  const legR = buildLeg();
  legR.hip.position.set(-0.1, -0.02, 0);
  legR.pocket.position.x = -0.07;
  hips.add(legR.hip);

  // Blob-Schatten wie in PS2-Spielen
  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.34, 12),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.45, depthWrite: false }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.005;
  root.add(shadow);

  return { root, hips, spine, chest, neck, head, mouth, eyes, armL, armR, legL, legR };
}
