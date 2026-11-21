// main.js — Vice Key Art Studio editor wiring + deterministic ?shot= modes.

import { LAYOUTS, getLayout, ROLES } from "./layouts.js";
import { GRADES, getGrade } from "./grades.js";
import { computeFocus } from "./focus.js";
import { renderCover } from "./render.js";

const SAMPLES = [
  { src: "samples/cast-boss.jpg", name: "The Boss" },
  { src: "samples/cast-driver.jpg", name: "The Driver" },
  { src: "samples/cast-redhead.jpg", name: "The Wildcard" },
  { src: "samples/cast-friends.jpg", name: "The Crew" },
  { src: "samples/boulevard.jpg", name: "Boulevard" },
  { src: "samples/pier.jpg", name: "The Pier" },
];

const state = {
  layoutId: "key-wide",
  gradeId: "vice-sunset",
  title: "VICE HEAT",
  subtitle: "Leonida Nights",
  photos: [],
  panelPhotos: [],
  roles: ROLES.slice(),
  halftone: 0.7,
  grain: 0.8,
  vignette: 0.9,
  dressing: true,
  selectedPhoto: 0,
};

function syncPanelPhotos() {
  const n = getLayout(state.layoutId).panels.length;
  while (state.panelPhotos.length < n) {
    state.panelPhotos.push(state.panelPhotos.length % Math.max(1, state.photos.length));
  }
  state.panelPhotos.length = n;
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function addPhoto(src, name) {
  const img = await loadImage(src);
  const photo = { img, name, focus: computeFocus(img), ox: 0, oy: 0, zoom: 1 };
  state.photos.push(photo);
  return photo;
}

// ---------- undo / redo ----------
const history = [];
let historyIdx = -1;
function snapshot() {
  return JSON.stringify({
    layoutId: state.layoutId, gradeId: state.gradeId,
    title: state.title, subtitle: state.subtitle,
    panelPhotos: state.panelPhotos, roles: state.roles,
    halftone: state.halftone, grain: state.grain, vignette: state.vignette,
    dressing: state.dressing, selectedPhoto: state.selectedPhoto,
    crops: state.photos.map((p) => ({ focus: p.focus, ox: p.ox, oy: p.oy, zoom: p.zoom })),
  });
}
function pushHistory() {
  history.length = historyIdx + 1;
  history.push(snapshot());
  if (history.length > 60) history.shift();
  historyIdx = history.length - 1;
  syncUndoButtons();
}
function restore(snap) {
  const s = JSON.parse(snap);
  Object.assign(state, {
    layoutId: s.layoutId, gradeId: s.gradeId, title: s.title, subtitle: s.subtitle,
    panelPhotos: s.panelPhotos, roles: s.roles, halftone: s.halftone,
    grain: s.grain, vignette: s.vignette, dressing: s.dressing,
    selectedPhoto: s.selectedPhoto,
  });
  (s.crops || []).forEach((c, i) => { if (state.photos[i]) Object.assign(state.photos[i], c); });
  syncPanelPhotos();
  buildPickers();
  draw();
  syncUndoButtons();
}
function syncUndoButtons() {
  document.getElementById("undoBtn").disabled = historyIdx <= 0;
  document.getElementById("redoBtn").disabled = historyIdx >= history.length - 1;
}

// ---------- rendering ----------
const preview = document.getElementById("preview");
function draw() {
  syncPanelPhotos();
  renderCover(preview, state);
  const cap = document.getElementById("stageCaption");
  if (cap) {
    cap.textContent =
      `Live preview · ${getLayout(state.layoutId).name} · ${getGrade(state.gradeId).name}`;
  }
  buildSlots();
}

// ---------- editor UI ----------
function buildPhotoList() {
  const list = document.getElementById("photoList");
  list.innerHTML = "";
  state.photos.forEach((p, i) => {
    const fig = document.createElement("figure");
    if (i === state.selectedPhoto) fig.className = "selected";
    const im = document.createElement("img");
    im.src = p.img.src;
    im.alt = p.name;
    const cap = document.createElement("figcaption");
    cap.textContent = p.name;
    fig.append(im, cap);
    fig.addEventListener("click", () => {
      state.selectedPhoto = i;
      buildPhotoList();
      syncCropControls();
    });
    list.appendChild(fig);
  });
}

function buildSlots() {
  const list = document.getElementById("slotList");
  if (!list) return;
  list.innerHTML = "";
  getLayout(state.layoutId).panels.forEach((_, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = `Panel ${i + 1}: ${state.photos[state.panelPhotos[i]]?.name || "—"}`;
    b.addEventListener("click", () => {
      state.panelPhotos[i] = state.selectedPhoto;
      pushHistory();
      draw();
    });
    list.appendChild(b);
  });
}

function buildPickers() {
  const ll = document.getElementById("layoutList");
  ll.innerHTML = "";
  for (const l of LAYOUTS) {
    const b = document.createElement("button");
    b.type = "button";
    if (l.id === state.layoutId) b.className = "active";
    const bold = document.createElement("b");
    bold.textContent = `${l.name} · ${l.panels.length}`;
    const span = document.createElement("span");
    span.textContent = l.blurb;
    b.append(bold, span);
    b.addEventListener("click", () => {
      state.layoutId = l.id;
      syncPanelPhotos();
      pushHistory();
      buildPickers();
      draw();
    });
    ll.appendChild(b);
  }
  const gl = document.getElementById("gradeList");
  gl.innerHTML = "";
  for (const g of GRADES) {
    const b = document.createElement("button");
    b.type = "button";
    if (g.id === state.gradeId) b.className = "active";
    const sw = document.createElement("span");
    sw.className = "swatch";
    sw.style.background = `linear-gradient(90deg, ${g.stops.join(",")})`;
    const bold = document.createElement("b");
    bold.textContent = g.name;
    b.append(sw, bold);
    b.addEventListener("click", () => {
      state.gradeId = g.id;
      pushHistory();
      buildPickers();
      draw();
    });
    gl.appendChild(b);
  }
  document.getElementById("titleInput").value = state.title;
  document.getElementById("subtitleInput").value = state.subtitle;
  document.getElementById("dressingCheck").checked = state.dressing;
  document.getElementById("halftoneRange").value = state.halftone;
  document.getElementById("grainRange").value = state.grain;
  document.getElementById("vignetteRange").value = state.vignette;
}

function syncCropControls() {
  const p = state.photos[state.selectedPhoto];
  if (!p) return;
  document.getElementById("oxRange").value = p.ox;
  document.getElementById("oyRange").value = p.oy;
  document.getElementById("zoomRange").value = p.zoom;
}

function exportPng(w, h) {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  renderCover(c, state);
  const a = document.createElement("a");
  a.download = `vice-key-art-${w}x${h}.png`;
  a.href = c.toDataURL("image/png");
  a.click();
}

function wireEditor() {
  document.querySelectorAll("#steps button").forEach((b) => {
    b.addEventListener("click", () => {
      document.querySelectorAll("#steps button").forEach((x) => x.classList.remove("active"));
      b.classList.add("active");
      document.querySelectorAll(".step-page").forEach((p) => {
        p.hidden = p.dataset.page !== b.dataset.step;
      });
    });
  });
  document.getElementById("fileInput").addEventListener("change", async (e) => {
    for (const file of e.target.files) {
      const url = URL.createObjectURL(file);
      await addPhoto(url, file.name.replace(/\.[^.]+$/, ""));
    }
    state.selectedPhoto = state.photos.length - 1;
    buildPhotoList();
    syncCropControls();
    pushHistory();
    draw();
  });
  const crop = (key, id) => {
    document.getElementById(id).addEventListener("input", (e) => {
      const p = state.photos[state.selectedPhoto];
      if (!p) return;
      p[key] = parseFloat(e.target.value);
      draw();
    });
    document.getElementById(id).addEventListener("change", pushHistory);
  };
  crop("ox", "oxRange"); crop("oy", "oyRange"); crop("zoom", "zoomRange");
  document.getElementById("refocusBtn").addEventListener("click", () => {
    const p = state.photos[state.selectedPhoto];
    if (!p) return;
    p.focus = computeFocus(p.img);
    p.ox = 0; p.oy = 0;
    pushHistory();
    draw();
  });
  const finish = (key, id) => {
    document.getElementById(id).addEventListener("input", (e) => {
      state[key] = parseFloat(e.target.value);
      draw();
    });
    document.getElementById(id).addEventListener("change", pushHistory);
  };
  finish("halftone", "halftoneRange");
  finish("grain", "grainRange");
  finish("vignette", "vignetteRange");
  document.getElementById("titleInput").addEventListener("input", (e) => {
    state.title = e.target.value;
    draw();
  });
  document.getElementById("titleInput").addEventListener("change", pushHistory);
  document.getElementById("subtitleInput").addEventListener("input", (e) => {
    state.subtitle = e.target.value;
    draw();
  });
  document.getElementById("subtitleInput").addEventListener("change", pushHistory);
  document.getElementById("dressingCheck").addEventListener("change", (e) => {
    state.dressing = e.target.checked;
    pushHistory();
    draw();
  });
  document.querySelectorAll("[data-export]").forEach((b) => {
    b.addEventListener("click", () => {
      if (b.dataset.export === "all") {
        exportPng(1080, 1080); exportPng(1080, 1350); exportPng(1920, 1080);
      } else {
        const [w, h] = b.dataset.export.split("x").map(Number);
        exportPng(w, h);
      }
    });
  });
  document.getElementById("exportBtnTop").addEventListener("click", () => exportPng(1080, 1080));
  document.getElementById("undoBtn").addEventListener("click", () => {
    if (historyIdx > 0) { historyIdx--; restore(history[historyIdx]); }
  });
  document.getElementById("redoBtn").addEventListener("click", () => {
    if (historyIdx < history.length - 1) { historyIdx++; restore(history[historyIdx]); }
  });
}

// ---------- shot modes (deterministic screenshots) ----------
const SHOT_PRESETS = {
  cover: { layoutId: "key-wide", gradeId: "vice-sunset", title: "VICE HEAT", subtitle: "Leonida Nights" },
  story: { layoutId: "ensemble", gradeId: "neon-rain", title: "VICE HEAT", subtitle: "Neon Rain Confessions" },
  square: { layoutId: "center-stage", gradeId: "golden-hour", title: "VICE HEAT", subtitle: "Golden Hour in Leonida" },
};

async function boot() {
  for (const s of SAMPLES) await addPhoto(s.src, s.name);
  syncPanelPhotos();
  const shot = new URLSearchParams(location.search).get("shot");
  try { await document.fonts.ready; } catch { /* fonts are local; proceed */ }

  if (shot && SHOT_PRESETS[shot]) {
    Object.assign(state, SHOT_PRESETS[shot]);
    syncPanelPhotos();
    document.body.classList.add("shot");
    const c = document.getElementById("shotCanvas");
    c.hidden = false;
    c.width = window.innerWidth;
    c.height = window.innerHeight;
    renderCover(c, state);
    document.title = `shot-${shot}`;
    return;
  }
  if (shot === "editor") {
    // Editor UI with samples loaded; preview sized for a 1280×800 frame.
    preview.width = 760; preview.height = 760;
    buildPhotoList();
    buildPickers();
    syncCropControls();
    wireEditor();
    pushHistory();
    draw();
    document.title = "shot-editor";
    return;
  }
  buildPhotoList();
  buildPickers();
  syncCropControls();
  wireEditor();
  pushHistory();
  draw();
}

boot();
