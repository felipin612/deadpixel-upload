// EP03 "STILLWATER" screens. Same conventions: draw(g, w, h, t, dur) at internal resolution.
import { px } from './screens.js';
import { wrap, clamp01, ease } from './lib.js';

export const CATCH = [
  ['PERCH', '—', '2003'], ['PIKE', '—', '2003'], ['BOOT', 'R. KELL', '1961'], ['BICYCLE BELL', 'D. MARSH', '1987'],
  ['PERCH', '—', '2003'], ['WRISTWATCH', 'YOU', '1998'], ['DOG COLLAR', 'YOU', '1994'], ['GAME BOY', 'YOU', '1996'],
  ['LETTER', 'YOU', '2001'], ['RING', 'YOU', '2002'],
];

export function drawTitleSW(g, w, h, t) {
  const grd = g.createLinearGradient(0, 0, 0, h); grd.addColorStop(0, '#3a3f52'); grd.addColorStop(0.55, '#8a8c96'); grd.addColorStop(0.56, '#b8bcc0'); grd.addColorStop(1, '#d8dcdc');
  g.fillStyle = grd; g.fillRect(0, 0, w, h);
  g.fillStyle = '#23262c'; for (let i = 0; i < 40; i++) { const x = i * w / 40, hh = h * (0.03 + ((i * 37) % 7) / 140); g.fillRect(x, h * 0.555 - hh, w / 40 + 1, hh); }
  // shack + hole
  g.fillStyle = '#4a3a2c'; g.fillRect(w * 0.62, h * 0.6, w * 0.12, h * 0.1); g.fillStyle = '#2a2420'; g.fillRect(w * 0.61, h * 0.585, w * 0.14, h * 0.02);
  g.fillStyle = '#ffcf80'; g.fillRect(w * 0.66, h * 0.63, 3, 3);
  g.fillStyle = '#0a0c10'; g.beginPath(); g.ellipse(w * 0.45, h * 0.78, w * 0.05, h * 0.02, 0, 0, 7); g.fill();
  for (let i = 0; i < 30; i++) { const x = ((i * 53 + t * 9) % w), y = (i * 29 + t * 14) % (h * 0.9); g.fillStyle = 'rgba(240,240,250,0.5)'; g.fillRect(x, y, 1, 1); }
  g.fillStyle = '#f0f0ec'; g.textAlign = 'center'; g.font = `bold ${px(w, h, 26)}px Georgia, serif`;
  g.fillText('STILLWATER', w / 2, h * 0.28);
  g.font = `${px(w, h, 10)}px monospace`; g.fillStyle = `rgba(30,30,40,${0.5 + 0.5 * Math.sin(t * 3)})`;
  g.fillText('PRESS START', w / 2, h * 0.9);
  g.textAlign = 'left';
}

