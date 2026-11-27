// EP04 "SIGNALMAN" screens. Same conventions: draw(g, w, h, t, dur) at internal resolution.
import { px } from './screens.js';
import { wrap, clamp01, ease } from './lib.js';

export const TIMETABLE = [
  ['22:10', 'FREIGHT', 'UP MAIN'], ['23:40', 'MAIL', 'UP MAIN'], ['00:55', 'COAL (EMPTY)', 'DOWN'],
  ['01:30', 'COAL (EMPTY)', 'DOWN'], ['05:12', 'MILK', 'UP MAIN'], ['06:02', 'PASSENGER', 'UP MAIN'],
];

function rain(g, w, h, t, n = 60, a = 0.35) {
  g.strokeStyle = `rgba(190,200,215,${a})`; g.lineWidth = 1;
  for (let i = 0; i < n; i++) { const x = (i * 97 + t * 40) % w, y = (i * 53 + t * 260) % h; g.beginPath(); g.moveTo(x + 0.5, y); g.lineTo(x - 1.5, y + 6); g.stroke(); }
}

export function drawTitleSM(g, w, h, t) {
  const grd = g.createLinearGradient(0, 0, 0, h); grd.addColorStop(0, '#0b0e16'); grd.addColorStop(0.7, '#1b2030'); grd.addColorStop(1, '#0d0f14');
  g.fillStyle = grd; g.fillRect(0, 0, w, h);
  // rails vanishing
  g.strokeStyle = '#4a4e58'; g.lineWidth = 1;
  g.beginPath(); g.moveTo(w * 0.49, h * 0.62); g.lineTo(w * 0.25, h); g.moveTo(w * 0.51, h * 0.62); g.lineTo(w * 0.75, h); g.stroke();
  for (let i = 0; i < 10; i++) { const k = i / 10, y = h * 0.62 + (h * 0.38) * k * k; g.fillStyle = '#2a2622'; g.fillRect(w * (0.49 - 0.24 * k * k) - 2, y, w * 0.48 * k * k + 4 + 2, 1 + k * 2); }
  // signal box on stilts
  const bx = w * 0.66, by = h * 0.42, bw = w * 0.16, bh = h * 0.12;
  g.fillStyle = '#3a2c22'; g.fillRect(bx, by, bw, bh); g.fillStyle = '#22201e'; g.fillRect(bx - 3, by - 4, bw + 6, 4);
  g.fillStyle = '#2a2420'; g.fillRect(bx + 2, by + bh, 2, h * 0.14); g.fillRect(bx + bw - 4, by + bh, 2, h * 0.14);
  g.fillStyle = `rgba(255,200,120,${0.8 + 0.2 * Math.sin(t * 7)})`; g.fillRect(bx + bw * 0.35, by + bh * 0.3, bw * 0.3, bh * 0.35);
  // signal post, red lamp
  g.fillStyle = '#2a2a2a'; g.fillRect(w * 0.36, h * 0.36, 2, h * 0.27); g.fillStyle = '#ff2a1a'; g.fillRect(w * 0.36 - 1, h * 0.37, 4, 4);
  rain(g, w, h, t);
  g.fillStyle = '#e8e4da'; g.textAlign = 'center'; g.font = `bold ${px(w, h, 26)}px Georgia, serif`;
  g.fillText('SIGNALMAN', w / 2, h * 0.24);
  g.font = `${px(w, h, 10)}px monospace`; g.fillStyle = `rgba(220,220,210,${0.5 + 0.5 * Math.sin(t * 3)})`;
  g.fillText('PRESS START', w / 2, h * 0.9);
  g.textAlign = 'left';
}

// Paper timetable. circled: highlight the 03:03 pencil circle; back: show the back side note
export function drawTimetable(g, w, h, t, rows = TIMETABLE, circled = false, extra = false) {
  g.fillStyle = '#e4dcc6'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#2a2a2a'; g.font = `bold ${px(w, h, 11)}px Georgia, serif`; g.fillText('MERROW BRANCH · WORKING TIMETABLE', w * 0.05, h * 0.1);
  g.font = `${px(w, h, 8)}px monospace`; g.fillStyle = '#6a6458'; g.fillText('NIGHT TURN 22:00 - 06:00', w * 0.05, h * 0.16);
  const lh = px(w, h, 15);
  const list = extra ? [...rows.slice(0, 4), ['03:03', 'MERROW ROAD', 'PLATFORM 1'], ...rows.slice(4)] : rows;
  list.forEach((r, i) => {
    const y = h * 0.22 + (i + 1) * lh;
    g.fillStyle = r[0] === '03:03' ? '#8a2018' : '#1e1e1e'; g.font = `${px(w, h, 9)}px monospace`;
    g.fillText(r[0], w * 0.06, y); g.fillText(r[1], w * 0.24, y); if (w > h) g.fillText(r[2], w * 0.62, y);
    g.fillStyle = 'rgba(60,60,60,0.25)'; g.fillRect(w * 0.05, y + 4, w * 0.9, 1);
    if (circled && r[0] === '03:03') {
      g.strokeStyle = `rgba(70,70,70,${0.7 + 0.3 * Math.sin(t * 2)})`; g.lineWidth = 1.5;
      g.beginPath(); g.ellipse(w * 0.3, y - lh * 0.3, w * 0.27, lh * 0.75, -0.03, 0, 7); g.stroke();
    }
  });
}

