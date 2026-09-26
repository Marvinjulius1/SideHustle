// Armhaltungen für den rechten Arm (links wird gespiegelt).
// sx/sy/sz = Schulter, ex = Ellbogen, wx = Handgelenk (Radiant). Negatives sx = Arm nach vorn.
export const REST = { sx: 0.06, sy: 0, sz: -0.1, ex: -0.15, wx: 0 };

export const GESTURES = {
  // Hand vor der Brust, erklärend
  explain: { right: { sx: -0.75, sy: 0.6, sz: -0.3, ex: -1.15, wx: 0.35 } },
  // Beide Hände erklärend
  explainBoth: {
    right: { sx: -0.7, sy: 0.5, sz: -0.35, ex: -1.1, wx: 0.3 },
    left: { sx: -0.7, sy: 0.5, sz: -0.35, ex: -1.1, wx: 0.3 },
  },
  // Direkt in die Kamera zeigen
  point: { right: { sx: -1.45, sy: 0.25, sz: -0.05, ex: -0.2, wx: 0, point: true } },
  // Nach unten zeigen (Link in der Bio)
  pointDown: { right: { sx: -0.85, sy: 0.2, sz: -0.12, ex: -0.05, wx: 0.25, point: true } },
  // Zeigefinger hoch: "eine Sache"
  raiseFinger: { right: { sx: -0.55, sy: 0.3, sz: -0.4, ex: -2.35, wx: 0, point: true } },
  // Schulterzucken, Handflächen nach außen
  shrug: {
    right: { sx: -0.5, sy: -0.5, sz: -0.75, ex: -1.6, wx: -0.4 },
    left: { sx: -0.5, sy: -0.5, sz: -0.75, ex: -1.6, wx: -0.4 },
  },
  // Handkante, betont Punkte
  chop: { right: { sx: -0.95, sy: 0.55, sz: -0.25, ex: -1.0, wx: 0 } },
  // Hand auf die Brust: "ich"
  chest: { right: { sx: -0.7, sy: 1.0, sz: -0.05, ex: -2.1, wx: 0 } },
  // Abwinken
  waveOff: { right: { sx: -0.8, sy: -0.35, sz: -0.8, ex: -1.2, wx: 0.4 } },
};

// Gesten, die zufällig (aber reproduzierbar) auf normale Sätze verteilt werden.
export const TALK_GESTURES = ['explain', 'explainBoth', 'point', 'raiseFinger', 'shrug', 'chop', 'chest', 'waveOff'];
