// EP05 "LAMPLIGHT" screens. Same conventions as screens.js: draw(g, w, h, t, dur) at internal resolution.
import { px } from './screens.js';
import { wrap, clamp01, ease } from './lib.js';

export function drawTitleLL(g, w, h, t) {
  const grd = g.createLinearGradient(0, 0, 0, h); grd.addColorStop(0, '#04060c'); grd.addColorStop(1, '#0c1420');
  g.fillStyle = grd; g.fillRect(0, 0, w, h);
  // lake line and the lighthouse silhouette with a turning beam
  const hy = h * 0.62; g.fillStyle = '#060a10'; g.fillRect(0, hy, w, h - hy);
  const lx = w * 0.72, top = hy - h * 0.3;
  const a = t * 0.9; g.save(); g.translate(lx, top); g.globalAlpha = 0.18 + 0.1 * Math.abs(Math.cos(a));
  g.fillStyle = '#fff3c4'; g.beginPath(); g.moveTo(0, 0); const L = w * 0.9; const dx = Math.cos(a) * L;
  g.lineTo(dx, -h * 0.03); g.lineTo(dx, h * 0.06); g.closePath(); g.fill(); g.restore(); g.globalAlpha = 1;
  g.fillStyle = '#1a1e26'; g.fillRect(lx - w * 0.018, top, w * 0.036, hy - top);
  g.fillStyle = '#ffe9a0'; g.fillRect(lx - w * 0.014, top - h * 0.03, w * 0.028, h * 0.03);
  g.fillStyle = '#2a2a2a'; g.fillRect(lx - w * 0.3, hy - 2, w * 0.3, 3);
  for (let i = 0; i < 8; i++) { const bx = w * (0.08 + i * 0.07), by = hy + h * (0.05 + (i % 3) * 0.04);
    g.fillStyle = '#ffd060'; g.fillRect(Math.round(bx), Math.round(by), 2, 2); }
  g.fillStyle = '#eae4cc'; g.textAlign = 'center'; g.font = `bold ${px(w, h, 22)}px monospace`;
  g.fillText('LAMPLIGHT', w / 2, h * (w > h ? 0.24 : 0.2));
  g.font = `${px(w, h, 8)}px monospace`; g.fillStyle = '#8a8f9a'; g.fillText('DEAD PIXEL STUDIOS  2003', w / 2, h * (w > h ? 0.31 : 0.25));
  if (Math.floor(t * 1.6) % 2 === 0) { g.fillStyle = '#d8d8d8'; g.fillText('PRESS START', w / 2, h * 0.9); }
  g.textAlign = 'left';
}