export function drawTimetableBack(g, w, h, t, reveal = 1) {
  g.fillStyle = '#d8cfb6'; g.fillRect(0, 0, w, h);
  g.fillStyle = 'rgba(0,0,0,0.08)'; for (let i = 0; i < 6; i++) g.fillRect(0, h * (0.1 + i * 0.16), w, 1);
  const txt = 'IF YOU HOLD IT, IT WAITS FOR YOU. IF YOU CLEAR IT, IT GOES HOME.';
  g.fillStyle = '#f4f4f0'; g.font = `bold ${px(w, h, 12)}px monospace`;
  g.strokeStyle = '#222'; g.lineWidth = 3;
  const s = txt.slice(0, Math.floor(txt.length * clamp01(reveal)));
  const lines = []; let line = '';
  for (const wd of s.split(' ')) { const tst = line ? line + ' ' + wd : wd; if (g.measureText(tst).width > w * 0.84 && line) { lines.push(line); line = wd; } else line = tst; }
  if (line) lines.push(line);
  lines.forEach((l, i) => { const y = h * 0.42 + i * px(w, h, 18); g.strokeText(l, w * 0.08, y); g.fillText(l, w * 0.08, y); });
}

// The diagram board above the levers: tracks, numbered levers, track-circuit lights.
// ghost: 0 none, 1 = red light on the unpainted branch; cleared: branch light green
export function drawDiagram(g, w, h, t, ghost = 0, cleared = false, mainLit = -1) {
  g.fillStyle = '#20242a'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#3c4a3a'; g.fillRect(w * 0.03, h * 0.08, w * 0.94, h * 0.84);
  g.strokeStyle = '#e8e4d8'; g.lineWidth = Math.max(2, Math.round(h / 60));
  const y1 = h * 0.42, y2 = h * 0.62;
  g.beginPath(); g.moveTo(w * 0.06, y1); g.lineTo(w * 0.94, y1); g.moveTo(w * 0.06, y2); g.lineTo(w * 0.94, y2);
  g.moveTo(w * 0.35, y1); g.lineTo(w * 0.45, y2); g.moveTo(w * 0.6, y2); g.lineTo(w * 0.7, y1); g.stroke();
  // unpainted grey branch at the edge
  g.strokeStyle = '#6a6e70'; g.beginPath(); g.moveTo(w * 0.8, y1); g.lineTo(w * 0.94, h * 0.18); g.stroke();
  g.fillStyle = '#e8e4d8'; g.font = `${px(w, h, 7)}px monospace`;
  for (let i = 0; i < 12; i++) g.fillText(String(i + 1), w * (0.08 + i * 0.075), h * 0.86);
  // track circuit lights
  for (let i = 0; i < 6; i++) { const x = w * (0.12 + i * 0.14); g.fillStyle = i === mainLit ? '#ff3020' : '#20301e'; g.fillRect(x, y1 - 3, 5, 5); }
  if (ghost) {
    const on = 0.6 + 0.4 * Math.sin(t * 4);
    g.fillStyle = cleared ? `rgba(60,255,90,${on})` : `rgba(255,40,30,${on})`; g.fillRect(w * 0.885 - 3, h * 0.27 - 3, 7, 7);
  }
  g.fillStyle = '#c8c4b8'; g.font = `bold ${px(w, h, 8)}px monospace`; g.fillText('MERROW JN. SIGNAL BOX', w * 0.06, h * 0.16);
}