// Catch log page: rows appear with reveal (0..1). greyLast adds the uncaught T. Rowe entry.
export function drawCatchLog(g, w, h, t, rows, reveal = 1, greyLast = false, hi = -1) {
  g.fillStyle = '#e6dfcc'; g.fillRect(0, 0, w, h);
  g.strokeStyle = 'rgba(90,110,160,0.35)'; for (let y = h * 0.16; y < h; y += px(w, h, 15)) { g.beginPath(); g.moveTo(0, y + 0.5); g.lineTo(w, y + 0.5); g.stroke(); }
  g.fillStyle = '#2a2a2a'; g.font = `bold ${px(w, h, 12)}px Georgia, serif`; g.fillText('CATCH LOG', w * 0.06, h * 0.1);
  g.font = `${px(w, h, 8)}px monospace`; g.fillStyle = '#6a6458'; g.fillText('STILLWATER · MERROW', w * 0.55, h * 0.1);
  const lh = px(w, h, 15), n = Math.floor(rows.length * clamp01(reveal) + 0.001);
  const vert = h > w;
  rows.slice(0, n).forEach((r, i) => {
    const y = h * 0.16 + (i + 1) * lh - 4;
    if (i === hi) { g.fillStyle = `rgba(200,40,30,${0.18 + 0.1 * Math.sin(t * 5)})`; g.fillRect(0, y - lh + 5, w, lh); }
    g.fillStyle = '#5a5246'; g.fillRect(w * 0.05, y - lh * 0.55, lh * 0.5, lh * 0.5);
    g.fillStyle = '#1e1e1e'; g.font = `${px(w, h, 9)}px monospace`;
    g.fillText(r[0], w * 0.05 + lh * 0.8, y);
    g.fillStyle = r[1] === 'YOU' ? '#a02020' : '#3a3a3a';
    g.fillText(r[1] === '—' ? '' : 'LOST BY ' + r[1], vert ? w * 0.5 : w * 0.42, y);
    if (!vert) { g.fillStyle = '#555'; g.fillText(r[2], w * 0.82, y); }
  });
  if (greyLast) {
    const y = h * 0.16 + (n + 1) * lh - 4; g.globalAlpha = 0.45 + 0.25 * Math.sin(t * 2);
    g.strokeStyle = '#444'; g.strokeRect(w * 0.05 + 0.5, y - lh * 0.55 + 0.5, lh * 0.5, lh * 0.5);
    g.fillStyle = '#333'; g.font = `${px(w, h, 9)}px monospace`;
    g.fillText('MEMORY CARD', w * 0.05 + lh * 0.8, y);
    g.fillText('LOST BY T. ROWE', vert ? w * 0.5 : w * 0.42, y); g.fillText('03/03/2004', vert ? w * 0.5 : w * 0.8, vert ? y + lh : y);
    g.globalAlpha = 1;
    g.fillStyle = '#4a4438'; g.font = `italic ${px(w, h, 8)}px Georgia, serif`;
    wrap(g, 'He was walking back to the boathouse. The ice was thinner than the build said.', w * 0.06, y + lh * (vert ? 2.2 : 1.4), w * 0.88, px(w, h, 10));
  }
}

export function drawPauseSW(g, w, h, t, blink = false) {
  g.fillStyle = 'rgba(10,14,22,0.86)'; g.fillRect(0, 0, w, h);
  g.textAlign = 'center'; g.fillStyle = '#e0e4ea';
  g.font = `bold ${px(w, h, 16)}px monospace`; g.fillText('PAUSE', w / 2, h * 0.22);
  g.font = `${px(w, h, 9)}px monospace`; g.fillStyle = '#8a92a0'; g.fillText('RULE 1', w / 2, h * 0.34);
  g.fillStyle = blink && Math.floor(t * 2) % 2 ? '#ff5050' : '#eef0f4'; g.font = `${px(w, h, 11)}px monospace`;
  g.fillText('IF THE LINE GOES STILL,', w / 2, h * 0.42); g.fillText('CUT IT.', w / 2, h * 0.42 + px(w, h, 14));
  g.fillStyle = '#7a808a'; g.font = `${px(w, h, 8)}px monospace`; g.fillText('CONTINUE    CATCH LOG    QUIT', w / 2, h * 0.75);
  g.textAlign = 'left';
}

// paid newspaper archive search result
export function drawArchive(g, w, h, t, which = 1961) {
  g.fillStyle = '#f2f2f2'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#1f3a6a'; g.fillRect(0, 0, w, h * 0.09);
  g.fillStyle = '#fff'; g.font = `bold ${px(w, h, 9)}px Verdana, sans-serif`; g.fillText('CountyNewsArchive  ·  search: "' + (which === 1961 ? 'Kell Merrow' : 'Marsh bicycle') + '"', 6, h * 0.06);
  g.fillStyle = '#e8e2d0'; g.fillRect(w * 0.08, h * 0.15, w * 0.84, h * 0.78);
  g.fillStyle = '#222'; g.font = `bold ${px(w, h, 12)}px Georgia, serif`;
  g.fillText(which === 1961 ? 'MAN LOST THROUGH ICE' : 'BICYCLE TAKEN', w * 0.12, h * 0.26);
  g.font = `${px(w, h, 8)}px Georgia, serif`;
  wrap(g, which === 1961 ? 'R. Kell, 44, went through the ice on Merrow Lake on Saturday evening while fishing alone near the north shore. Searchers recovered his rod and a single boot.' : 'D. Marsh of Elm Street reports a red bicycle taken from outside the hardware store.', w * 0.12, h * 0.36, w * 0.76, px(w, h, 11));
  const z = clamp01(t / 3); g.fillStyle = `rgba(255,220,0,${0.35 * z})`; g.fillRect(w * 0.11, h * 0.18, w * 0.6 * z, h * 0.11);
  g.fillStyle = '#555'; g.font = `${px(w, h, 7)}px Verdana, sans-serif`; g.fillText(which === 1961 ? 'MERROW COURIER · FEB 1961' : 'COUNTY HERALD · JUN 1987', w * 0.12, h * 0.88);
}

