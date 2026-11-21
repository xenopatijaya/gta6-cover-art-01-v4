// layouts.js — 13 panel layouts for Vice Key Art Studio.
// Each layout is a list of panels in normalized 0..1 canvas coordinates.
// A panel is { x, y, w, h } and may carry `poly` (array of [x, y] points,
// also normalized) for non-rectangular cuts, and `pop: true` for a panel
// whose subject is allowed to break out of its frame in the renderer.

function r(x, y, w, h, extra) {
  return Object.assign({ x, y, w, h }, extra || {});
}

export const ROLES = [
  "THE BOSS",
  "THE DRIVER",
  "THE CREW",
  "THE WILDCARD",
  "THE INSIDER",
  "THE GETAWAY",
  "THE LOOKOUT",
  "THE FIXER",
  "THE HEIR",
];

export const LAYOUTS = [
  {
    id: "key-wide",
    name: "Key Art Wide",
    blurb: "The classic 7-panel theatrical key art.",
    panels: [
      r(0.0, 0.0, 0.4, 1.0),
      r(0.4, 0.0, 0.3, 0.52),
      r(0.7, 0.0, 0.3, 0.52),
      r(0.4, 0.52, 0.2, 0.48),
      r(0.6, 0.52, 0.2, 0.48),
      r(0.8, 0.52, 0.2, 0.48),
      r(0.4, 0.0, 0.6, 0.0, { hidden: true }),
    ].filter((p) => !p.hidden),
  },
  {
    id: "ensemble",
    name: "Key Art Ensemble",
    blurb: "One hero, five supporting stories around them.",
    panels: [
      r(0.22, 0.0, 0.56, 0.72),
      r(0.0, 0.0, 0.22, 0.5),
      r(0.78, 0.0, 0.22, 0.5),
      r(0.0, 0.5, 0.22, 0.5),
      r(0.78, 0.5, 0.22, 0.5),
      r(0.22, 0.72, 0.56, 0.28),
    ],
  },
  {
    id: "pop-out",
    name: "Pop-Out Hero",
    blurb: "A giant hero panel with two scene panels beneath.",
    panels: [
      r(0.08, 0.0, 0.84, 0.78, { pop: true }),
      r(0.0, 0.78, 0.5, 0.22),
      r(0.5, 0.78, 0.5, 0.22),
    ],
  },
  {
    id: "diagonal",
    name: "Diagonal Cut",
    blurb: "Three slashing diagonal panels, pure momentum.",
    panels: [
      r(0, 0, 1, 1, { poly: [[0, 0], [0.52, 0], [0.3, 1], [0, 1]] }),
      r(0, 0, 1, 1, { poly: [[0.52, 0], [1, 0], [1, 0.55], [0.42, 1], [0.3, 1]] }),
      r(0, 0, 1, 1, { poly: [[0.42, 1], [1, 0.55], [1, 1]] }),
    ],
  },
  {
    id: "nine-grid",
    name: "Nine Grid",
    blurb: "A 3×3 contact sheet of the whole crew.",
    panels: [
      r(0, 0, 1 / 3, 1 / 3), r(1 / 3, 0, 1 / 3, 1 / 3), r(2 / 3, 0, 1 / 3, 1 / 3),
      r(0, 1 / 3, 1 / 3, 1 / 3), r(1 / 3, 1 / 3, 1 / 3, 1 / 3), r(2 / 3, 1 / 3, 1 / 3, 1 / 3),
      r(0, 2 / 3, 1 / 3, 1 / 3), r(1 / 3, 2 / 3, 1 / 3, 1 / 3), r(2 / 3, 2 / 3, 1 / 3, 1 / 3),
    ],
  },
  {
    id: "hero-3",
    name: "Hero + 3",
    blurb: "Full-height hero with a vertical strip of three.",
    panels: [
      r(0, 0, 0.68, 1),
      r(0.68, 0, 0.32, 1 / 3),
      r(0.68, 1 / 3, 0.32, 1 / 3),
      r(0.68, 2 / 3, 0.32, 1 / 3),
    ],
  },
  {
    id: "full-bleed",
    name: "Full Bleed",
    blurb: "One photo, edge to edge. Maximum drama.",
    panels: [r(0, 0, 1, 1)],
  },
  {
    id: "duo-split",
    name: "Duo Split",
    blurb: "Two leads, one fault line down the middle.",
    panels: [r(0, 0, 0.5, 1), r(0.5, 0, 0.5, 1)],
  },
  {
    id: "triple-strip",
    name: "Triple Strip",
    blurb: "Three vertical film strips side by side.",
    panels: [r(0, 0, 1 / 3, 1), r(1 / 3, 0, 1 / 3, 1), r(2 / 3, 0, 1 / 3, 1)],
  },
  {
    id: "polaroid",
    name: "Polaroid Snaps",
    blurb: "Four snapshots scattered like evidence photos.",
    panels: [
      r(0.04, 0.06, 0.42, 0.4, { tilt: -0.05 }),
      r(0.54, 0.04, 0.42, 0.4, { tilt: 0.045 }),
      r(0.06, 0.54, 0.42, 0.4, { tilt: 0.04 }),
      r(0.52, 0.56, 0.42, 0.4, { tilt: -0.04 }),
    ],
  },
  {
    id: "center-stage",
    name: "Center Stage",
    blurb: "A framed portrait hero with scene panels flanking.",
    panels: [
      r(0.3, 0.08, 0.4, 0.84),
      r(0, 0, 0.3, 0.5),
      r(0.7, 0, 0.3, 0.5),
      r(0, 0.5, 0.3, 0.5),
      r(0.7, 0.5, 0.3, 0.5),
    ],
  },
  {
    id: "four-square",
    name: "Four Square",
    blurb: "A clean 2×2 grid — the ensemble poster.",
    panels: [
      r(0, 0, 0.5, 0.5), r(0.5, 0, 0.5, 0.5),
      r(0, 0.5, 0.5, 0.5), r(0.5, 0.5, 0.5, 0.5),
    ],
  },
  {
    id: "hero-top",
    name: "Hero Top",
    blurb: "A widescreen hero over a three-panel strip.",
    panels: [
      r(0, 0, 1, 0.62),
      r(0, 0.62, 1 / 3, 0.38),
      r(1 / 3, 0.62, 1 / 3, 0.38),
      r(2 / 3, 0.62, 1 / 3, 0.38),
    ],
  },
];

export function getLayout(id) {
  return LAYOUTS.find((l) => l.id === id) || LAYOUTS[0];
}