export function drawBellCodes(g, w, h, t, hiRow = -1) {
  g.fillStyle = '#ece6d2'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#222'; g.font = `bold ${px(w, h, 11)}px Georgia, serif`; g.fillText('BELL CODES', w * 0.06, h * 0.12);
  const rows = [['1', 'CALL ATTENTION'], ['2', 'TRAIN ENTERING SECTION'], ['3-1', 'IS LINE CLEAR? (FREIGHT)'], ['4', 'IS LINE CLEAR? (PASSENGER)'], ['2-2-2', 'OBSTRUCTION DANGER'], ['3-3', '?']];
  const lh = px(w, h, 16);
  rows.forEach((r, i) => { const y = h * 0.22 + (i + 1) * lh;
    if (i === hiRow) { g.fillStyle = `rgba(200,40,30,${0.2 + 0.1 * Math.sin(t * 6)})`; g.fillRect(0, y - lh + 4, w, lh); }
    g.fillStyle = i === 5 ? '#8a2018' : '#1e1e1e'; g.font = `${px(w, h, 9)}px monospace`; g.fillText(r[0], w * 0.08, y); g.fillText(i === 5 ? 'NOT ON THE LIST' : r[1], w * 0.3, y); });
}

export function drawRegister(g, w, h, t, reveal = 1) {
  g.fillStyle = '#0a0d18'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#9fb0e0'; g.font = `bold ${px(w, h, 10)}px monospace`; g.fillText('TRAIN REGISTER', w * 0.06, h * 0.12);
  const rows = ['22:10 FREIGHT ......... CLEARED', '23:40 MAIL ............ CLEARED', '00:55 COAL ............ CLEARED', '01:30 COAL ............ CLEARED'];
  g.font = `${px(w, h, 8)}px monospace`; g.fillStyle = '#c8d0e8';
  const lh = px(w, h, 13);
  rows.forEach((r, i) => g.fillText(w > h ? r : r.replace(/ \.+ /, ' '), w * 0.06, h * 0.24 + i * lh));
  const extra = ['HELD AT SIGNAL: 03:03', 'DRIVER: J. KELL'];
  const n = Math.floor(extra.join('').length * clamp01(reveal)); let k = n;
  extra.forEach((l, i) => { const s = l.slice(0, Math.max(0, k)); k -= l.length; g.fillStyle = i ? '#ffd640' : '#ff6a50'; g.font = `bold ${px(w, h, 10)}px monospace`; g.fillText(s, w * 0.06, h * 0.24 + (rows.length + 1 + i) * lh * 1.3); });
}

export function drawMagazineSM(g, w, h, t, zoom = 0) {
  g.fillStyle = '#f2ede2'; g.fillRect(0, 0, w, h);
  const z = 1 + zoom * 0.6; g.save(); g.translate(w * 0.04, h * 0.7); g.scale(z, z); g.translate(-w * 0.04, -h * 0.7);
  g.fillStyle = '#c0281e'; g.fillRect(0, 0, w, h * 0.12);
  g.fillStyle = '#fff'; g.font = `bold ${px(w, h, 11)}px Verdana, sans-serif`; g.fillText('PREVIEWS · SUMMER 2002', w * 0.04, h * 0.085);
  g.fillStyle = '#111'; g.font = `bold ${px(w, h, 16)}px Georgia, serif`; g.fillText('SIGNALMAN', w * 0.04, h * 0.23);
  // screenshot: lever frame
  g.fillStyle = '#2a2420'; g.fillRect(w * 0.04, h * 0.28, w * 0.42, h * 0.3);
  for (let i = 0; i < 8; i++) { g.fillStyle = i % 3 ? '#c02a20' : '#e0c030'; g.fillRect(w * (0.07 + i * 0.048), h * 0.36, 3, h * 0.16); }
  g.fillStyle = '#333'; g.font = `${px(w, h, 7)}px Verdana, sans-serif`;
  wrap(g, 'A relaxing railway simulation from a small new studio. Work the levers, keep the line clear.', w * 0.5, h * 0.31, w * 0.45, px(w, h, 9));
  g.fillStyle = '#111'; g.font = `italic ${px(w, h, 8)}px Georgia, serif`;
  wrap(g, '"I grew up next to a branch line that closed when I was a child." — founder J. Kell', w * 0.04, h * 0.66, w * 0.9, px(w, h, 11));
  g.fillStyle = '#7a1a14'; g.font = `bold ${px(w, h, 8)}px Verdana, sans-serif`;
  wrap(g, 'Every train in Signalman is real. Every one of them ran, once.', w * 0.04, h * 0.84, w * 0.9, px(w, h, 10));
  g.restore();
}