// keeper's log page: rows of TIME / WEATHER / BOATS. rows = [[time, weather, boats, hand]], hand: 0 old keeper, 1 me
export const LOG = [['22:00', 'CLEAR', '8'], ['23:00', 'CLEAR', '8'], ['00:00', 'MIST', '8'], ['01:00', 'MIST', '8'], ['02:00', 'RAIN', '8'], ['03:00', 'RAIN', '8']];
export function drawLog(g, w, h, t, opts = {}) {
  const { rows = LOG, reveal = 1, cross = -1, last = null, date = null, zoom = 0, banner = null } = opts;
  g.fillStyle = '#0a0a0c'; g.fillRect(0, 0, w, h);
  const z = 1 + zoom * 0.6; g.save(); g.translate(w / 2, h / 2); g.scale(z, z); g.translate(-w / 2, -h / 2 - zoom * h * 0.12);
  const pw = w > h ? w * 0.7 : w * 0.88, ph = h * (w > h ? 0.88 : 0.6), x0 = (w - pw) / 2, y0 = (h - ph) / 2;
  g.fillStyle = '#e8e0c8'; g.fillRect(x0, y0, pw, ph);
  if (banner) { g.fillStyle = '#ffd600'; g.textAlign = 'center'; g.font = `bold ${px(w, h, 13)}px monospace`; g.fillText(banner, w / 2, y0 - px(w, h, 10)); g.textAlign = 'left'; }
  g.strokeStyle = '#9aa8c0'; g.lineWidth = 1; const lh = ph / 11;
  for (let i = 1; i < 11; i++) { g.beginPath(); g.moveTo(x0, Math.round(y0 + i * lh) + 0.5); g.lineTo(x0 + pw, Math.round(y0 + i * lh) + 0.5); g.stroke(); }
  g.strokeStyle = '#c05050'; for (const f of [0.22, 0.62]) { g.beginPath(); g.moveTo(Math.round(x0 + pw * f) + 0.5, y0); g.lineTo(Math.round(x0 + pw * f) + 0.5, y0 + ph); g.stroke(); }
  g.fillStyle = '#2a2a40'; g.font = `bold ${px(w, h, 8)}px monospace`;
  g.fillText('TIME', x0 + 6, y0 + lh * 0.7); g.fillText('WEATHER', x0 + pw * 0.24, y0 + lh * 0.7); g.fillText('BOATS', x0 + pw * 0.64, y0 + lh * 0.7);
  if (date) { g.fillStyle = '#5a4a3a'; g.textAlign = 'right'; g.fillText(date, x0 + pw - 6, y0 + lh * 0.7); g.textAlign = 'left'; }
  const all = last ? rows.concat([last]) : rows; const shown = Math.ceil(all.length * clamp01(reveal));
  g.font = `italic ${px(w, h, 10)}px Georgia, serif`;
  for (let i = 0; i < shown; i++) { const r = all[i], y = y0 + lh * (i + 1.75);
    g.fillStyle = r[3] ? '#1a2a6a' : '#3a3a3a';
    g.fillText(r[0], x0 + 6, y); g.fillText(r[1], x0 + pw * 0.24, y);
    if (i === cross) { g.fillText('9', x0 + pw * 0.66, y); g.strokeStyle = '#3a3a3a'; g.lineWidth = 2; g.beginPath(); g.moveTo(x0 + pw * 0.65, y - 3); g.lineTo(x0 + pw * 0.72, y - 3); g.stroke(); g.lineWidth = 1;
      g.fillStyle = '#3a3a3a'; g.font = `italic ${px(w, h, 8)}px Georgia, serif`; g.fillText('8', x0 + pw * 0.74, y - lh * 0.35); g.font = `italic ${px(w, h, 10)}px Georgia, serif`; }
    else { g.fillStyle = (last && i === all.length - 1) ? '#8a1a14' : g.fillStyle; g.fillText(r[2], x0 + pw * 0.64, y); }
  }
  g.restore();
}

