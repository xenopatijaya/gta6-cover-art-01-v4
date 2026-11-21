// render.js — draws a complete Vice Key Art Studio cover onto a canvas.
// Pure canvas 2D: panels with graded photos, striped chrome title,
// neon subtitle, role tags, press strip, billing block, gold seal and a
// canvas-drawn barcode. Deterministic: grain uses a seeded PRNG so the
// same state always renders the same pixels.

import { getLayout, ROLES } from "./layouts.js";
import { getGrade, applyGrade } from "./grades.js";
import { cropRect } from "./focus.js";

function seededRandom(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function drawPanelPhoto(ctx, img, photo, panel, W, H, grade) {
  const x = panel.x * W, y = panel.y * H, w = panel.w * W, h = panel.h * H;
  if (panel.poly) {
    ctx.save();
    ctx.beginPath();
    panel.poly.forEach(([px, py], i) => {
      if (i === 0) ctx.moveTo(px * W, py * H);
      else ctx.lineTo(px * W, py * H);
    });
    ctx.closePath();
    ctx.clip();
    const crop = cropRect(img, photo, W, H);
    ctx.drawImage(img, crop.sx, crop.sy, crop.sw, crop.sh, 0, 0, W, H);
    ctx.fillStyle = grade.overlay;
    ctx.globalAlpha = grade.overlayAlpha + 0.06;
    ctx.globalCompositeOperation = "overlay";
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    ctx.restore();
    ctx.save();
    ctx.beginPath();
    panel.poly.forEach(([px, py], i) => {
      if (i === 0) ctx.moveTo(px * W, py * H);
      else ctx.lineTo(px * W, py * H);
    });
    ctx.closePath();
    ctx.strokeStyle = "rgba(8,6,18,0.9)";
    ctx.lineWidth = Math.max(2, W * 0.0035);
    ctx.stroke();
    ctx.restore();
    return;
  }
  // Rectangular (or tilted polaroid) panel: grade per-pixel offscreen.
  const off = document.createElement("canvas");
  off.width = Math.max(2, Math.round(w));
  off.height = Math.max(2, Math.round(h));
  const octx = off.getContext("2d", { willReadFrequently: true });
  const crop = cropRect(img, photo, off.width, off.height);
  octx.drawImage(img, crop.sx, crop.sy, crop.sw, crop.sh, 0, 0, off.width, off.height);
  try {
    const id = octx.getImageData(0, 0, off.width, off.height);
    applyGrade(id, grade);
    octx.putImageData(id, 0, 0);
  } catch { /* oversized canvas: fall back to the raw photo */ }
  octx.fillStyle = grade.overlay;
  octx.globalAlpha = grade.overlayAlpha;
  octx.globalCompositeOperation = "overlay";
  octx.fillRect(0, 0, off.width, off.height);
  octx.globalAlpha = 1;
  octx.globalCompositeOperation = "source-over";

  ctx.save();
  if (panel.tilt) {
    const cx = x + w / 2, cy = y + h / 2;
    ctx.translate(cx, cy);
    ctx.rotate(panel.tilt);
    const bw = Math.max(6, W * 0.012);
    ctx.fillStyle = "#f7f3ea";
    ctx.fillRect(-w / 2 - bw, -h / 2 - bw, w + bw * 2, h + bw * 3.4);
    ctx.drawImage(off, -w / 2, -h / 2);
    ctx.strokeStyle = "rgba(0,0,0,0.35)";
    ctx.lineWidth = 2;
    ctx.strokeRect(-w / 2 - bw, -h / 2 - bw, w + bw * 2, h + bw * 3.4);
  } else {
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    ctx.drawImage(off, x, y, w, h);
    ctx.strokeStyle = "rgba(8,6,18,0.9)";
    ctx.lineWidth = Math.max(2, W * 0.0035);
    ctx.strokeRect(x, y, w, h);
  }
  ctx.restore();
}

function drawRoleTag(ctx, panel, role, W, H) {
  if (!role || panel.poly) return;
  const pad = W * 0.008;
  const fs = Math.max(10, W * 0.015);
  ctx.save();
  ctx.font = `${fs}px Anton, sans-serif`;
  const tw = ctx.measureText(role).width;
  const x = panel.x * W + pad * 1.3;
  const y = panel.y * H + pad * 1.3 + H * 0.055;
  if (x + tw + pad * 2 > (panel.x + panel.w) * W - 4) { ctx.restore(); return; }
  ctx.fillStyle = "rgba(5,4,14,0.85)";
  ctx.beginPath();
  ctx.roundRect(x, y, tw + pad * 2, fs + pad * 1.6, fs * 0.35);
  ctx.fill();
  ctx.fillStyle = "#ffd75e";
  ctx.fillText(role, x + pad, y + fs + pad * 0.55);
  ctx.restore();
}

function chromeTitle(ctx, text, cx, cy, maxWidth, baseSize) {
  let size = baseSize;
  ctx.save();
  const setFont = () => { ctx.font = `${size}px Anton, sans-serif`; };
  setFont();
  while (ctx.measureText(text).width > maxWidth && size > 20) {
    size *= 0.94; setFont();
  }
  const w = ctx.measureText(text).width;
  const x = cx - w / 2;
  ctx.lineJoin = "round";
  ctx.shadowColor = "rgba(0,0,0,0.55)";
  ctx.shadowBlur = size * 0.12;
  ctx.shadowOffsetY = size * 0.06;
  ctx.strokeStyle = "#0a0618";
  ctx.lineWidth = size * 0.16;
  ctx.strokeText(text, x, cy);
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  const grad = ctx.createLinearGradient(0, cy - size, 0, cy + size * 0.15);
  const bands = [
    [0.0, "#fdfdff"], [0.18, "#c9d4e8"], [0.34, "#5f708f"],
    [0.46, "#f4f8ff"], [0.52, "#8fa5c4"], [0.66, "#2e3d59"],
    [0.8, "#e8b64c"], [0.92, "#ff8a5c"], [1.0, "#c93b6e"],
  ];
  for (const [o, c] of bands) grad.addColorStop(o, c);
  ctx.fillStyle = grad;
  ctx.fillText(text, x, cy);
  ctx.save();
  ctx.beginPath();
  ctx.rect(x - 4, cy - size, w + 8, size * 1.2);
  ctx.clip();
  ctx.globalAlpha = 0.14;
  ctx.fillStyle = "#0a0818";
  const stripe = Math.max(2, size * 0.06);
  for (let yy = cy - size; yy < cy; yy += stripe * 2) {
    ctx.fillRect(x - 4, yy, w + 8, stripe * 0.6);
  }
  ctx.restore();
  ctx.restore();
  return { width: w, size };
}

function neonSubtitle(ctx, text, cx, cy, size) {
  ctx.save();
  ctx.font = `${size}px Pacifico, cursive`;
  ctx.textAlign = "center";
  ctx.shadowColor = "#ff2e88";
  ctx.shadowBlur = size * 0.7;
  ctx.fillStyle = "#ffd7ec";
  ctx.fillText(text, cx, cy);
  ctx.shadowColor = "#22d3ee";
  ctx.shadowBlur = size * 0.45;
  ctx.fillStyle = "#fff0f7";
  ctx.fillText(text, cx, cy);
  ctx.restore();
}

function drawPressStrip(ctx, W, H) {
  const h = H * 0.052;
  ctx.save();
  ctx.fillStyle = "rgba(5,4,14,0.88)";
  ctx.fillRect(0, 0, W, h);
  ctx.fillStyle = "#ffd75e";
  const fs = h * 0.5;
  ctx.font = `${fs}px Anton, sans-serif`;
  ctx.textBaseline = "middle";
  ctx.fillText("★★★★★", W * 0.02, h * 0.56);
  ctx.fillStyle = "#f5f2ea";
  const quotes =
    "\u201CA NEON MASTERPIECE\u201D — LEONIDA GAZETTE      " +
    "\u201CTHE CITY NEVER SLEEPS\u201D — VICE WIRE      " +
    "\u201CINSTANT CLASSIC\u201D — PALM POST";
  // Shrink the quote line until stars + quotes fit the strip width, so
  // portrait covers never clip the last review.
  let qfs = fs * 0.6;
  ctx.font = `${qfs}px Anton, sans-serif`;
  const avail = W * 0.82;
  while (ctx.measureText(quotes).width > avail && qfs > 7) {
    qfs *= 0.94;
    ctx.font = `${qfs}px Anton, sans-serif`;
  }
  ctx.fillText(quotes, W * 0.16, h * 0.58);
  ctx.restore();
}

function drawBilling(ctx, W, H) {
  ctx.save();
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(245,242,234,0.95)";
  ctx.font = `${Math.max(8, W * 0.0095)}px Anton, sans-serif`;
  const line =
    "VICE KEY ART STUDIO presents A LEONIDA PICTURES production " +
    "music by PALM STATIC edited by N. CUTTER directed by V. KEYS";
  // Centered in the clear band between the barcode (left) and seal (right).
  ctx.fillText(line, W * 0.49, H * 0.978);
  ctx.restore();
}

function drawSeal(ctx, W, H) {
  const r = W * 0.05;
  const cx = W - r - W * 0.024, cy = H - r - H * 0.05;
  ctx.save();
  const grad = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.1, cx, cy, r);
  grad.addColorStop(0, "#ffe9a3");
  grad.addColorStop(0.6, "#e8b64c");
  grad.addColorStop(1, "#9a6b14");
  ctx.fillStyle = grad;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "#5e430a";
  ctx.lineWidth = r * 0.05;
  ctx.beginPath(); ctx.arc(cx, cy, r * 0.85, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = "#3d2c05";
  ctx.textAlign = "center";
  ctx.font = `${r * 0.4}px Anton, sans-serif`;
  ctx.fillText("EST. 2026", cx, cy - r * 0.02);
  ctx.font = `${r * 0.32}px Anton, sans-serif`;
  ctx.fillText("• LEONIDA •", cx, cy + r * 0.4);
  ctx.restore();
}

function drawBarcode(ctx, seedText, W, H) {
  const bw = W * 0.115, bh = H * 0.05;
  const x = W * 0.02, y = H - bh - H * 0.03;
  ctx.save();
  ctx.fillStyle = "#f7f3ea";
  ctx.fillRect(x, y, bw, bh);
  let seed = 7;
  for (const ch of seedText) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
  const rand = seededRandom(seed);
  ctx.fillStyle = "#111";
  let bx = x + bw * 0.06;
  const barArea = bw * 0.86;
  let drawn = 0;
  while (drawn < barArea) {
    const wdt = 1 + Math.floor(rand() * 3.4);
    if (rand() > 0.42) ctx.fillRect(bx, y + bh * 0.1, wdt, bh * 0.62);
    bx += wdt + 1;
    drawn += wdt + 1;
  }
  ctx.fillStyle = "#111";
  ctx.font = `${bh * 0.2}px monospace`;
  ctx.textAlign = "center";
  ctx.fillText("8 9012026 260526", x + bw / 2, y + bh * 0.92);
  ctx.restore();
}

function drawFinishing(ctx, W, H, opts) {
  const rand = seededRandom(1337);
  if (opts.halftone > 0) {
    ctx.save();
    ctx.globalAlpha = 0.1 * opts.halftone;
    ctx.fillStyle = "#000";
    const step = Math.max(6, W * 0.008);
    for (let yy = step / 2; yy < H; yy += step) {
      for (let xx = step / 2; xx < W; xx += step) {
        const edge = Math.max(Math.abs(xx / W - 0.5), Math.abs(yy / H - 0.5)) * 2;
        const r = step * 0.16 * edge;
        if (r < 0.4) continue;
        ctx.beginPath(); ctx.arc(xx, yy, r, 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.restore();
  }
  if (opts.grain > 0) {
    ctx.save();
    ctx.globalAlpha = 0.05 * opts.grain;
    const n = Math.floor(W * H * 0.012);
    for (let i = 0; i < n; i++) {
      ctx.fillStyle = rand() > 0.5 ? "#fff" : "#000";
      ctx.fillRect(rand() * W, rand() * H, 1.4, 1.4);
    }
    ctx.restore();
  }
  if (opts.vignette > 0) {
    ctx.save();
    const grad = ctx.createRadialGradient(
      W / 2, H / 2, Math.min(W, H) * 0.36,
      W / 2, H / 2, Math.max(W, H) * 0.78
    );
    grad.addColorStop(0, "rgba(0,0,0,0)");
    grad.addColorStop(1, `rgba(4,2,12,${0.5 * opts.vignette})`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
}

// state: { layoutId, gradeId, title, subtitle, photos: [{img, focus, ox, oy, zoom}],
//          panelPhotos: [photoIndex per panel], roles: [role per panel],
//          halftone, grain, vignette, dressing: bool }
export function renderCover(canvas, state) {
  const W = canvas.width, H = canvas.height;
  const ctx = canvas.getContext("2d");
  const layout = getLayout(state.layoutId);
  const grade = getGrade(state.gradeId);
  ctx.fillStyle = "#0b0716";
  ctx.fillRect(0, 0, W, H);

  layout.panels.forEach((panel, i) => {
    const photo = state.photos[state.panelPhotos[i] % state.photos.length];
    if (photo && photo.img) drawPanelPhoto(ctx, photo.img, photo, panel, W, H, grade);
  });

  // Bottom scrim so the title and dressing stay readable.
  const scrim = ctx.createLinearGradient(0, H * 0.55, 0, H);
  scrim.addColorStop(0, "rgba(5,3,14,0)");
  scrim.addColorStop(0.55, "rgba(5,3,14,0.42)");
  scrim.addColorStop(1, "rgba(5,3,14,0.82)");
  ctx.fillStyle = scrim;
  ctx.fillRect(0, H * 0.55, W, H * 0.45);

  layout.panels.forEach((panel, i) => {
    drawRoleTag(ctx, panel, state.roles[i] || ROLES[i % ROLES.length], W, H);
  });

  if (state.dressing) drawPressStrip(ctx, W, H);

  // Giant chrome title overlapping the panels, low-center.
  const title = (state.title || "VICE HEAT").toUpperCase();
  const titleY = H * 0.845;
  chromeTitle(ctx, title, W / 2, titleY, W * 0.94, H * 0.19);
  neonSubtitle(ctx, state.subtitle || "Leonida Nights", W / 2, titleY + H * 0.075, H * 0.052);

  if (state.dressing) {
    drawBilling(ctx, W, H);
    drawSeal(ctx, W, H);
    drawBarcode(ctx, title, W, H);
  }
  drawFinishing(ctx, W, H, {
    halftone: state.halftone ?? 0.7,
    grain: state.grain ?? 0.8,
    vignette: state.vignette ?? 0.9,
  });
  return canvas;
}