export function drawForumSM(g, w, h, t, reveal) {
  g.fillStyle = '#d4d0c8'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#3a4a7a'; g.fillRect(0, 0, w, h * 0.1);
  g.fillStyle = '#fff'; g.font = `bold ${px(w, h, 9)}px Verdana, sans-serif`; g.fillText('RetroGamerBoards :: Dead Pixel? (page 2)', 6, h * 0.07);
  g.fillStyle = '#e8e6e0'; g.fillRect(6, h * 0.16, w - 12, h * 0.3);
  g.fillStyle = '#555'; g.font = `${px(w, h, 8)}px Verdana, sans-serif`;
  wrap(g, 'Posted 2007 by railfan_ed: pretty sure they were near the lake. small team. nobody knows who ran it.', 10, h * 0.21, w - 24, px(w, h, 10));
  g.fillStyle = '#f2f0ea'; g.fillRect(6, h * 0.52, w - 12, h * 0.36);
  g.fillStyle = '#222'; g.font = `${px(w, h, 9)}px Verdana, sans-serif`;
  const txt = "Kell's dad drowned in Merrow Lake in '61. She started the studio in his boathouse. Never got over it.";
  wrap(g, txt.slice(0, Math.floor(txt.length * clamp01(reveal))), 10, h * 0.58, w - 24, px(w, h, 11));
  g.fillStyle = '#3a4a7a'; g.font = `bold ${px(w, h, 8)}px Verdana, sans-serif`; g.fillText('Reply by: guest', 10, h * 0.85);
}

export function drawDebugSM(g, w, h, t, sel) {
  g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#30ff60'; g.font = `${px(w, h, 9)}px monospace`;
  const items = ['BELL TEST', 'SPAWN TRAIN', 'WEATHER', 'LINE VIEW', 'FREE CAM'];
  g.fillText('SIGNALMAN DEBUG  b0.6', w * 0.08, h * 0.15);
  items.forEach((it, i) => { g.fillStyle = i === sel ? '#ffffff' : (i === 3 ? '#30ff60' : '#1c6030'); g.fillText((i === sel ? '> ' : '  ') + it + (i === 3 ? '' : '  [BROKEN]'), w * 0.08, h * 0.3 + i * px(w, h, 15)); });
}

// Line view from above: line runs off the branch, across the lake, past the boathouse, to my street.
export function drawLineView(g, w, h, t, reveal = 1, zoom = 0) {
  g.fillStyle = '#101418'; g.fillRect(0, 0, w, h);
  const z = 1 + zoom * 1.6, fx = w * 0.82, fy = h * 0.3;
  g.save(); g.translate(fx, fy); g.scale(z, z); g.translate(-fx, -fy);
  // lake
  g.fillStyle = '#9fb0bc'; g.beginPath(); g.ellipse(w * 0.46, h * 0.5, w * 0.16, h * 0.18, 0.2, 0, 7); g.fill();
  g.fillStyle = '#d8dee2'; g.font = `${px(w, h, 7)}px monospace`; g.fillText('MERROW LAKE', w * 0.39, h * 0.52);
  g.fillStyle = '#f0f0f0'; g.fillRect(w * 0.47, h * 0.3, 6, 4); g.fillStyle = '#8a8a8a'; g.fillText('14 MERROW RD', w * 0.49, h * 0.29);
  // painted line
  g.strokeStyle = '#d8d0b8'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, h * 0.82); g.lineTo(w * 0.22, h * 0.8); g.stroke();
  // ghost branch drawn progressively
  const pts = [[w * 0.22, h * 0.8], [w * 0.32, h * 0.64], [w * 0.46, h * 0.52], [w * 0.5, h * 0.33], [w * 0.66, h * 0.3], [w * 0.82, h * 0.3]];
  g.strokeStyle = '#ff4030'; g.setLineDash([3, 2]); g.beginPath();
  const n = (pts.length - 1) * clamp01(reveal); g.moveTo(...pts[0]);
  for (let i = 1; i <= Math.ceil(n) && i < pts.length; i++) { const f = Math.min(1, n - (i - 1)); const [ax, ay] = pts[i - 1], [bx, by] = pts[i]; g.lineTo(ax + (bx - ax) * f, ay + (by - ay) * f); }
  g.stroke(); g.setLineDash([]);
  // town blocks
  g.fillStyle = '#2a3038'; for (let i = 0; i < 14; i++) g.fillRect(w * (0.7 + (i % 5) * 0.05), h * (0.18 + Math.floor(i / 5) * 0.09), w * 0.035, h * 0.05);
  if (reveal >= 1) { g.fillStyle = `rgba(255,214,64,${0.6 + 0.4 * Math.sin(t * 4)})`; g.fillRect(w * 0.82 - 2, h * 0.3 - 2, 5, 5);
    g.font = `bold ${px(w, h, 7)}px monospace`; g.fillText('WREN CLOSE', w * 0.76, h * 0.27); }
  g.restore();
}