export function drawMagazineSW(g, w, h, t, zoom = 0) {
  g.fillStyle = '#efe9da'; g.fillRect(0, 0, w, h);
  const z = 1 + ease(zoom) * 0.3; g.save(); g.translate(w * 0.05, h * 0.72); g.scale(z, z); g.translate(-w * 0.05, -h * 0.72);
  g.fillStyle = '#1f5a9a'; g.fillRect(w * 0.06, h * 0.06, w * 0.88, h * 0.1);
  g.fillStyle = '#fff'; g.font = `bold ${px(w, h, 12)}px Georgia, serif`; g.fillText('WINTER PREVIEW · STILLWATER', w * 0.09, h * 0.13);
  g.fillStyle = '#c8ccd0'; g.fillRect(w * 0.06, h * 0.2, w * 0.4, h * 0.34);
  g.fillStyle = '#4a3a2c'; g.fillRect(w * 0.3, h * 0.36, w * 0.08, h * 0.06); g.fillStyle = '#111'; g.fillRect(w * 0.16, h * 0.46, w * 0.06, h * 0.02);
  g.fillStyle = '#222'; g.font = `${px(w, h, 8)}px Georgia, serif`;
  wrap(g, 'Relaxing ice fishing from the small team at Dead Pixel. Every lake is built from real local records.', w * 0.5, h * 0.24, w * 0.44, px(w, h, 10));
  g.fillStyle = '#1f3a6a'; g.font = `bold ${px(w, h, 8)}px Georgia, serif`;
  wrap(g, 'The studio works from an old boathouse on the shore of the lake it recreates. Players near Merrow may recognise the view.', w * 0.06, h * 0.68, w * 0.86, px(w, h, 10));
  g.restore();
}

export function drawForumSW(g, w, h, t, reveal) {
  g.fillStyle = '#d4d0c8'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#3a4a7a'; g.fillRect(0, 0, w, h * 0.1);
  g.fillStyle = '#fff'; g.font = `bold ${px(w, h, 10)}px Verdana, sans-serif`; g.fillText('RetroGamerBoards :: Lost & Unreleased', 6, h * 0.07);
  g.fillStyle = '#e8e6e0'; g.fillRect(6, h * 0.14, w - 12, h * 0.16);
  g.fillStyle = '#222'; g.font = `${px(w, h, 8)}px Verdana, sans-serif`;
  wrap(g, 'Re: STILLWATER (Dead Pixel, PS2, unreleased)', 10, h * 0.2, w - 24, px(w, h, 10));
  g.fillStyle = '#f2f0ea'; g.fillRect(6, h * 0.34, w - 12, h * 0.6);
  g.fillStyle = '#222';
  const m1 = "Don't catch the last thing in the log. The log knows what everyone lost. Including the people who made it.";
  const m2 = 'The debug map shows where they are.';
  const n1 = Math.floor(m1.length * clamp01(reveal * 1.6)), n2 = Math.floor(m2.length * clamp01((reveal - 0.7) / 0.3));
  g.font = `${px(w, h, 8)}px Verdana, sans-serif`;
  wrap(g, m1.slice(0, n1), 10, h * 0.4, w - 24, px(w, h, 11));
  if (n2 > 0) { g.fillStyle = '#6a1a1a'; wrap(g, m2.slice(0, n2), 10, h * 0.7, w - 24, px(w, h, 11)); }
  g.font = `bold ${px(w, h, 9)}px Verdana, sans-serif`; g.fillStyle = '#1a2a6a'; g.fillText('— 0303200400', 10, h * 0.9);
}

