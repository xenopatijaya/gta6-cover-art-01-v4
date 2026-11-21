// focus.js — deterministic face-aware crop heuristic.
// There is no ML model in this app (it must work fully offline), so the
// "face-aware" crop is a classical heuristic run on a tiny 48×48 proxy:
//   * skin-tone likelihood per pixel (the usual RGB skin rules), and
//   * edge density (local luminance gradient), which clusters on faces,
//     hair, eyes and other detail-rich regions.
// The score map is blurred by box-averaging neighbouring cells, then the
// weighted centroid — biased upward, because faces sit in the upper part
// of a portrait — becomes the crop focus point. Same image in, same
// point out: the function is pure and deterministic.

const SIZE = 48;

function skinScore(r, g, b) {
  // Classic RGB skin cluster rules (Kovac et al. style).
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  if (r < 95 || g < 40 || b < 20) return 0;
  if (max - min < 15) return 0;
  if (Math.abs(r - g) < 15) return 0;
  if (r < g || r < b) return 0;
  return Math.min(1, (r - g) / 60) * Math.min(1, (max - min) / 80);
}

export function computeFocus(img) {
  try {
    const c = document.createElement("canvas");
    c.width = SIZE; c.height = SIZE;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, SIZE, SIZE);
    const { data } = ctx.getImageData(0, 0, SIZE, SIZE);
    const lum = new Float32Array(SIZE * SIZE);
    const score = new Float32Array(SIZE * SIZE);
    for (let i = 0; i < SIZE * SIZE; i++) {
      const r = data[i * 4], g = data[i * 4 + 1], b = data[i * 4 + 2];
      lum[i] = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      score[i] = skinScore(r, g, b) * 2.2;
    }
    // Edge density: gradient magnitude added to the score.
    for (let y = 1; y < SIZE - 1; y++) {
      for (let x = 1; x < SIZE - 1; x++) {
        const i = y * SIZE + x;
        const gx = lum[i + 1] - lum[i - 1];
        const gy = lum[i + SIZE] - lum[i - SIZE];
        score[i] += Math.min(1, Math.hypot(gx, gy) / 110) * 0.55;
      }
    }
    // One box-blur pass so single noisy pixels cannot win.
    const blurred = new Float32Array(SIZE * SIZE);
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        let sum = 0, n = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const xx = x + dx, yy = y + dy;
            if (xx < 0 || yy < 0 || xx >= SIZE || yy >= SIZE) continue;
            sum += score[yy * SIZE + xx]; n++;
          }
        }
        blurred[y * SIZE + x] = sum / n;
      }
    }
    // Weighted centroid with a mild upward bias.
    let sx = 0, sy = 0, sw = 0;
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const w = blurred[y * SIZE + x] * (1.25 - (y / SIZE) * 0.5);
        sx += (x + 0.5) * w; sy += (y + 0.5) * w; sw += w;
      }
    }
    if (sw <= 0.0001) return { x: 0.5, y: 0.35 };
    const fx = Math.min(0.85, Math.max(0.15, sx / sw / SIZE));
    const fy = Math.min(0.8, Math.max(0.12, sy / sw / SIZE));
    return { x: fx, y: fy };
  } catch {
    return { x: 0.5, y: 0.35 };
  }
}

// Given a photo (with focus + user offsets) and a panel rectangle in
// pixels, return the source crop rectangle that cover-fits the panel.
export function cropRect(img, photo, pw, ph) {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const zoom = photo.zoom || 1;
  const scale = Math.max(pw / iw, ph / ih) * zoom;
  const sw = pw / scale, sh = ph / scale;
  const fx = (photo.focus ? photo.focus.x : 0.5) + (photo.ox || 0);
  const fy = (photo.focus ? photo.focus.y : 0.35) + (photo.oy || 0);
  let sx = fx * iw - sw / 2;
  let sy = fy * ih - sh / 2;
  sx = Math.min(Math.max(sx, 0), Math.max(0, iw - sw));
  sy = Math.min(Math.max(sy, 0), Math.max(0, ih - sh));
  return { sx, sy, sw, sh };
}
