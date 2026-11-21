// grades.js — 9 cinematic color grades.
// Each grade is a gradient map: shadows / mids / highlights are remapped
// through `stops`, then an optional tinted overlay is blended on top and
// CSS-style saturation / contrast / brightness adjustments are applied in
// the renderer's lookup table.

export const GRADES = [
  {
    id: "vice-sunset",
    name: "Vice Sunset",
    stops: ["#1b1035", "#7a2d5e", "#e2603f", "#ffb36b", "#ffe9c9"],
    overlay: "#ff7a3c", overlayAlpha: 0.16, sat: 1.18, con: 1.08, bright: 1.02,
  },
  {
    id: "neon-rain",
    name: "Neon Rain",
    stops: ["#060a24", "#123a6e", "#0f7f9e", "#e83e8c", "#b8f4ff"],
    overlay: "#274bdb", overlayAlpha: 0.18, sat: 1.22, con: 1.12, bright: 0.98,
  },
  {
    id: "golden-hour",
    name: "Golden Hour",
    stops: ["#241105", "#6e3410", "#c97a24", "#f2b95c", "#fff3d0"],
    overlay: "#ffb84d", overlayAlpha: 0.14, sat: 1.1, con: 1.04, bright: 1.05,
  },
  {
    id: "midnight",
    name: "Midnight",
    stops: ["#02040a", "#0a1a33", "#1d3a5f", "#5f7fa6", "#cfe2f5"],
    overlay: "#0b2447", overlayAlpha: 0.22, sat: 0.92, con: 1.14, bright: 0.94,
  },
  {
    id: "coral-heat",
    name: "Coral Heat",
    stops: ["#2b0a12", "#7e1f2e", "#d94f3d", "#ff8a5c", "#ffd9b0"],
    overlay: "#ff5a3c", overlayAlpha: 0.15, sat: 1.2, con: 1.06, bright: 1.03,
  },
  {
    id: "chrome-noir",
    name: "Chrome Noir",
    stops: ["#050505", "#2e2e33", "#6d6d75", "#b9bcc4", "#f4f6fa"],
    overlay: "#8a93a6", overlayAlpha: 0.1, sat: 0.32, con: 1.22, bright: 1.0,
  },
  {
    id: "palm-haze",
    name: "Palm Haze",
    stops: ["#14261c", "#2f5d43", "#6fae7e", "#bfe3b0", "#f6ffd9"],
    overlay: "#7ed492", overlayAlpha: 0.13, sat: 1.05, con: 0.98, bright: 1.06,
  },
  {
    id: "ocean-drive",
    name: "Ocean Drive",
    stops: ["#04202b", "#0b556e", "#17a2b8", "#7fe0d4", "#eafffb"],
    overlay: "#19b8c9", overlayAlpha: 0.15, sat: 1.16, con: 1.05, bright: 1.03,
  },
  {
    id: "retro-print",
    name: "Retro Print",
    stops: ["#33231a", "#7a4b32", "#bd7f4a", "#e8bd85", "#fdf0d5"],
    overlay: "#d9a05b", overlayAlpha: 0.2, sat: 0.88, con: 0.96, bright: 1.04,
  },
];

export function getGrade(id) {
  return GRADES.find((g) => g.id === id) || GRADES[0];
}

function hexRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// Build a 256-entry RGB lookup table for a grade: luminance is mapped
// through the gradient stops, then saturation / contrast / brightness
// are folded in. Deterministic and allocation-light enough for export.
export function buildLut(grade) {
  const stops = grade.stops.map(hexRgb);
  const lut = new Uint8ClampedArray(256 * 3);
  for (let i = 0; i < 256; i++) {
    const t = i / 255;
    const seg = Math.min(stops.length - 2, Math.floor(t * (stops.length - 1)));
    const f = t * (stops.length - 1) - seg;
    for (let c = 0; c < 3; c++) {
      lut[i * 3 + c] = stops[seg][c] + (stops[seg + 1][c] - stops[seg][c]) * f;
    }
  }
  return lut;
}

// Apply a grade to an ImageData in place: gradient-map by luminance,
// blend the result with the original so faces keep their color, then
// apply saturation / contrast / brightness.
export function applyGrade(imageData, grade) {
  const lut = buildLut(grade);
  const d = imageData.data;
  const mix = 0.62; // gradient-map strength; the rest is the original photo
  const { sat, con, bright } = grade;
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i], g = d[i + 1], b = d[i + 2];
    const lum = Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b);
    let nr = r + (lut[lum * 3] - r) * mix;
    let ng = g + (lut[lum * 3 + 1] - g) * mix;
    let nb = b + (lut[lum * 3 + 2] - b) * mix;
    const grey = 0.2126 * nr + 0.7152 * ng + 0.0722 * nb;
    nr = grey + (nr - grey) * sat;
    ng = grey + (ng - grey) * sat;
    nb = grey + (nb - grey) * sat;
    d[i] = (nr - 128) * con * bright + 128;
    d[i + 1] = (ng - 128) * con * bright + 128;
    d[i + 2] = (nb - 128) * con * bright + 128;
  }
  return imageData;
}