// level viewer: top-down Merrow Lake with the four games; beam fixed on the boathouse
export function drawMapViewer(g, w, h, t, reveal = 1, beam = 0) {
  g.fillStyle = '#20242c'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#c8ccd4'; g.fillRect(0, 0, w, px(w, h, 13)); g.fillStyle = '#111'; g.font = `${px(w, h, 8)}px monospace`;
  g.fillText('LEVELVIEW 0.4 - MERROW.MAP', 4, px(w, h, 10));
  const cx = w / 2, cy = h * 0.55, rx = Math.min(w * 0.42, h * 0.6), ry = Math.min(h * 0.34, w * 0.5);
  g.strokeStyle = '#3a4a5a'; for (let x = 0; x < w; x += 16) { g.beginPath(); g.moveTo(x + 0.5, px(w, h, 13)); g.lineTo(x + 0.5, h); g.stroke(); }
  for (let y = px(w, h, 13); y < h; y += 16) { g.beginPath(); g.moveTo(0, y + 0.5); g.lineTo(w, y + 0.5); g.stroke(); }
  g.fillStyle = '#16324a'; g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#c8dcec'; g.beginPath(); g.ellipse(cx + rx * 0.05, cy + ry * 0.05, rx * 0.28, ry * 0.3, 0, 0, Math.PI * 2); g.globalAlpha = 0.35; g.fill(); g.globalAlpha = 1;
  const pts = [['SALTMARSH', cx - rx * 0.1, cy - ry * 1.05, '#d0d0d0'], ['STILLWATER', cx + rx * 0.05, cy + ry * 0.05, '#9ad0ff'],
    ['SIGNALMAN', cx + rx * 0.98, cy - ry * 0.2, '#ff6a50'], ['LAMPLIGHT', cx - rx * 0.62, cy + ry * 0.62, '#ffd060']];
  const n = Math.ceil(pts.length * clamp01(reveal)); g.font = `bold ${px(w, h, 8)}px monospace`;
  for (let i = 0; i < n; i++) { const [name, x, y, c] = pts[i]; g.fillStyle = c; g.fillRect(Math.round(x) - 3, Math.round(y) - 3, 6, 6);
    g.textAlign = x > cx + rx * 0.5 ? 'right' : 'left'; g.fillText(name, x + (g.textAlign === 'right' ? -6 : 6), y - 4); }
  g.textAlign = 'left';
  // boathouse on the west shore
  const bx = cx - rx * 1.0, by = cy - ry * 0.25; g.fillStyle = '#8a6a4a'; g.fillRect(Math.round(bx) - 4, Math.round(by) - 3, 8, 6);
  if (beam > 0) { const lx = pts[3][1], ly = pts[3][2]; g.globalAlpha = 0.5 * clamp01(beam); g.fillStyle = '#fff0b0';
    g.beginPath(); g.moveTo(lx, ly); g.lineTo(bx + 4, by - 8); g.lineTo(bx + 4, by + 8); g.closePath(); g.fill(); g.globalAlpha = 1;
    if (beam > 0.6) { g.fillStyle = '#ffd600'; g.font = `bold ${px(w, h, 9)}px monospace`; g.fillText('14 MERROW RD', Math.max(2, bx - 20), by - 12); } }
}

// disc file listing
export function drawFiles(g, w, h, t, sel = 4) {
  g.fillStyle = '#c0c0c0'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#000080'; g.fillRect(0, 0, w, px(w, h, 13)); g.fillStyle = '#fff'; g.font = `bold ${px(w, h, 8)}px monospace`; g.fillText('D:\\  LAMPLIGHT', 4, px(w, h, 10));
  g.fillStyle = '#fff'; g.fillRect(6, px(w, h, 18), w - 12, h - px(w, h, 24));
  const files = [['SYSTEM.CNF', '1 KB'], ['SLUS_208.03', '612 KB'], ['SOUND.BNK', '2,104 KB'], ['FONT.TIM', '18 KB'], ['MERROW.MAP', '41,880 KB']];
  g.font = `${px(w, h, 9)}px monospace`;
  files.forEach(([f, s], i) => { const y = px(w, h, 34) + i * px(w, h, 15);
    if (i === sel && Math.floor(t * 2) % 2 === 0) { g.fillStyle = '#000080'; g.fillRect(10, y - px(w, h, 10), w - 20, px(w, h, 13)); g.fillStyle = '#fff'; } else g.fillStyle = '#000';
    g.fillText(f, 14, y); g.textAlign = 'right'; g.fillText(s, w - 14, y); g.textAlign = 'left'; });
}

export function drawCounter(g, w, h, n) {
  g.clearRect(0, 0, w, h); g.fillStyle = 'rgba(0,0,0,0.6)'; g.fillRect(0, 0, w, h);
  g.strokeStyle = '#c8c8d0'; g.strokeRect(1.5, 1.5, w - 3, h - 3);
  g.fillStyle = '#ffd060'; g.font = 'bold 11px monospace'; g.textBaseline = 'middle'; g.fillText('COUNT ' + n, 7, h / 2 + 1); g.textBaseline = 'alphabetic';
}