export function drawDebugSW(g, w, h, t, sel) {
  g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
  g.font = `${px(w, h, 9)}px monospace`; g.fillStyle = '#2aff6a';
  g.fillText('STILLWATER BUILD 0.8  [DEBUG]', 8, px(w, h, 16));
  const items = ['TOGGLE ICE', 'SHOW FISH PATHS', 'FREE CAMERA', 'LAKE MAP'];
  items.forEach((it, i) => {
    const y = px(w, h, 40) + i * px(w, h, 14);
    if (i === sel) { g.fillStyle = '#2aff6a'; g.fillRect(6, y - px(w, h, 10), w - 12, px(w, h, 13)); g.fillStyle = '#000'; }
    else g.fillStyle = '#2aff6a';
    g.fillText((i === sel ? '> ' : '  ') + it, 10, y);
  });
}

// top-down lake map; zoom (0..1) pushes into the north-shore building
export function drawLakeMap(g, w, h, t, reveal = 1, zoom = 0) {
  g.fillStyle = '#0a1a0e'; g.fillRect(0, 0, w, h);
  const z = 1 + ease(zoom) * 1.3, cx = w * 0.5, cy = h * 0.22;
  g.save(); if (h > w) g.translate(0, h * 0.14); g.translate(cx, cy); g.scale(z, z); g.translate(-cx, -cy);
  g.strokeStyle = 'rgba(42,255,106,0.15)'; for (let x = 0; x < w; x += 8) { g.beginPath(); g.moveTo(x + 0.5, 0); g.lineTo(x + 0.5, h); g.stroke(); } for (let y = 0; y < h; y += 8) { g.beginPath(); g.moveTo(0, y + 0.5); g.lineTo(w, y + 0.5); g.stroke(); }
  g.fillStyle = '#18324a'; g.beginPath(); g.ellipse(w / 2, h * 0.56, w * 0.34, h * 0.3, 0.1, 0, 7); g.fill();
  g.strokeStyle = '#2aff6a'; g.stroke();
  let s = 7; const r = () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
  const n = Math.floor(260 * clamp01(reveal));
  for (let i = 0; i < 260; i++) { const a = r() * 6.28, d = Math.sqrt(r()); if (i >= n) continue; g.fillStyle = '#e03028'; g.fillRect(Math.round(w / 2 + Math.cos(a) * d * w * 0.3), Math.round(h * 0.56 + Math.sin(a) * d * h * 0.26), 2, 2); }
  g.fillStyle = '#e8e8e8'; g.fillRect(Math.round(w / 2 - 5), Math.round(h * 0.2), 10, 7);
  if (reveal > 0.6) { g.fillStyle = '#e8e8e8'; g.textAlign = 'center'; g.font = `${px(w, h, 7)}px monospace`; g.fillText('DEAD PIXEL STUDIOS', w / 2, h * 0.185); g.fillStyle = Math.floor(t * 2) % 2 ? '#ffd600' : '#e8e8e8'; g.fillText('14 MERROW ROAD', w / 2, h * 0.27 + px(w, h, 4)); g.textAlign = 'left'; }
  g.restore();
  g.fillStyle = '#2aff6a'; g.font = `${px(w, h, 8)}px monospace`; g.fillText('LAKE MAP · MERROW', 6, h - 6);
}

// the black case spine / tackle box close-up
export function drawSpine(g, w, h, t) {
  g.fillStyle = '#1a1c1a'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#6a7a5a'; g.fillRect(0, h * 0.7, w, h * 0.3);
  g.fillStyle = '#0c0c0e'; g.fillRect(w * 0.2, h * 0.15, w * 0.6, h * 0.62);
  g.strokeStyle = '#c8c8cc'; g.lineWidth = 2; const s = Math.min(w, h) * 0.12; g.strokeRect(w * 0.5 - s / 2, h * 0.25, s, s); g.fillStyle = '#c8c8cc'; g.fillRect(w * 0.5 + s / 6, h * 0.25, s / 3, s / 3);
  g.fillStyle = '#f0f0f0'; g.textAlign = 'center'; g.font = `bold ${px(w, h, 16)}px 'Comic Sans MS', cursive`; g.fillText('STILLWATER', w / 2, h * 0.58);
  g.font = `${px(w, h, 9)}px 'Comic Sans MS', cursive`; g.globalAlpha = clamp01((t - 1.5) / 1); g.fillText('keep the hole open', w / 2, h * 0.68); g.globalAlpha = 1; g.textAlign = 'left';
}
